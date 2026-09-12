import { supabase } from '@/integrations/supabase/client';
import { Job } from '@/types/hiresort';

export interface AIAnalysisResult {
  currentRole: string;
  company: string;
  experience: number;
  score: 'high' | 'medium' | 'low';
  similarity: number | null; // 0.0 to 1.0, or null if unprocessed/failed
  matchedSkills: string[];
  missingSkills: string[];
  interviewPassProb: number;
  offerAcceptanceProb: number;
  onboardingSuccessProb: number;
  retentionRisk: 'low' | 'medium' | 'high';
  retentionRiskFactor: string;
  timeToJoinEstimate: string;
  assessment: string;
  isUnprocessed?: boolean;
  error?: string;
}

// Comprehensive catalog of domain technical skills for deterministic ATS evaluation
const SKILL_CATALOG = [
  // Languages
  { label: 'PHP', patterns: [/\bphp\b/i, /\bphp\s*8/i, /\bphp\s*7/i] },
  { label: 'JavaScript', patterns: [/\bjavascript\b/i, /\bes6\+?\b/i, /\bjs\b/i] },
  { label: 'TypeScript', patterns: [/\btypescript\b/i, /\bts\b/i] },
  { label: 'Python', patterns: [/\bpython\b/i] },
  { label: 'HTML5/CSS3', patterns: [/\bhtml5?\b/i, /\bcss3?\b/i, /\bscss\b/i, /\bsass\b/i] },
  { label: 'SQL', patterns: [/\bsql\b/i] },

  // WordPress & CMS
  { label: 'WordPress Core', patterns: [/\bwordpress\b/i, /\bwp\b/i, /\bwp_query\b/i] },
  { label: 'Custom Themes', patterns: [/custom\s+theme/i, /theme\s+development/i, /fse\b/i, /full\s+site\s+editing/i] },
  { label: 'Custom Plugins', patterns: [/custom\s+plugin/i, /plugin\s+engineering/i, /plugin\s+development/i] },
  { label: 'Gutenberg Blocks', patterns: [/gutenberg/i, /block\s+editor/i, /@wordpress\/blocks/i] },
  { label: 'ACF Pro', patterns: [/\bacf\b/i, /advanced\s+custom\s+fields/i] },
  { label: 'WooCommerce', patterns: [/\bwoocommerce\b/i] },
  { label: 'Headless CMS', patterns: [/headless/i] },
  { label: 'Core Web Vitals', patterns: [/core\s+web\s+vitals/i, /lighthouse/i, /lcp\b/i, /page\s*speed/i] },

  // Frontend & Design
  { label: 'React', patterns: [/\breact(\.js)?\b/i] },
  { label: 'Next.js', patterns: [/\bnext(\.js)?\b/i] },
  { label: 'Vue.js', patterns: [/\bvue(\.js)?\b/i] },
  { label: 'Angular', patterns: [/\bangular\b/i] },
  { label: 'Tailwind CSS', patterns: [/tailwind/i] },
  { label: 'Redux Toolkit', patterns: [/redux/i] },
  { label: 'UI/UX Design', patterns: [/ui\/ux/i, /ux\/ui/i, /user\s+experience/i, /product\s+design/i] },
  { label: 'Figma', patterns: [/\bfigma\b/i, /wirefram/i, /prototyp/i] },
  { label: 'Design Systems', patterns: [/design\s+system/i, /design\s+token/i, /storybook/i] },

  // Backend & Cloud
  { label: 'Node.js', patterns: [/\bnode(\.js)?\b/i] },
  { label: 'Express', patterns: [/\bexpress(\.js)?\b/i] },
  { label: 'REST APIs', patterns: [/rest(ful)?\s+api/i, /\brest\s+apis?\b/i] },
  { label: 'GraphQL', patterns: [/graphql/i] },
  { label: 'PostgreSQL', patterns: [/postgres(ql)?\b/i] },
  { label: 'MySQL', patterns: [/\bmysql\b/i] },
  { label: 'MongoDB', patterns: [/\bmongo(db)?\b/i] },
  { label: 'Redis', patterns: [/\bredis\b/i] },
  { label: 'Docker', patterns: [/\bdocker\b/i, /container/i] },
  { label: 'Kubernetes', patterns: [/kubernetes\b/i, /\bk8s\b/i] },
  { label: 'AWS', patterns: [/\baws\b/i, /amazon\s+web\s+services/i, /\bs3\b/i, /\bec2\b/i] },
  { label: 'Git & CI/CD', patterns: [/\bgit\b/i, /github/i, /ci\/cd/i, /github\s+actions/i] },
  { label: 'System Design', patterns: [/system\s+design/i, /scalable\s+architecture/i, /microservices/i] },
];

