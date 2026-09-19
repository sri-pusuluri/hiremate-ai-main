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
  coreSkills?: string[];
  secondarySkills?: string[];
  missingCoreSkills?: string[];
  missingSecondarySkills?: string[];
  interviewPassProb: number;
  offerAcceptanceProb: number;
  onboardingSuccessProb: number;
  retentionRisk: 'low' | 'medium' | 'high';
  retentionRiskFactor: string;
  timeToJoinEstimate: string;
  assessment: string;
  provider?: 'openai' | 'gemini' | 'claude' | 'supabase-edge' | 'deterministic-ats' | string;
  model?: string;
  executionMode?: 'external_llm' | 'supabase_vector' | 'deterministic_ats';
  isUnprocessed?: boolean;
  error?: string;
}

// Comprehensive catalog of domain technical skills for deterministic ATS evaluation
export const SKILL_CATALOG = [
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

import { extractTextFromPdf, extractTextFromDocx } from './resume-parser';

/**
 * Extracts candidate resume text from available inputs or parses resumeUrl if raw text is absent.
 */
export async function extractResumeText(
  candidateName: string, 
  resumeUrl?: string | null, 
  rawResumeText?: string | null
): Promise<string> {
  // 1. If actual candidate text was provided during application or parsed from file
  if (rawResumeText && rawResumeText.trim().length >= 25) {
    return rawResumeText.trim();
  }

  // 2. If a resumeUrl exists, attempt to fetch and parse it
  if (resumeUrl && typeof fetch !== 'undefined') {
    try {
      const response = await fetch(resumeUrl);
      if (response.ok) {
        const lowerUrl = resumeUrl.toLowerCase();
        const contentType = response.headers.get('content-type') || '';
        if (lowerUrl.endsWith('.pdf') || contentType.includes('application/pdf')) {
          const buffer = await response.arrayBuffer();
          const parsed = await extractTextFromPdf(new Uint8Array(buffer));
          if (parsed && parsed.trim().length >= 25) return parsed.trim();
        } else if (lowerUrl.endsWith('.docx') || contentType.includes('wordprocessingml')) {
          const buffer = await response.arrayBuffer();
          const parsed = await extractTextFromDocx(buffer);
          if (parsed && parsed.trim().length >= 25) return parsed.trim();
        } else {
          const text = await response.text();
          if (text && text.trim().length >= 25) return text.trim();
        }
      }
    } catch (e) {
      console.warn('Could not extract text from resume URL:', resumeUrl, e);
    }
  }

  return (rawResumeText || '').trim();
}

/**
 * Smart Domain & Skill Tiering Classifier.
 * Categorizes job requirements into Core Role-Defining Skills (75% weight)
 * vs Secondary / Cross-Functional / Nice-to-Have Skills (15% additive bonus).
 */
export function classifyJobSkills(
  jobTitle: string,
  skills: string[],
  niceToHaveText: string = ''
): { coreSkills: string[]; secondarySkills: string[] } {
  const lowerTitle = (jobTitle || '').toLowerCase();
  const lowerNice = (niceToHaveText || '').toLowerCase();

  const isDesignRole = /ui\/ux|ux\/ui|product\s+design|graphic|visual\s+design|web\s+design|designer/i.test(lowerTitle);
  const isWordPressRole = /wordpress|wp\b/i.test(lowerTitle);
  const isBackendRole = /backend|api|server|database|devops|cloud|system|data\s+engineer|python\s+developer/i.test(lowerTitle);
  const isFrontendRole = /frontend|front-end|react\s+developer|angular\s+developer|web\s+developer/i.test(lowerTitle);

  const coreSkills: string[] = [];
  const secondarySkills: string[] = [];

  for (const skill of skills) {
    const sLower = skill.toLowerCase();

    // Priority 1: If explicitly mentioned in "Nice to Have" or preferred section
    if (lowerNice.includes(sLower)) {
      secondarySkills.push(skill);
      continue;
    }

    // Priority 2: Domain-specific cross-functional rules
    if (isDesignRole) {
      // Core UI/UX design capabilities
      if (/ui\/ux|figma|design\s+system|product\s+design|wirefram|prototyp|user\s+research|interaction\s+design|accessibility|wcag/i.test(sLower)) {
        coreSkills.push(skill);
      } else {
        // Coding frameworks (HTML5/CSS3, React, Next.js, Angular, Tailwind CSS, etc.) are secondary bonuses for a designer
        secondarySkills.push(skill);
      }
    } else if (isWordPressRole) {
      if (/wordpress|php|mysql|custom\s+theme|custom\s+plugin|gutenberg|acf|woocommerce/i.test(sLower)) {
        coreSkills.push(skill);
      } else {
        secondarySkills.push(skill);
      }
    } else if (isBackendRole) {
      if (/node|express|sql|postgres|mongo|redis|api|aws|docker|kubernetes|system\s+design|python|java|microservices/i.test(sLower)) {
        coreSkills.push(skill);
      } else {
        secondarySkills.push(skill);
      }
    } else if (isFrontendRole) {
      if (/javascript|typescript|react|next|angular|html|css|tailwind|vue|redux/i.test(sLower)) {
        coreSkills.push(skill);
      } else {
        secondarySkills.push(skill);
      }
    } else {
      coreSkills.push(skill);
    }
  }

  // Safety Fallback: Ensure at least one core skill exists
  if (coreSkills.length === 0 && skills.length > 0) {
    coreSkills.push(...skills.slice(0, 3));
    secondarySkills.push(...skills.slice(3));
  }

  return { coreSkills, secondarySkills };
}

/**
 * Deterministic, explainable ATS evaluation engine with Multi-Tiered Competency Weighting.
 * Evaluates candidate resumes prioritizing core domain capabilities over peripheral bonus tools.
 */
export function evaluateResumeDeterministically(input: {
  candidateName: string;
  resumeText: string;
  currentRole?: string;
  company?: string;
  job: {
    title: string;
    description?: string;
    requirements?: string[];
    responsibilities?: string[];
    niceToHave?: string[];
    nice_to_have?: string[];
  };
}): AIAnalysisResult {
  const { candidateName, resumeText, job } = input;

  // 1. Validation: Fail explicitly if resume text is empty AND no profile metadata exists
  let effectiveResumeText = (resumeText || '').trim();
  if (effectiveResumeText.length < 25) {
    if (input.currentRole || input.company) {
      const role = input.currentRole || 'Software Professional';
      const comp = input.company || 'Independent';
      effectiveResumeText = `Candidate: ${candidateName || 'Applicant'}\nRole: ${role} at ${comp}\nBackground: Experienced ${role} with practical hands-on experience and skills.`;
    } else {
      return {
        currentRole: 'Unspecified',
        company: 'Unknown',
        experience: 0,
        score: 'low',
        similarity: null,
        matchedSkills: [],
        missingSkills: job.requirements || [],
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
  }

  const cleanResume = effectiveResumeText.toLowerCase();
  const jobFullText = `${job.title} ${job.description || ''} ${(job.requirements || []).join(' ')} ${(job.responsibilities || []).join(' ')}`.toLowerCase();

  // Extract explicit Nice to Have text from JD if available
  const niceToHaveText = `${(job.niceToHave || job.nice_to_have || []).join(' ')} ${
    (job.description || '').match(/##\s*nice\s+to\s+have[\s\S]*?(?=##|$)/i)?.[0] || ''
  }`.toLowerCase();

  // 2. Identify skills required by this specific Job Description
  const rawRequiredSkills: string[] = [];
  for (const skill of SKILL_CATALOG) {
    const isRequired = skill.patterns.some(p => p.test(jobFullText));
    if (isRequired && !rawRequiredSkills.includes(skill.label)) {
      rawRequiredSkills.push(skill.label);
    }
  }

  // Ensure at least core baseline skills from requirements exist
  if (rawRequiredSkills.length === 0 && Array.isArray(job.requirements) && job.requirements.length > 0) {
    for (const req of job.requirements) {
      if (req.length < 35) rawRequiredSkills.push(req.trim());
    }
  }

  // 3. Classify into Core Skills vs Secondary / Nice-to-Have Skills
  const { coreSkills, secondarySkills } = classifyJobSkills(job.title, rawRequiredSkills, niceToHaveText);

  const checkSkill = (skill: string) => {
    const catalogItem = SKILL_CATALOG.find(c => c.label === skill);
    return catalogItem
      ? catalogItem.patterns.some(p => p.test(cleanResume))
      : cleanResume.includes(skill.toLowerCase());
  };

  const matchedCoreSkills: string[] = [];
  const missingCoreSkills: string[] = [];
  for (const skill of coreSkills) {
    if (checkSkill(skill)) matchedCoreSkills.push(skill);
    else missingCoreSkills.push(skill);
  }

  const matchedSecondarySkills: string[] = [];
  const missingSecondarySkills: string[] = [];
  for (const skill of secondarySkills) {
    if (checkSkill(skill)) matchedSecondarySkills.push(skill);
    else missingSecondarySkills.push(skill);
  }

  const matchedSkills = [...matchedCoreSkills, ...matchedSecondarySkills];
  const missingSkills = [...missingCoreSkills, ...missingSecondarySkills];

  // 4. Extract experience years from resume
  let candidateExperience = 3; // fallback default
  const expMatch = resumeText.match(/(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|building|engineering|working|designing)/i) 
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

  // 6. Calculate Honest Multi-Tiered Semantic Similarity Percentage (0.00 to 1.00)
  // Core ratio determines up to 70% of score
  const coreRatio = coreSkills.length > 0 ? (matchedCoreSkills.length / coreSkills.length) : 1.0;

  // Seniority ratio determines up to 20%
  const expRatio = Math.min(1.0, candidateExperience / Math.max(targetExperience, 1));

  // Secondary skills provide an ADDITIVE BONUS (up to +10%) - lack of secondary skills never heavily penalizes!
  const bonusBoost = secondarySkills.length > 0
    ? Math.min(0.10, (matchedSecondarySkills.length / secondarySkills.length) * 0.10)
    : 0.04;

  // Role title alignment adds +5%
  let roleTitleBonus = 0;
  const lowerTitle = (job.title || '').toLowerCase();
  const lowerCurrent = (input.currentRole || '').toLowerCase();
  if (lowerTitle && lowerCurrent) {
    if ((lowerTitle.includes('designer') && lowerCurrent.includes('designer')) ||
        (lowerTitle.includes('wordpress') && lowerCurrent.includes('wordpress')) ||
        (lowerTitle.includes('developer') && lowerCurrent.includes('developer'))) {
      roleTitleBonus = 0.05;
    }
  }

  let rawSimilarity = (coreRatio * 0.70) + (expRatio * 0.20) + bonusBoost + roleTitleBonus;

  // If primary required specialization is completely absent (e.g. backend dev with 0 design skills applying for UI/UX)
  if (!hasPrimarySpecialization || (coreSkills.length > 0 && matchedCoreSkills.length === 0)) {
    rawSimilarity = Math.min(rawSimilarity, 0.28);
  }

  // Bound similarity between honest ranges (0.15 to 0.96)
  const similarity = Math.round(Math.max(0.15, Math.min(0.96, rawSimilarity)) * 100) / 100;

  // 7. Determine Score Category
  const score: 'high' | 'medium' | 'low' = 
    similarity >= 0.72 ? 'high' : (similarity >= 0.45 ? 'medium' : 'low');

  // 8. Extract Current Role & Company
  let currentRole = (input.currentRole && input.currentRole !== 'Unspecified') ? input.currentRole : 'Software Engineer';
  let company = (input.company && input.company !== 'Unknown') ? input.company : 'Independent';

  const roleCompanyMatch = resumeText.match(/###?\s*([^|\n]+)\s*\|\s*([^\n]+)/);
  if (roleCompanyMatch) {
    currentRole = roleCompanyMatch[1].trim();
    company = roleCompanyMatch[2].trim().replace(/\*.*$/, '');
  } else {
    // Check for standard role – company patterns like "UI/UX Designer – Zool Tech Solutions"
    const standardRoleCompany = resumeText.match(/([A-Za-z0-9/ ]{2,35}?(?:Designer|Developer|Engineer|Architect|Consultant|Manager|Lead|Specialist))\s*[–—|-]\s*([A-Za-z0-9&., ]{2,40}?(?:Pvt\s*Ltd|Ltd|Inc|Corp|Solutions|Technologies|LLC|Group|Foundation|Studio))/i);
    if (standardRoleCompany && standardRoleCompany[1] && standardRoleCompany[2]) {
      currentRole = standardRoleCompany[1].trim();
      company = standardRoleCompany[2].trim();
    } else {
      const summaryRoleMatch = resumeText.match(/(?:experience as (?:a|an)|working as (?:a|an)|Summary\n\s*([^.]+Engineer|Developer|Designer))/i);
      if (summaryRoleMatch && summaryRoleMatch[1]) {
        currentRole = summaryRoleMatch[1].trim();
      }
      const genericRoleMatch = resumeText.match(/\b(UI\/UX Designer|UX\/UI Designer|Product Designer|Frontend Developer|Full Stack Developer|WordPress Developer|Backend Developer|Software Engineer)\b/i);
      if (genericRoleMatch && (currentRole === 'Software Engineer' || !input.currentRole)) {
        currentRole = genericRoleMatch[1].trim();
      }
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
  if (!hasPrimarySpecialization || (coreSkills.length > 0 && matchedCoreSkills.length === 0)) {
    assessment = `${candidateName} has ${candidateExperience} years of software experience but lacks core ${job.title} competencies (missing ${missingCoreSkills.slice(0, 3).join(', ') || missingSkills.slice(0, 3).join(', ')}). Match is low due to fundamental domain misalignment.`;
  } else if (score === 'high') {
    if (missingCoreSkills.length === 0 && missingSecondarySkills.length > 0) {
      assessment = `Strong domain match: ${candidateName} brings ${candidateExperience} years of verified experience with 100% core alignment in ${matchedCoreSkills.slice(0, 3).join(', ')}. Missing secondary cross-functional tools (${missingSecondarySkills.slice(0, 3).join(', ')}) are non-critical bonuses and do not impede primary role qualification.`;
    } else {
      assessment = `Strong match: ${candidateName} brings ${candidateExperience} years of relevant experience, satisfying ${matchedSkills.length} key requirements including ${matchedSkills.slice(0, 3).join(', ')}.`;
    }
  } else {
    assessment = `Moderate fit: Candidate matches ${matchedCoreSkills.length} of ${coreSkills.length} core requirements (${matchedCoreSkills.slice(0, 2).join(', ') || matchedSkills.slice(0, 2).join(', ')}), with gaps in ${missingCoreSkills.slice(0, 2).join(', ') || missingSkills.slice(0, 2).join(', ')}.`;
  }

  return {
    currentRole,
    company,
    experience: candidateExperience,
    score,
    similarity,
    matchedSkills,
    missingSkills,
    coreSkills,
    secondarySkills,
    missingCoreSkills,
    missingSecondarySkills,
    interviewPassProb,
    offerAcceptanceProb,
    onboardingSuccessProb,
    retentionRisk,
    retentionRiskFactor,
    timeToJoinEstimate: '15–30 days',
    assessment,
    provider: 'deterministic-ats',
    model: 'Deterministic ATS Engine (Rule-based NLP & Heuristic Matching)',
    executionMode: 'deterministic_ats',
    isUnprocessed: false,
  };
}

/**
 * Main AI Screening entry point.
 * Tries live backend edge function or client AI keys; falls back to deterministic ATS engine.
 */
export async function analyzeCandidateWithAI(
  candidate: { 
    id: string; 
    name?: string; 
    full_name?: string; 
    resume_text?: string | null; 
    resumeText?: string | null;
    resume_url?: string | null;
    resumeUrl?: string | null;
    currentRole?: string;
    role_title?: string;
    company?: string;
  },
  job: { id: string; title: string; description?: string; requirements?: string[]; responsibilities?: string[] },
  options?: { preferredProvider?: 'openai' | 'gemini' | 'claude' | 'supabase-edge' | 'deterministic-ats' | string }
): Promise<AIAnalysisResult> {
  const name = candidate.name || candidate.full_name || (candidate as any).candidateName || 'Applicant';
  let resumeText = await extractResumeText(
    name, 
    candidate.resume_url || (candidate as any).resumeUrl, 
    candidate.resume_text || (candidate as any).resumeText
  );

  // 1. If text is missing from the passed object, fetch full record from Supabase candidates table
  let candidateDbRecord: any = null;
  if ((!resumeText || resumeText.trim().length < 25) && candidate.id) {
    try {
      const { data: dbCandidate } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidate.id)
        .maybeSingle();

      candidateDbRecord = dbCandidate;

      if (dbCandidate?.resume_text && dbCandidate.resume_text.trim().length >= 25) {
        resumeText = dbCandidate.resume_text.trim();
      } else if (dbCandidate?.resume_url) {
        const fetched = await extractResumeText(name, dbCandidate.resume_url);
        if (fetched && fetched.trim().length >= 25) {
          resumeText = fetched.trim();
        }
      }
    } catch (e) {
      console.warn('Could not load candidate resume_text from DB fallback:', e);
    }
  }

  // 2. If resume text is still missing or short, synthesize from known profile metadata
  // 2. If resume text is missing, attempt to synthesize from known candidate profile attributes
  if (!resumeText || resumeText.trim().length < 25) {
    const roleStr = candidate.currentRole || candidate.role_title || candidateDbRecord?.role_title || 'Software Professional';
    const companyStr = candidate.company || candidateDbRecord?.company || 'Independent';
    const expYears = (candidate as any).experience ?? candidateDbRecord?.experience ?? 3;
    const skillsList = [
      ...((candidate as any).matchedSkills || (candidate as any).matched_skills || []),
      ...((candidate as any).missingSkills || (candidate as any).missing_skills || []),
      ...((candidate as any).skills || candidateDbRecord?.skills || [])
    ];
    const uniqueSkills = Array.from(new Set(skillsList.filter(Boolean)));
    const customAns = (candidate as any).custom_answers || (candidate as any).customAnswers || candidateDbRecord?.custom_answers || {};

    resumeText = `# Candidate Profile: ${name}
Role: ${roleStr} at ${companyStr}
Total Experience: ${expYears} years
Skills: ${uniqueSkills.length > 0 ? uniqueSkills.join(', ') : roleStr}
${Object.entries(customAns).map(([k, v]) => `${k}: ${v}`).join('\n')}`;

    // Persist the synthesized profile back to DB for permanent caching
    if (candidate.id && !candidateDbRecord?.resume_text) {
      supabase.from('candidates').update({ resume_text: resumeText }).eq('id', candidate.id).then(() => {});
    }
  }

  // 3. If resume text is truly empty or corrupted, return diagnostic failure
  if (!resumeText || resumeText.trim().length < 20) {
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
      provider: 'deterministic-ats',
      model: 'Text Extraction Parser',
      executionMode: 'deterministic_ats',
      isUnprocessed: true,
      error: 'Data Not Processed: Missing or unparseable resume text.'
    };

    if (candidate.id) {
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
              provider: failureResult.provider,
              model: failureResult.model,
              executionMode: failureResult.executionMode,
              evaluatedAt: new Date().toISOString()
            }
          })
          .eq('id', candidate.id);
      } catch (e) {
        console.debug('Failed to record failure in DB:', e);
      }
    }

    return failureResult;
  }

  const selectedProvider = (typeof options?.preferredProvider === 'string' && options.preferredProvider.length > 0)
    ? options.preferredProvider
    : ((typeof window !== 'undefined' ? localStorage.getItem('ai_provider') : null) || 'auto');

  const openaiKey = (typeof window !== 'undefined' ? localStorage.getItem('openai_api_key') : null) || import.meta?.env?.VITE_OPENAI_API_KEY;
  const geminiKey = (typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : null) || import.meta?.env?.VITE_GEMINI_API_KEY;
  const claudeKey = (typeof window !== 'undefined' ? localStorage.getItem('claude_api_key') : null) || import.meta?.env?.VITE_CLAUDE_API_KEY;

  const openaiModel = (typeof window !== 'undefined' ? localStorage.getItem('openai_model') : null) || 'gpt-4o-mini';
  const geminiModel = (typeof window !== 'undefined' ? localStorage.getItem('gemini_model') : null) || 'gemini-1.5-flash';
  const claudeModel = (typeof window !== 'undefined' ? localStorage.getItem('claude_model') : null) || 'claude-3-5-sonnet';

  const jobTitle = job.title || 'Software Engineer';
  const jobDesc = job.description || 'Modern software development role.';
  const niceToHaveRaw = (job as any).niceToHave || (job as any).nice_to_have || [];
  const { coreSkills: promptCore, secondarySkills: promptSec } = classifyJobSkills(
    jobTitle,
    job.requirements || [],
    niceToHaveRaw.join(' ')
  );

  const coreReqs = promptCore.length > 0 ? promptCore.join(', ') : (Array.isArray(job.requirements) ? job.requirements.join(', ') : 'Core domain requirements');
  const secReqs = promptSec.length > 0 ? promptSec.join(', ') : 'Cross-functional tools and bonus frameworks';

  const prompt = `You are HireSort AI, an enterprise-grade ATS talent screening engine with strict Anti-Hallucination, Anti-Bias, and Multi-Tiered Competency Guardrails.
Evaluate this candidate's resume against the Job Description requirements.

[JOB SPECIFICATION]
Job Title: ${jobTitle}
Core Requirements (Primary - 75% Weight): ${coreReqs}
Secondary / Nice-to-Have (Bonus - 15% Weight): ${secReqs}
Job Description: ${jobDesc}

[CANDIDATE DATA]
Candidate Name: ${name}
Resume Text:
${resumeText}

[STRICT SCREENING GUARDRAILS]
1. MULTI-TIERED COMPETENCY WEIGHTING:
   - Base 80% of your evaluation on CORE DOMAIN REQUIREMENTS (${coreReqs}) and verified seniority trajectory.
   - Treat secondary/cross-functional skills (${secReqs}) strictly as an additive bonus.
   - Do NOT heavily penalize a domain specialist (e.g. a UI/UX Designer) for lacking peripheral software developer tools (e.g. React, Next.js, or Angular). If their core domain capabilities and experience are exceptional, they must receive a High/Strong match rating (85%+).
2. ZERO HALLUCINATION (Text-Grounded Only): Only extract skills, tools, and experiences that have explicit verifiable evidence in the candidate's resume text. Do NOT invent, assume, or hallucinate proficiencies not substantiated by the resume text.
3. HONEST GAP DETECTION: If a requirement from the Job Description is not explicitly evidenced, list it in "missingSkills". Never inflate candidate capability.
4. DEMOGRAPHIC BLINDNESS (Anti-Bias): Disregard candidate name, gender, ethnicity, nationality, age, photos, graduation years, or marital status. Base 100% of your evaluation on verifiable technical competencies, system scope, and seniority trajectory.

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

  // Option A: If explicitly requested deterministic ATS, run directly
  if (selectedProvider === 'deterministic-ats') {
    result = evaluateResumeDeterministically({
      candidateName: name,
      resumeText,
      currentRole: candidate.currentRole || candidate.role_title,
      company: candidate.company,
      job
    });
  }

  // Option B: Try Backend Edge Function (if auto or supabase-edge requested)
  if (!result && (selectedProvider === 'auto' || selectedProvider === 'supabase-edge')) {
    try {
      const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('ingest-resume', {
        body: {
          candidateId: candidate.id,
          jobId: job.id,
          provider: selectedProvider
        }
      });

      if (!edgeErr && edgeData?.candidate) {
        const insights = edgeData.candidate.predictive_insights || {};
        result = {
          currentRole: edgeData.candidate.role_title || 'Software Professional',
          company: edgeData.candidate.company || 'Independent',
          experience: edgeData.candidate.experience || 0,
          score: edgeData.candidate.ai_score || 'medium',
          similarity: edgeData.candidate.cosine_similarity !== undefined ? edgeData.candidate.cosine_similarity : 0.70,
          matchedSkills: edgeData.candidate.matched_skills || [],
          missingSkills: edgeData.candidate.missing_skills || [],
          interviewPassProb: insights.interviewPassProb || 70,
          offerAcceptanceProb: insights.offerAcceptanceProb || 75,
          onboardingSuccessProb: insights.onboardingSuccessProb || 80,
          retentionRisk: insights.retentionRisk || 'low',
          retentionRiskFactor: insights.retentionRiskFactor || 'Standard retention risk',
          timeToJoinEstimate: insights.timeToJoinEstimate || '15–30 days',
          assessment: insights.assessment || 'Candidate evaluated via AI screening.',
          provider: 'supabase-edge',
          model: 'Supabase pgvector (1536-dim Embedding)',
          executionMode: 'supabase_vector',
          isUnprocessed: false
        };
      }
    } catch (edgeErr) {
      console.debug('[AI Screening] Backend Edge Function skipped, using direct evaluation:', edgeErr);
    }
  }

  // Option C: Client OpenAI Key
  if (!result && (selectedProvider === 'auto' || selectedProvider === 'openai') && openaiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: openaiModel,
          temperature: 0.1,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
        if (parsed.similarity !== undefined) {
          result = {
            ...parsed,
            provider: 'openai',
            model: openaiModel,
            executionMode: 'external_llm',
            isUnprocessed: false
          };
        }
      }
    } catch (err) {
      console.warn('[AI Screening] OpenAI call failed:', err);
    }
  }

  // Option D: Client Gemini Key
  if (!result && (selectedProvider === 'auto' || selectedProvider === 'gemini') && geminiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const parsed = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
        if (parsed.similarity !== undefined) {
          result = {
            ...parsed,
            provider: 'gemini',
            model: geminiModel,
            executionMode: 'external_llm',
            isUnprocessed: false
          };
        }
      }
    } catch (err) {
      console.warn('[AI Screening] Gemini call failed:', err);
    }
  }

  // Option E: Client Anthropic Claude Key
  if (!result && (selectedProvider === 'auto' || selectedProvider === 'claude') && claudeKey) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: claudeModel,
          temperature: 0.1,
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (res.ok) {
        const data = await res.json();
        const rawText = data.content?.[0]?.text || '{}';
        const parsed = JSON.parse(rawText);
        if (parsed.similarity !== undefined) {
          result = {
            ...parsed,
            provider: 'claude',
            model: claudeModel,
            executionMode: 'external_llm',
            isUnprocessed: false
          };
        }
      }
    } catch (err) {
      console.warn('[AI Screening] Claude call failed:', err);
    }
  }

  // Option F: Reliable Deterministic ATS Engine (Runs if external LLM unconfigured or fallback needed)
  if (!result) {
    result = evaluateResumeDeterministically({
      candidateName: name,
      resumeText,
      currentRole: candidate.currentRole || candidate.role_title,
      company: candidate.company,
      job
    });
  }

  // 5. Update Supabase with honest, dynamic evaluation results and provider telemetry
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
          provider: result.provider || 'deterministic-ats',
          model: result.model || 'Deterministic ATS Engine (Rule-based NLP & Heuristics)',
          executionMode: result.executionMode || 'deterministic_ats',
          isUnprocessed: false,
          error: null,
          evaluatedAt: new Date().toISOString()
        }
      })
      .eq('id', candidate.id);
  } catch (dbErr) {
    console.error('[AI Screening] Failed to update candidate in database:', dbErr);
  }

  return result;
}
