import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing Turnstile token" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
    if (!secret) {
      // Secret not configured — allow through (dev/staging environment)
      console.warn("[Turnstile] TURNSTILE_SECRET_KEY not set. Skipping verification.");
      return new Response(
        JSON.stringify({ success: true, skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const formData = new FormData();
    formData.append("secret", secret);
    formData.append("response", token);

    const cfRes = await fetch("https://challenges.cloudflare.com/turnstile/v1/siteverify", {
      method: "POST",
      body: formData,
    });

    const cfData = await cfRes.json();

    if (!cfData.success) {
      console.warn("[Turnstile] Verification failed:", cfData["error-codes"]);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Bot verification failed. Please complete the security check.",
          errorCodes: cfData["error-codes"],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    console.log("[Turnstile] Verification passed. hostname:", cfData.hostname);
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("[Turnstile] Unexpected error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
