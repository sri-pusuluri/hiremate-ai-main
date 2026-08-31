import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Server misconfiguration: missing Supabase credentials.')
    }

    const { email, role } = await req.json()
    if (!email || !role) {
      throw new Error('Email and role are required.')
    }
    
    // Ensure role is valid
    if (role !== 'admin' && role !== 'recruiter') {
      throw new Error('Invalid role specified.')
    }

    // Extract caller's JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Initialize regular client to verify caller
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Not authenticated')
    }

    // Verify caller is an admin
    const { data: callerRoleData, error: callerRoleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (callerRoleError || callerRoleData?.role !== 'admin') {
      throw new Error('Only admins can invite new users.')
    }

    // Initialize admin client to perform the invite
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Dynamically get the origin so redirects work for both localhost and production
    const reqOrigin = req.headers.get('origin') || 'https://hiresortai.zool.in'
    
    // Invite the user
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${reqOrigin}/`
    })
    
    if (inviteError) {
      throw inviteError
    }

    // The user will be automatically created in the auth.users table, and our DB trigger will insert them into profiles and user_roles.
    // However, the DB trigger defaults them to 'recruiter'. We need to update their role to the requested role.
    const newUserId = inviteData.user.id

    // Give the DB trigger a tiny amount of time to run just in case
    await new Promise(r => setTimeout(r, 500))

    const { error: updateError } = await supabaseAdmin
      .from('user_roles')
      .update({ role })
      .eq('user_id', newUserId)

    if (updateError) {
      console.warn('Invited user but failed to update role:', updateError)
      // We don't throw here because the invite succeeded, but we should probably log it.
    }

    return new Response(JSON.stringify({ success: true, user: inviteData.user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in invite-user function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
