import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const { candidateId, resumeText, jobId, jobTitle, jobRequirements } = body;

    if (!candidateId || !resumeText || !jobId) {
      throw new Error("Missing candidateId, resumeText or jobId");
    }

    // 1. Fetch Target Job Details if not provided in payload
    let targetTitle = jobTitle;
    let targetReqs = jobRequirements;
    let targetDesc = "";

    if (!targetTitle || !targetReqs) {
      const { data: jobRow } = await supabaseClient
        .from("jobs")
        .select("title, description, requirements")
        .eq("id", jobId)
        .maybeSingle();

      if (jobRow) {
        targetTitle = targetTitle || jobRow.title;
        targetReqs = targetReqs || jobRow.requirements;
        targetDesc = jobRow.description || "";
      }
    }

    const reqsString = Array.isArray(targetReqs) ? targetReqs.join(", ") : (targetReqs || "General engineering requirements");

    // Determine configured AI Provider
    const aiProvider = Deno.env.get("AI_PROVIDER") || "gemini";
    let embedding: number[] = [];
    let predictiveInsights: any = {};

    const evaluationPrompt = `You are HireSort AI, an expert ATS talent screening engine.
Evaluate this candidate's resume strictly against the target Job Description requirements.

Job Title: ${targetTitle || 'Software Engineer'}
Requirements: ${reqsString}
Job Description: ${targetDesc}

Resume:
${resumeText}

Analyze the candidate thoroughly and return a valid JSON object matching this schema:
{
  "score": "high" | "medium" | "low",
  "similarity": number (honest fit decimal between 0.15 and 0.96, e.g. 0.88 for strong match, 0.25 for poor/mismatched fit),
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["missingSkill1", "missingSkill2"],
  "interviewPassProb": number (integer between 10 and 99),
  "offerAcceptanceProb": number (integer between 40 and 95),
  "onboardingSuccessProb": number (integer between 30 and 98),
  "retentionRisk": "low" | "medium" | "high",
  "retentionRiskFactor": "short text summarizing retention risk details",
  "timeToJoinEstimate": "e.g. 15 days, 30 days, Immediate",
  "assessment": "2-3 sentences concise recruiter evaluation detailing candidate alignment and key gaps"
}`;

    if (aiProvider === "gemini") {
      const apiKey = Deno.env.get("GEMINI_API_KEY");
      if (!apiKey) throw new Error("GEMINI_API_KEY secret is not set in Supabase Dashboard.");

      // 1. Call Gemini Embeddings API (text-embedding-004)
      console.log("[Edge Function] Calling Gemini text-embedding-004 model API...");
      const embedResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: { parts: [{ text: resumeText }] },
          }),
        }
      );

      if (embedResponse.ok) {
        const embedData = await embedResponse.json();
        embedding = embedData.embedding?.values || [];
      }

      // 2. Call Gemini for Structured Evaluation
      console.log("[Edge Function] Calling Gemini gemini-1.5-pro model API...");
      const modelResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: evaluationPrompt }],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!modelResponse.ok) {
        const errBody = await modelResponse.text();
        console.error(`[Edge Function] Gemini structured call failed: Status ${modelResponse.status}:`, errBody);
        throw new Error(`Gemini generateContent API failed: Status ${modelResponse.status}: ${errBody}`);
      }

      const modelData = await modelResponse.json();
      const textResponse = modelData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      predictiveInsights = JSON.parse(textResponse);
      console.log("[Edge Function] Gemini generated insights parsed successfully.");

    } else if (aiProvider === "openai" || aiProvider === "chatgpt") {
      const apiKey = Deno.env.get("OPENAI_API_KEY");
      if (!apiKey) throw new Error("OPENAI_API_KEY secret is not set in Supabase Dashboard.");

      // 1. OpenAI Embeddings API
      console.log("[Edge Function] Calling OpenAI text-embedding-3-small API...");
      const embedResponse = await fetch(
        "https://api.openai.com/v1/embeddings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            input: resumeText,
            model: "text-embedding-3-small"
          })
        }
      );

      if (embedResponse.ok) {
        const embedData = await embedResponse.json();
        embedding = embedData.data?.[0]?.embedding || [];
      }

      // 2. OpenAI Chat Completions API
      console.log("[Edge Function] Calling OpenAI gpt-4o API...");
      const chatResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: evaluationPrompt
              }
            ],
            response_format: { type: "json_object" }
          })
        }
      );

      if (!chatResponse.ok) {
        const errBody = await chatResponse.text();
        throw new Error(`OpenAI Chat API failed: Status ${chatResponse.status}: ${errBody}`);
      }

      const chatData = await chatResponse.json();
      const textResponse = chatData.choices?.[0]?.message?.content || "{}";
      predictiveInsights = JSON.parse(textResponse);
      console.log("[Edge Function] OpenAI insights generated and parsed successfully.");

    } else {
      throw new Error(`Unsupported AI Provider: ${aiProvider}`);
    }

    // 3. Update candidate entry in database with genuine results
    const genuineSimilarity = predictiveInsights.similarity ?? 
      (predictiveInsights.interviewPassProb ? Math.round(predictiveInsights.interviewPassProb) / 100 : 0.65);

    const genuineScore = predictiveInsights.score || 
      (genuineSimilarity >= 0.72 ? "high" : (genuineSimilarity >= 0.45 ? "medium" : "low"));

    const { error: dbError } = await supabaseClient
      .from("candidates")
      .update({
        resume_text: resumeText,
        resume_embedding: embedding.length > 0 ? embedding : null,
        predictive_insights: predictiveInsights,
        cosine_similarity: genuineSimilarity,
        ai_score: genuineScore,
        matched_skills: predictiveInsights.matchedSkills || [],
        missing_skills: predictiveInsights.missingSkills || []
      })
      .eq("id", candidateId);

    if (dbError) throw dbError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Resume evaluated against target Job Description successfully!",
        score: genuineScore,
        similarity: genuineSimilarity
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