/**
 * Extracts candidate resume text from available inputs without name-based hijacking.
 */
export async function extractResumeText(
  candidateName: string, 
  resumeUrl?: string | null, 
  rawResumeText?: string | null
): Promise<string> {
  // If actual candidate text was provided during application or parsed from file
  if (rawResumeText && rawResumeText.trim().length > 0) {
    return rawResumeText.trim();
  }

  // If only a URL exists or placeholder
  return rawResumeText || '';
}

/**
 * Deterministic, explainable ATS evaluation engine.
 * Matches candidate's actual resume against target Job Description requirements.
 */
export function evaluateResumeDeterministically(input: {
  candidateName: string;
  resumeText: string;
  job: {
    title: string;
    description?: string;
    requirements?: string[];
    responsibilities?: string[];
  };
}): AIAnalysisResult {
  const { candidateName, resumeText, job } = input;

  // 1. Validation: Fail explicitly if resume text is empty or unparseable
  if (!resumeText || resumeText.trim().length < 30) {
    return {
      currentRole: 'Unspecified',
      company: 'Unknown',
      experience: 0,
      score: 'low',
      similarity: null,
      matchedSkills: [],
      missingSkills: ['Resume content missing or unparseable'],
      interviewPassProb: 15,
      offerAcceptanceProb: 30,
      onboardingSuccessProb: 20,
      retentionRisk: 'high',
      retentionRiskFactor: 'Unable to verify candidate background due to missing resume text.',
      timeToJoinEstimate: 'Unknown',
      assessment: 'Evaluation could not be performed: No parseable resume text was extracted from this application.',
      isUnprocessed: true,
      error: 'Data Not Processed: Resume text is missing or unparseable.'
    };
  }

  const cleanResume = resumeText.toLowerCase();
  const jobFullText = `${job.title} ${job.description || ''} ${(job.requirements || []).join(' ')} ${(job.responsibilities || []).join(' ')}`.toLowerCase();

  // 2. Identify skills required by this specific Job Description
  const requiredSkills: string[] = [];
  for (const skill of SKILL_CATALOG) {
    const isRequired = skill.patterns.some(p => p.test(jobFullText));
    if (isRequired && !requiredSkills.includes(skill.label)) {
      requiredSkills.push(skill.label);
    }
  }

  // Ensure at least core baseline skills from requirements exist
  if (requiredSkills.length === 0 && Array.isArray(job.requirements) && job.requirements.length > 0) {
    for (const req of job.requirements) {
      if (req.length < 35) requiredSkills.push(req.trim());
    }
  }

  // 3. Match candidate skills against required skills
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of requiredSkills) {
    const catalogItem = SKILL_CATALOG.find(c => c.label === skill);
    const hasSkill = catalogItem 
      ? catalogItem.patterns.some(p => p.test(cleanResume))
      : cleanResume.includes(skill.toLowerCase());

    if (hasSkill) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  // 4. Extract experience years from resume
  let candidateExperience = 3; // fallback default
  const expMatch = resumeText.match(/(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|building|engineering|working)/i) 
    || resumeText.match(/(\d+)\s*(?:years?|yrs?)/i);
  if (expMatch && expMatch[1]) {
    const parsedExp = parseInt(expMatch[1], 10);
    if (!isNaN(parsedExp) && parsedExp > 0 && parsedExp <= 35) {
      candidateExperience = parsedExp;
    }
  }

  // Extract required experience from JD (e.g. 3-5 years)
  let targetExperience = 4;
  const jdExpMatch = jobFullText.match(/(\d+)[-–](\d+)\s*(?:years?|yrs?)/i) 
    || jobFullText.match(/(\d+)\+?\s*(?:years?|yrs?)/i);
  if (jdExpMatch) {
    if (jdExpMatch[2]) {
      targetExperience = parseInt(jdExpMatch[1], 10);
    } else if (jdExpMatch[1]) {
      targetExperience = parseInt(jdExpMatch[1], 10);
    }
  }

  // 5. Detect Core Role Specialization & Hard Mismatches
  const isWordPressRole = /wordpress|wp\b/i.test(job.title) || /wordpress/i.test(jobFullText);
  const isUxUiRole = /ui\/ux|ux\/ui|designer/i.test(job.title);
  const isMeanRole = /mean\s+stack|angular/i.test(job.title);

  let hasPrimarySpecialization = true;
  if (isWordPressRole) {
    hasPrimarySpecialization = /\bwordpress\b|\bphp\b/i.test(cleanResume);
  } else if (isUxUiRole) {
    hasPrimarySpecialization = /\bfigma\b|\bux\b|\bui\b|\bdesign\b/i.test(cleanResume);
  } else if (isMeanRole) {
    hasPrimarySpecialization = /\bangular\b/i.test(cleanResume) && /\bnode\b/i.test(cleanResume);
  }

  // 6. Calculate Honest Semantic Similarity Percentage (0.00 to 1.00)
  const totalSkillsCount = Math.max(requiredSkills.length, 1);
  const skillRatio = matchedSkills.length / totalSkillsCount;
  const expRatio = Math.min(1.0, candidateExperience / Math.max(targetExperience, 1));

  let rawSimilarity = (skillRatio * 0.75) + (expRatio * 0.25);

  // If primary required specialization is completely absent, candidate is a low fit
  if (!hasPrimarySpecialization) {
    rawSimilarity = Math.min(rawSimilarity, 0.32);
  }

  // Bound similarity between honest ranges (0.15 to 0.96)
  const similarity = Math.round(Math.max(0.15, Math.min(0.96, rawSimilarity)) * 100) / 100;

  // 7. Determine Score Category
  const score: 'high' | 'medium' | 'low' = 
    similarity >= 0.72 ? 'high' : (similarity >= 0.45 ? 'medium' : 'low');

  // 8. Extract Current Role & Company
  let currentRole = 'Software Engineer';
  let company = 'Independent';
  const roleCompanyMatch = resumeText.match(/###?\s*([^|\n]+)\s*\|\s*([^\n]+)/);
  if (roleCompanyMatch) {
    currentRole = roleCompanyMatch[1].trim();
    company = roleCompanyMatch[2].trim().replace(/\*.*$/, '');
  } else {
    const summaryRoleMatch = resumeText.match(/(?:experience as (?:a|an)|working as (?:a|an)|Summary\n\s*([^.]+Engineer|Developer|Designer))/i);
    if (summaryRoleMatch && summaryRoleMatch[1]) {
      currentRole = summaryRoleMatch[1].trim();
    }
  }

  // 9. Derive Predictive Metrics Proportional to Match Quality
  const interviewPassProb = Math.round(25 + similarity * 68);
  const offerAcceptanceProb = Math.round(55 + similarity * 35);
  const onboardingSuccessProb = Math.round(30 + similarity * 65);
  const retentionRisk: 'low' | 'medium' | 'high' = 
    similarity >= 0.70 ? 'low' : (similarity >= 0.45 ? 'medium' : 'high');

  const retentionRiskFactor = !hasPrimarySpecialization
    ? `Domain gap: Candidate lacks primary technologies required for ${job.title}.`
    : (similarity >= 0.70 ? 'Strong technical alignment with stable career progression.' : 'Partial skill overlap requires ramp-up in secondary stack.');

  // 10. Construct Recruiter Assessment Summary
  let assessment = '';
  if (!hasPrimarySpecialization) {
    assessment = `${candidateName} has ${candidateExperience} years of software experience but lacks core ${job.title} competencies (missing ${missingSkills.slice(0, 3).join(', ')}). Match is low due to fundamental domain misalignment.`;
  } else if (score === 'high') {
    assessment = `Strong match: ${candidateName} brings ${candidateExperience} years of relevant experience, satisfying ${matchedSkills.length} of ${requiredSkills.length} key requirements including ${matchedSkills.slice(0, 3).join(', ')}.`;
  } else {
    assessment = `Moderate fit: Candidate matches ${matchedSkills.length} requirements (${matchedSkills.slice(0, 2).join(', ')}), but has gaps in ${missingSkills.slice(0, 2).join(', ')}.`;
  }

  return {
    currentRole,
    company,
    experience: candidateExperience,
    score,
    similarity,
    matchedSkills,
    missingSkills,
    interviewPassProb,
    offerAcceptanceProb,
    onboardingSuccessProb,
    retentionRisk,
    retentionRiskFactor,
    timeToJoinEstimate: '15–30 days',
    assessment,
    isUnprocessed: false,
  };
}

/**
 * Main AI Screening entry point.
 * Tries live backend edge function or client AI keys; falls back to deterministic ATS engine.
 */
export async function analyzeCandidateWithAI(
  candidate: { id: string; name?: string; full_name?: string; resume_text?: string | null; resume_url?: string | null },
  job: { id: string; title: string; description?: string; requirements?: string[]; responsibilities?: string[] }
): Promise<AIAnalysisResult> {
  const name = candidate.name || candidate.full_name || 'Applicant';
  const resumeText = await extractResumeText(name, candidate.resume_url, candidate.resume_text);

  // 1. If resume text is empty or corrupted, return diagnostic failure immediately
  if (!resumeText || resumeText.trim().length < 25) {
    const failureResult: AIAnalysisResult = {
      currentRole: 'Unspecified',
      company: 'Unknown',
      experience: 0,
      score: 'low',
      similarity: null,
      matchedSkills: [],
      missingSkills: job.requirements || ['Resume unparseable'],
      interviewPassProb: 10,
      offerAcceptanceProb: 20,
      onboardingSuccessProb: 15,
      retentionRisk: 'high',
      retentionRiskFactor: 'Missing or unreadable resume text.',
      timeToJoinEstimate: 'Unknown',
      assessment: 'Screening failed: No parseable resume text was available for this candidate.',
      isUnprocessed: true,
      error: 'Data Not Processed: Missing or unparseable resume text.'
    };

    try {
      await supabase
        .from('candidates')
        .update({
          ai_score: null,
          cosine_similarity: null,
          matched_skills: [],
          missing_skills: job.requirements || [],
          predictive_insights: {
            assessment: failureResult.assessment,
            error: failureResult.error,
            evaluatedAt: new Date().toISOString()
          }
        })
        .eq('id', candidate.id);
    } catch (e) {
      console.debug('Failed to record failure in DB:', e);
    }

    return failureResult;
  }

  const openaiKey = localStorage.getItem('openai_api_key') || import.meta.env.VITE_OPENAI_API_KEY;
  const geminiKey = localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY;

  const jobTitle = job.title || 'Software Engineer';
  const jobDesc = job.description || 'Modern software development role.';
  const reqs = Array.isArray(job.requirements) && job.requirements.length > 0 
    ? job.requirements.join(', ') 
    : 'Core engineering and domain requirements';

  const prompt = `You are HireSort AI, an expert ATS talent screening engine.
Evaluate this candidate's resume against the exact Job Description requirements.

Job Title: ${jobTitle}
Requirements: ${reqs}
Job Description: ${jobDesc}

Candidate Name: ${name}
Resume Text:
${resumeText}

Analyze the candidate thoroughly and return a JSON object with this EXACT structure:
{
  "currentRole": "candidate's actual most recent job title from resume",
  "company": "candidate's actual most recent company or 'Independent'",
  "experience": number (actual total years of experience, integer),
  "score": "high" | "medium" | "low",
  "similarity": number (honest fit percentage between 0.10 and 0.98, e.g. 0.88 for strong fit, 0.25 for poor fit),
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["missingSkill1", "missingSkill2"],
  "interviewPassProb": number (integer between 10 and 99),
  "offerAcceptanceProb": number (integer between 40 and 95),
  "onboardingSuccessProb": number (integer between 30 and 98),
  "retentionRisk": "low" | "medium" | "high",
  "retentionRiskFactor": "short explanation of retention risk",
  "timeToJoinEstimate": "e.g. 15 days, 30 days, Immediate",
  "assessment": "2-3 sentences concise recruiter evaluation detailing candidate alignment and key gaps"
};

Output ONLY valid JSON without markdown wrapping.`;

  let result: AIAnalysisResult | null = null;

  // 1. Try Backend Edge Function
  try {
    const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('ingest-resume', {
      body: {
        candidateId: candidate.id,
        resumeText,
        jobId: job.id,
        jobTitle: job.title,
        jobRequirements: job.requirements || []
      }
    });

    if (!edgeErr && edgeData?.success) {
      const { data: updatedCand } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidate.id)
        .maybeSingle();

      if (updatedCand && updatedCand.cosine_similarity) {
        const insights = (updatedCand.predictive_insights as any) || {};
        result = {
          currentRole: updatedCand.role_title || jobTitle,
          company: updatedCand.company || 'Independent',
          experience: updatedCand.experience || 3,
          score: (updatedCand.ai_score as any) || 'medium',
          similarity: updatedCand.cosine_similarity,
          matchedSkills: updatedCand.matched_skills || [],
          missingSkills: updatedCand.missing_skills || [],
          interviewPassProb: insights.interviewPassProb || 70,
          offerAcceptanceProb: insights.offerAcceptanceProb || 70,
          onboardingSuccessProb: insights.onboardingSuccessProb || 75,
          retentionRisk: insights.retentionRisk || 'medium',
          retentionRiskFactor: insights.retentionRiskFactor || 'Standard career trajectory',
          timeToJoinEstimate: insights.timeToJoinEstimate || '15–30 days',
          assessment: insights.assessment || 'Candidate evaluated via AI screening.',
          isUnprocessed: false
        };
      }
    }
  } catch (edgeErr) {
    console.debug('[AI Screening] Backend Edge Function skipped, using direct evaluation:', edgeErr);
  }

  // 2. Client OpenAI Key
  if (!result && openaiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        })
      });

      if (res.ok) {
        const data = await res.json();
        result = JSON.parse(data.choices?.[0]?.message?.content || '{}');
      }
    } catch (err) {
      console.warn('[AI Screening] OpenAI call failed:', err);
    }
  }

  // 3. Client Gemini Key
  if (!result && geminiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (res.ok) {
        const data = await res.json();
        result = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
      }
    } catch (err) {
      console.warn('[AI Screening] Gemini call failed:', err);
    }
  }

  // 4. Reliable Deterministic ATS Fallback (Runs if no external LLM key is configured)
  if (!result) {
    result = evaluateResumeDeterministically({
      candidateName: name,
      resumeText,
      job
    });
  }

  // 5. Update Supabase with honest, dynamic evaluation results
  try {
    await supabase
      .from('candidates')
      .update({
        role_title: result.currentRole,
        company: result.company,
        experience: result.experience,
        ai_score: result.score,
        cosine_similarity: result.similarity,
        matched_skills: result.matchedSkills,
        missing_skills: result.missingSkills,
        predictive_insights: {
          currentRole: result.currentRole,
          company: result.company,
          interviewPassProb: result.interviewPassProb,
          offerAcceptanceProb: result.offerAcceptanceProb,
          onboardingSuccessProb: result.onboardingSuccessProb,
          retentionRisk: result.retentionRisk,
          retentionRiskFactor: result.retentionRiskFactor,
          timeToJoinEstimate: result.timeToJoinEstimate,
          assessment: result.assessment,
          evaluatedAt: new Date().toISOString()
        }
      })
      .eq('id', candidate.id);
  } catch (dbErr) {
    console.error('[AI Screening] Failed to update candidate in database:', dbErr);
  }

  return result;
}
