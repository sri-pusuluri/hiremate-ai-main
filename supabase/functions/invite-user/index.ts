import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function buildInviteEmailHtml({
  clientName,
  roleTitle,
  inviterName,
  actionLink,
  alreadyRegistered = false
}: {
  clientName: string,
  roleTitle: string,
  inviterName: string,
  actionLink: string,
  alreadyRegistered?: boolean
}) {
  const heading = alreadyRegistered
    ? `Workspace Assignment: ${clientName}`
    : `You've been invited to join ${clientName}!`
  
  const leadText = alreadyRegistered
    ? `You have been assigned to the <strong>${clientName}</strong> workspace on HireSort AI as <strong>${roleTitle}</strong>. Use the link below to access your workspace:`
    : `You've been invited by <strong>${inviterName}</strong> to join the <strong>${clientName}</strong> workspace on HireSort AI as <strong>${roleTitle}</strong>.`

  const buttonText = alreadyRegistered
    ? `Access ${clientName} Workspace`
    : `Accept Invitation & Join ${clientName}`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${heading} - HireSort AI</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; margin: 0; padding: 40px 16px; color: #f8fafc;">
  <div style="max-width: 580px; margin: 0 auto; background: #131b2e; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7);">
    
    <!-- Top Brand Header -->
    <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center;">
      <h1 style="font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin: 0;">HireSort AI</h1>
      <div style="font-size: 13px; color: #e0e7ff; margin-top: 6px; font-weight: 500; letter-spacing: 0.2px;">Enterprise ATS & AI Talent Screening</div>
    </div>

    <!-- Main Content -->
    <div style="padding: 36px 32px;">
      <h2 style="font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 14px; letter-spacing: -0.3px;">
        Welcome to HireSort AI!
      </h2>
      <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1; margin-bottom: 24px;">
        ${leadText}
      </p>

      <!-- Assignment Details Card -->
      <div style="background: #090d16; border-radius: 12px; border: 1px solid #1e293b; padding: 20px; margin-bottom: 28px;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; font-weight: 700; margin-bottom: 14px;">
          Workspace & Project Assignment Details
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 9px 0; color: #94a3b8; border-bottom: 1px solid #1e293b;">Assigned Client / Project:</td>
            <td style="padding: 9px 0; font-weight: 700; color: #38bdf8; text-align: right; border-bottom: 1px solid #1e293b;">${clientName}</td>
          </tr>
          <tr>
            <td style="padding: 9px 0; color: #94a3b8; border-bottom: 1px solid #1e293b;">Assigned Role:</td>
            <td style="padding: 9px 0; font-weight: 600; color: #f8fafc; text-align: right; border-bottom: 1px solid #1e293b;">${roleTitle}</td>
          </tr>
          <tr>
            <td style="padding: 9px 0; color: #94a3b8;">Invited By:</td>
            <td style="padding: 9px 0; font-weight: 500; color: #cbd5e1; text-align: right;">${inviterName}</td>
          </tr>
        </table>
      </div>

      <!-- Action Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${actionLink}" style="display: inline-block; background: #6366f1; color: #ffffff !important; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 34px; border-radius: 10px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.45);" target="_blank">
          ${buttonText}
        </a>
      </div>

      <!-- Secondary Link -->
      <div style="border-top: 1px solid #1e293b; padding-top: 20px; margin-top: 28px;">
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin-bottom: 8px;">
          If the button above does not work, copy and paste this link into your browser:
        </p>
        <p style="margin: 0; font-size: 11px; word-break: break-all;">
          <a href="${actionLink}" style="color: #818cf8; text-decoration: none;">${actionLink}</a>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #0c1220; border-top: 1px solid #1e293b; padding: 20px 32px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.6;">
      This email was generated for your access to the <strong>${clientName}</strong> workspace on HireSort AI.<br/>
      If you were not expecting this invitation, you can safely ignore this email.
    </div>
  </div>
</body>
</html>`
}

async function sendResendEmail({
  to,
  subject,
  html,
  resendApiKey
}: {
  to: string,
  subject: string,
  html: string,
  resendApiKey: string
}) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'HireSort AI <hiresortai@reply.zool.in>',
      to: [to],
      subject,
      html
    })
  })
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Resend API error (${res.status}): ${errorText}`)
  }
  return await res.json()
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

    const { email, role, clientId, clientName, projectName, inviterName } = await req.json()
    if (!email || !role) {
      throw new Error('Email and role are required.')
    }
    
    // Ensure role is valid and map to Postgres app_role enum ('admin' | 'recruiter')
    let dbRole = 'recruiter'
    let roleDisplay = 'Recruiter'
    if (role === 'admin' || role === 'client_admin' || role === 'super_admin') {
      dbRole = 'admin'
      roleDisplay = role === 'super_admin' ? 'Platform Super Admin' : (role === 'client_admin' ? 'Client Admin' : 'Administrator')
    } else if (role !== 'recruiter') {
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

    const jwt = authHeader.replace('Bearer ', '').trim()
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt)
    if (userError || !user) {
      throw new Error('Not authenticated')
    }

    // Verify caller is an admin or client_admin
    const { data: callerRoleData, error: callerRoleError } = await supabaseClient
      .from('user_roles')
      .select('role, client_id')
      .eq('user_id', user.id)
      .single()

    const isPlatformAdmin = callerRoleData?.role === 'admin' || callerRoleData?.role === 'super_admin'
    const isCallerClientAdmin = callerRoleData?.role === 'client_admin'

    if (callerRoleError || (!isPlatformAdmin && !isCallerClientAdmin)) {
      throw new Error('Only administrators can invite new users.')
    }

    // Enforce client_id scoping: if not platform admin, caller can only invite into their own client_id
    const targetClientId = isPlatformAdmin ? (clientId || callerRoleData?.client_id) : callerRoleData?.client_id

    // Initialize admin client to perform the invite
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Resolve client name for branded project / workspace display
    let resolvedClientName = clientName || projectName
    if (!resolvedClientName && targetClientId) {
      const { data: clientRow } = await supabaseAdmin
        .from('clients')
        .select('name')
        .eq('id', targetClientId)
        .maybeSingle()

      if (clientRow?.name) {
        resolvedClientName = clientRow.name
      } else if (targetClientId === '00000000-0000-0000-0000-000000000004' || targetClientId.includes('commit')) {
        resolvedClientName = 'Commit'
      } else if (targetClientId === '00000000-0000-0000-0000-000000000001' || targetClientId.includes('zool')) {
        resolvedClientName = 'Zool Technologies'
      }
    }

    if (!resolvedClientName) {
      resolvedClientName = targetClientId ? 'Client Workspace' : 'HireSort Platform (Global HQ)'
    }

    const resolvedInviter = inviterName || user.email || 'Administrator'

    // Ensure redirects always resolve to https://hiresortai.zool.in instead of localhost
    let reqOrigin = req.headers.get('origin') || 'https://hiresortai.zool.in'
    if (!reqOrigin || reqOrigin.includes('localhost') || reqOrigin.includes('127.0.0.1')) {
      reqOrigin = 'https://hiresortai.zool.in'
    }

    // Prepare metadata for Supabase Auth raw_user_meta_data
    const userMetadata = {
      client_id: targetClientId,
      client_name: resolvedClientName,
      project_name: resolvedClientName,
      workspace_name: resolvedClientName,
      role: role,
      role_title: roleDisplay,
      invited_by: resolvedInviter
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY') || ''

    let actionLink = ''
    let createdUser: any = null
    let alreadyRegistered = false

    // Step 1: Generate an invite link so we can send a branded email containing the project/workspace name
    try {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'invite',
        email,
        options: {
          redirectTo: `${reqOrigin}/?reset=true`,
          data: userMetadata
        }
      })

      if (linkError) {
        if (linkError.message && (linkError.message.includes('already been registered') || linkError.message.includes('already exists'))) {
          alreadyRegistered = true
          // User already exists; generate a recovery/setup link
          const { data: recData, error: recError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email,
            options: {
              redirectTo: `${reqOrigin}/?reset=true`
            }
          })
          if (!recError && recData?.properties?.action_link) {
            actionLink = recData.properties.action_link
            createdUser = recData.user
          }
        } else {
          console.warn('generateLink warning:', linkError)
        }
      } else if (linkData?.properties?.action_link) {
        actionLink = linkData.properties.action_link
        createdUser = linkData.user
      }
    } catch (genErr) {
      console.warn('generateLink failed, will fallback to inviteUserByEmail:', genErr)
    }

    // Step 2: Send branded email via Resend if actionLink and apiKey are available
    let emailSentViaResend = false
    if (actionLink && resendApiKey) {
      try {
        const subject = alreadyRegistered
          ? `You've been assigned to ${resolvedClientName} on HireSort AI`
          : `You've been invited to join ${resolvedClientName} on HireSort AI`

        const html = buildInviteEmailHtml({
          clientName: resolvedClientName,
          roleTitle: roleDisplay,
          inviterName: resolvedInviter,
          actionLink,
          alreadyRegistered
        })

        await sendResendEmail({
          to: email,
          subject,
          html,
          resendApiKey
        })
        emailSentViaResend = true
      } catch (resendErr) {
        console.error('Failed to send via Resend, falling back to Supabase email:', resendErr)
      }
    }

    // Step 3: Fallback to Supabase native inviteUserByEmail if Resend was not sent
    if (!emailSentViaResend) {
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${reqOrigin}/?reset=true`,
        data: userMetadata
      })

      if (inviteError) {
        if (inviteError.message && (inviteError.message.includes('already been registered') || inviteError.message.includes('already exists'))) {
          alreadyRegistered = true
          await supabaseAdmin.auth.resetPasswordForEmail(email, {
            redirectTo: `${reqOrigin}/?reset=true`
          })
        } else {
          throw inviteError
        }
      } else if (inviteData?.user) {
        createdUser = inviteData.user
      }
    }

    // Step 4: Ensure user_roles and client_id are up-to-date in database
    const userIdToUpdate = createdUser?.id
    if (userIdToUpdate) {
      await new Promise(r => setTimeout(r, 400))
      const updatePayload: Record<string, any> = { role: dbRole }
      if (targetClientId) updatePayload.client_id = targetClientId

      await supabaseAdmin
        .from('user_roles')
        .upsert({ user_id: userIdToUpdate, ...updatePayload }, { onConflict: 'user_id' })
    } else {
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (existingProfile?.id) {
        const updatePayload: Record<string, any> = { role: dbRole }
        if (targetClientId) updatePayload.client_id = targetClientId
        await supabaseAdmin.from('user_roles').update(updatePayload).eq('user_id', existingProfile.id)
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      user: createdUser,
      clientName: resolvedClientName,
      alreadyRegistered,
      emailSentVia: emailSentViaResend ? 'resend' : 'supabase',
      directLink: actionLink || `${reqOrigin}/auth?email=${encodeURIComponent(email)}&mode=signup`
    }), {
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
