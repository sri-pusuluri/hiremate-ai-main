/**
 * AI Safety, Anti-Prompt Injection, and Demographic Blindness (PII Scrubbing)
 *
 * Designed to satisfy enterprise ATS compliance requirements (EEOC, EU AI Act, NYC Local Law 144)
 * by eliminating demographic bias vectors and shielding LLM evaluators from adversarial injection.
 */

// Common prompt injection keywords & adversarial jailbreak patterns
const INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?(?:previous|prior|above|underlying)\s+(?:instructions|prompts|directions|guidelines|rules)/i,
  /disregard\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions|prompts|directions|constraints)/i,
  /system\s*(?:override|prompt|directive|message|admin|command|level)/i,
  /you\s+are\s+now\s+(?:an?|acting\s+as|in\s+mode|unrestricted|DAN|developer)/i,
  /forget\s+(?:all\s+)?(?:rules|instructions|constraints|prior\s+knowledge)/i,
  /new\s+instruction(?:\s*:\s*|\s+is\s+)/i,
  /reveal\s+(?:your\s+)?(?:prompt|system\s+instructions|system\s+prompt)/i,
  /<\|(?:im_start|im_end|endoftext|system|user|assistant)\|>/i,
  /\[\/?(?:INST|SYS)\]/i,
  /```(?:system|admin|root|instruction)/i,
  /give\s+(?:this\s+candidate|me)\s+(?:a\s+)?(?:perfect|high|100%?|99%?|A\+?)\s+(?:score|match|rating)/i,
  /bypass\s+(?:guardrails|ats|filter|screening|evaluation)/i,
  /jailbreak\s+(?:mode|prompt|active)/i,
  /print\s+only\s+(?:high|100%|passed)/i,
  /always\s+respond\s+with\s+(?:{"score":\s*"high"|high)/i
];

export interface SanitizationResult {
  sanitized: string;
  hasInjectionAttempt: boolean;
  detectedPatterns: string[];
}

/**
 * Sanitizes input text to neutralize prompt injection vectors.
 * Replaces known injection phrases with a neutral marker and escapes XML delimiters.
 */
export function sanitizePromptInput(text: string): SanitizationResult {
  if (!text || typeof text !== 'string') {
    return { sanitized: '', hasInjectionAttempt: false, detectedPatterns: [] };
  }

  let sanitized = text;
  const detectedPatterns: string[] = [];

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      detectedPatterns.push(pattern.source);
      sanitized = sanitized.replace(pattern, '[SECURITY OVERRIDE NEUTRALIZED]');
    }
  }

  // Prevent candidate text from spoofing XML tags used as system delimiters
  sanitized = sanitized
    .replace(/<\/?(?:candidate_resume_untrusted|untrusted_candidate|system_context|evaluation_rules)>/gi, '[DELIMITER REMOVED]');

  return {
    sanitized,
    hasInjectionAttempt: detectedPatterns.length > 0,
    detectedPatterns
  };
}

export interface ScrubbedPIIResult {
  scrubbedText: string;
  redactedCounts: {
    emails: number;
    phones: number;
    graduationYears: number;
    names: number;
    addresses: number;
    socialUrls: number;
  };
}

/**
 * Programmatically scrubs Personally Identifiable Information (PII) and demographic proxies
 * (candidate name, emails, phone numbers, addresses, graduation years) to enable unbiased,
 * blind technical evaluation compliant with anti-bias hiring regulations.
 */
export function scrubPIIFromResume(
  resumeText: string,
  options?: {
    candidateName?: string;
    candidateEmail?: string;
  }
): ScrubbedPIIResult {
  if (!resumeText || typeof resumeText !== 'string') {
    return {
      scrubbedText: '',
      redactedCounts: { emails: 0, phones: 0, graduationYears: 0, names: 0, addresses: 0, socialUrls: 0 }
    };
  }

  let scrubbed = resumeText;
  const counts = {
    emails: 0,
    phones: 0,
    graduationYears: 0,
    names: 0,
    addresses: 0,
    socialUrls: 0
  };

  // 1. Explicit Candidate Email if provided
  if (options?.candidateEmail && options.candidateEmail.trim().length > 3) {
    const escapedEmail = options.candidateEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const emailRegex = new RegExp(`\\b${escapedEmail}\\b`, 'gi');
    scrubbed = scrubbed.replace(emailRegex, () => {
      counts.emails++;
      return '[EMAIL REDACTED]';
    });
  }

  // 2. Generic Email regex
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  scrubbed = scrubbed.replace(emailRegex, () => {
    counts.emails++;
    return '[EMAIL REDACTED]';
  });

  // 3. Phone numbers (international, hyphenated, parenthesized)
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  scrubbed = scrubbed.replace(phoneRegex, () => {
    counts.phones++;
    return '[PHONE REDACTED]';
  });

  // 4. Social URLs (LinkedIn profiles, Twitter/X profiles)
  const socialUrlRegex = /https?:\/\/(?:www\.)?(?:linkedin\.com\/in\/|twitter\.com\/|x\.com\/)[a-zA-Z0-9_-]+/gi;
  scrubbed = scrubbed.replace(socialUrlRegex, () => {
    counts.socialUrls++;
    return '[SOCIAL PROFILE REDACTED]';
  });

  // 5. Explicit Candidate Name (and individual distinct tokens if >= 3 letters)
  if (options?.candidateName && options.candidateName.trim().length > 1) {
    const nameTokens = options.candidateName
      .trim()
      .split(/\s+/)
      .filter(t => t.length >= 3 && !/^(and|the|for|with|dr|mr|ms|mrs)$/i.test(t));

    for (const token of nameTokens) {
      const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const tokenRegex = new RegExp(`\\b${escapedToken}\\b`, 'gi');
      scrubbed = scrubbed.replace(tokenRegex, () => {
        counts.names++;
        return '[CANDIDATE]';
      });
    }
  }

  // 6. Graduation Years (Key age proxy: "Class of 2008", "Graduated in 2012", "Passing year: 2015", "Batch of 2019")
  const graduationYearRegex = /\b(?:graduated|class of|graduation|passout|passing year|batch of)\s*(?:in|year)?\s*:?\s*(?:19\d{2}|20\d{2})\b/gi;
  scrubbed = scrubbed.replace(graduationYearRegex, () => {
    counts.graduationYears++;
    return '[GRADUATION YEAR REDACTED]';
  });

  // 7. Postal ZIP codes (US 5-digit or 5+4)
  const zipRegex = /\b\d{5}(?:-\d{4})?\b/g;
  scrubbed = scrubbed.replace(zipRegex, () => {
    counts.addresses++;
    return '[ZIP REDACTED]';
  });

  return {
    scrubbedText: scrubbed,
    redactedCounts: counts
  };
}

/**
 * Prepares candidate resume text for LLM prompts with dual layers of security:
 * 1. PII Redaction for demographic blindness.
 * 2. Injection sanitization and XML delimiter isolation.
 */
export function wrapUntrustedCandidateResume(
  rawResumeText: string,
  options?: {
    candidateName?: string;
    candidateEmail?: string;
  }
): {
  promptPayload: string;
  hasInjectionAttempt: boolean;
  sanitizationDetails: SanitizationResult;
  scrubbedDetails: ScrubbedPIIResult;
} {
  // Step 1: PII Scrubbing
  const scrubbedDetails = scrubPIIFromResume(rawResumeText, options);

  // Step 2: Prompt Injection Sanitization
  const sanitizationDetails = sanitizePromptInput(scrubbedDetails.scrubbedText);

  // Step 3: XML Delimiter Encapsulation with Explicit Context Guardrails
  const promptPayload = [
    '<candidate_resume_untrusted>',
    sanitizationDetails.sanitized,
    '</candidate_resume_untrusted>'
  ].join('\n');

  return {
    promptPayload,
    hasInjectionAttempt: sanitizationDetails.hasInjectionAttempt,
    sanitizationDetails,
    scrubbedDetails
  };
}

/**
 * Validates candidate evaluation outputs against ground-truth vector realities.
 * Flags anomalous scores where prompt injection might have manipulated LLM generation.
 */
export function validateScreeningIntegrity(params: {
  llmScore: 'high' | 'medium' | 'low';
  llmSimilarity: number;
  matchedSkillsCount: number;
  requiredSkillsCount: number;
  hasInjectionAttempt: boolean;
}): {
  isCompromised: boolean;
  securityFlag?: string;
  adjustedScore?: 'high' | 'medium' | 'low';
} {
  const { llmScore, llmSimilarity, matchedSkillsCount, requiredSkillsCount, hasInjectionAttempt } = params;
  
  const skillMatchRatio = requiredSkillsCount > 0 ? (matchedSkillsCount / requiredSkillsCount) : 1;

  // Anomaly 1: Resume contained explicit injection attempts AND LLM awarded High or >85%
  if (hasInjectionAttempt && (llmScore === 'high' || llmSimilarity >= 0.80) && skillMatchRatio < 0.40) {
    return {
      isCompromised: true,
      securityFlag: 'Anomalous High Rating: Prompt injection attempt detected alongside low core skill coverage.',
      adjustedScore: 'low'
    };
  }

  // Anomaly 2: Hallucination divergence where LLM gave high fit but candidate has 0 skills
  if (llmScore === 'high' && matchedSkillsCount === 0 && requiredSkillsCount >= 3) {
    return {
      isCompromised: true,
      securityFlag: 'Evaluation Divergence: High score awarded despite zero required competencies present.',
      adjustedScore: 'low'
    };
  }

  return { isCompromised: false };
}
