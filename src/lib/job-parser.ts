import { Job } from '@/types/hiresort';

export interface ParsedJobSections {
  overview: string[];
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  niceToHave: string[];
  otherSections: Array<{ title: string; items: string[] }>;
}

/**
 * Normalizes job employment type to full-time, part-time, or contract.
 */
export function normalizeJobType(type?: string): 'full-time' | 'part-time' | 'contract' {
  if (!type) return 'full-time';
  const lower = type.toLowerCase().trim().replace(/[\s_]+/g, '-');
  if (lower.includes('part')) return 'part-time';
  if (lower.includes('contract')) return 'contract';
  return 'full-time';
}

/**
 * Assembles the full unified Markdown text for a job description.
 * If the job description already contains section headers (e.g. ## Responsibilities),
 * it preserves it. Otherwise, it combines description, responsibilities, requirements,
 * and nice-to-have into clean Markdown.
 */
export function assembleJobDescription(job?: Partial<Job> | null): string {
  if (!job) return '';

  const desc = (job.description || '').trim();
  const responsibilities = job.responsibilities || [];
  const requirements = job.requirements || [];
  const niceToHave = job.niceToHave || [];

  // Check if description already contains markdown headers
  const hasHeaders = /^#+\s+(responsibilit|requirement|qualification|what we offer|benefit|nice to have)/im.test(desc);

  if (hasHeaders) {
    return desc;
  }

  const sections: string[] = [];

  if (desc) {
    sections.push(desc);
  }

  if (responsibilities.length > 0) {
    sections.push(`### Key Responsibilities\n${responsibilities.map(r => `• ${r}`).join('\n')}`);
  }

  if (requirements.length > 0) {
    sections.push(`### Requirements & Qualifications\n${requirements.map(r => `• ${r}`).join('\n')}`);
  }

  if (niceToHave.length > 0) {
    sections.push(`### Nice to Have\n${niceToHave.map(n => `• ${n}`).join('\n')}`);
  }

  return sections.join('\n\n');
}

/**
 * Parses full Markdown job description into structured sections.
 */
export function parseJobMarkdown(rawDescription: string = ''): ParsedJobSections {
  const lines = rawDescription.split('\n');
  const result: ParsedJobSections = {
    overview: [],
    responsibilities: [],
    requirements: [],
    benefits: [],
    niceToHave: [],
    otherSections: [],
  };

  let currentSection: 'overview' | 'responsibilities' | 'requirements' | 'benefits' | 'niceToHave' | 'other' = 'overview';
  let currentOtherTitle = '';
  let currentOtherItems: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Detect section headers
    if (/^#+\s*(about(\s+the)?\s+(role|position|job)|overview|summary)/i.test(line)) {
      if (currentSection === 'other' && currentOtherTitle) {
        result.otherSections.push({ title: currentOtherTitle, items: currentOtherItems });
        currentOtherItems = [];
      }
      currentSection = 'overview';
      continue;
    }

    if (/^#+\s*(key\s+)?responsibilit(ies|y)|what\s+you('ll|\s+will)\s+do|the\s+role/i.test(line)) {
      if (currentSection === 'other' && currentOtherTitle) {
        result.otherSections.push({ title: currentOtherTitle, items: currentOtherItems });
        currentOtherItems = [];
      }
      currentSection = 'responsibilities';
      continue;
    }

    if (/^#+\s*(requirements(\s*&\s*qualifications)?|qualifications|what\s+we('re|\s+are)\s+looking\s+for|skills(\s*&\s*experience)?)/i.test(line)) {
      if (currentSection === 'other' && currentOtherTitle) {
        result.otherSections.push({ title: currentOtherTitle, items: currentOtherItems });
        currentOtherItems = [];
      }
      currentSection = 'requirements';
      continue;
    }

    if (/^#+\s*(what\s+we\s+offer|benefits|perks|compensation\s*&\s*benefits)/i.test(line)) {
      if (currentSection === 'other' && currentOtherTitle) {
        result.otherSections.push({ title: currentOtherTitle, items: currentOtherItems });
        currentOtherItems = [];
      }
      currentSection = 'benefits';
      continue;
    }

    if (/^#+\s*(nice\s+to\s+have|preferred|bonus\s+points?)/i.test(line)) {
      if (currentSection === 'other' && currentOtherTitle) {
        result.otherSections.push({ title: currentOtherTitle, items: currentOtherItems });
        currentOtherItems = [];
      }
      currentSection = 'niceToHave';
      continue;
    }

    if (/^#+\s+(.+)/.test(line)) {
      if (currentSection === 'other' && currentOtherTitle) {
        result.otherSections.push({ title: currentOtherTitle, items: currentOtherItems });
      }
      const match = line.match(/^#+\s+(.+)/);
      currentOtherTitle = match ? match[1] : 'Additional Details';
      currentOtherItems = [];
      currentSection = 'other';
      continue;
    }

    // Process bullet point or normal text
    const cleanContent = line.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').trim();

    if (currentSection === 'overview') {
      result.overview.push(cleanContent);
    } else if (currentSection === 'responsibilities') {
      result.responsibilities.push(cleanContent);
    } else if (currentSection === 'requirements') {
      result.requirements.push(cleanContent);
    } else if (currentSection === 'benefits') {
      result.benefits.push(cleanContent);
    } else if (currentSection === 'niceToHave') {
      result.niceToHave.push(cleanContent);
    } else if (currentSection === 'other') {
      currentOtherItems.push(cleanContent);
    }
  }

  if (currentSection === 'other' && currentOtherTitle && currentOtherItems.length > 0) {
    result.otherSections.push({ title: currentOtherTitle, items: currentOtherItems });
  }

  return result;
}
