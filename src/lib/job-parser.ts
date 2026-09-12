import { Job } from '@/types/hiresort';

export interface OrderedJobSection {
  id: string;
  title: string;
  type: 'overview' | 'responsibilities' | 'requirements' | 'benefits' | 'niceToHave' | 'custom';
  subsections: Array<{
    title?: string;
    paragraphs: string[];
    bullets: string[];
    numbered: string[];
    table?: { headers: string[]; rows: string[][] };
  }>;
}

export interface ParsedJobSections {
  overview: string[];
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  niceToHave: string[];
  otherSections: Array<{ title: string; items: string[] }>;
  orderedSections: OrderedJobSection[];
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
 * Detects section semantic type from header title.
 */
export function detectSectionType(title: string): 'overview' | 'responsibilities' | 'requirements' | 'benefits' | 'niceToHave' | 'custom' {
  const lower = title.toLowerCase().trim();
  if (/(about|overview|summary|role overview|who we are|company)/i.test(lower)) return 'overview';
  if (/(responsibilit|what you('ll|\s+will)\s+do|the role|scope|duties)/i.test(lower)) return 'responsibilities';
  if (/(requirement|qualification|what we('re|\s+are)\s+looking for|must-have|skills)/i.test(lower)) return 'requirements';
  if (/(what we offer|benefit|perk|compensation|why join|rewards)/i.test(lower)) return 'benefits';
  if (/(nice to have|bonus|preferred)/i.test(lower)) return 'niceToHave';
  return 'custom';
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
  const hasHeaders = /^#+\s+(about|responsibilit|requirement|qualification|what we offer|benefit|nice to have|role overview)/im.test(desc);

  if (hasHeaders) {
    return desc;
  }

  const sections: string[] = [];

  if (desc) {
    sections.push(desc);
  }

  if (responsibilities.length > 0) {
    sections.push(`## Key Responsibilities\n${responsibilities.map(r => `• ${r}`).join('\n')}`);
  }

  if (requirements.length > 0) {
    sections.push(`## Requirements & Qualifications\n${requirements.map(r => `• ${r}`).join('\n')}`);
  }

  if (niceToHave.length > 0) {
    sections.push(`## Nice to Have\n${niceToHave.map(n => `• ${n}`).join('\n')}`);
  }

  return sections.join('\n\n');
}

/**
 * Parses a Markdown job description into an array of sections in the exact sequential order
 * they appear in the author's document, preserving subsections, tables, and lists.
 */
export function parseJobToOrderedSections(
  rawDescription: string = '',
  fallbackResponsibilities: string[] = [],
  fallbackRequirements: string[] = [],
  fallbackNiceToHave: string[] = []
): OrderedJobSection[] {
  const lines = rawDescription.split('\n');
  const sections: OrderedJobSection[] = [];
  let currentSection: OrderedJobSection | null = null;
  let currentSubsection: OrderedJobSection['subsections'][0] | null = null;
  let inTable = false;
  let currentTable: { headers: string[]; rows: string[][] } = { headers: [], rows: [] };

  function ensureSection(title: string = 'Overview', type: OrderedJobSection['type'] = 'overview') {
    if (!currentSection) {
      currentSection = {
        id: `sec-${sections.length + 1}`,
        title,
        type,
        subsections: []
      };
      sections.push(currentSection);
      currentSubsection = { title: undefined, paragraphs: [], bullets: [], numbered: [], table: undefined };
      currentSection.subsections.push(currentSubsection);
    }
  }

  function flushTable() {
    if (inTable && currentTable.headers.length > 0) {
      ensureSection('Details', 'custom');
      if (currentSubsection) {
        currentSubsection.table = { ...currentTable };
      }
      currentTable = { headers: [], rows: [] };
      inTable = false;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    // Ignore horizontal rules and top level # Job Description heading
    if (/^---+$/.test(line) || /^#\s+Job Description/i.test(line)) {
      flushTable();
      continue;
    }

    // Markdown Table Row: | col1 | col2 |
    if (/^\|(.+)\|$/.test(line)) {
      const cells = line.slice(1, -1).split('|').map(c => c.trim());
      // Separator row: | :--- | :--- |
      if (cells.every(c => /^:?-+:?$/.test(c))) {
        inTable = true;
        continue;
      }
      if (!inTable && currentTable.headers.length === 0) {
        currentTable.headers = cells;
        inTable = true;
      } else {
        currentTable.rows.push(cells);
      }
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (!line) continue;

    // Detect Level 2 Header: ## Title
    const h2Match = line.match(/^##\s+(.+)/);
    if (h2Match) {
      flushTable();
      const title = h2Match[1].trim();
      const type = detectSectionType(title);
      currentSection = {
        id: `sec-${sections.length + 1}`,
        title,
        type,
        subsections: []
      };
      sections.push(currentSection);
      currentSubsection = { title: undefined, paragraphs: [], bullets: [], numbered: [], table: undefined };
      currentSection.subsections.push(currentSubsection);
      continue;
    }

    // Detect Level 3 Header: ### Subheading
    const h3Match = line.match(/^###\s+(.+)/);
    if (h3Match) {
      flushTable();
      const subTitle = h3Match[1].trim();
      const detected = detectSectionType(subTitle);

      const shouldPromoteH3 =
        !currentSection ||
        (currentSection.type === 'overview' && detected !== 'custom' && detected !== 'overview') ||
        (currentSection.type === 'responsibilities' && (detected === 'requirements' || detected === 'benefits')) ||
        (currentSection.type === 'requirements' && detected === 'benefits') ||
        (currentSection.type === 'benefits' && (detected === 'responsibilities' || detected === 'requirements')) ||
        (currentSection.type === 'custom' && detected !== 'custom');

      if (shouldPromoteH3) {
        currentSection = {
          id: `sec-${sections.length + 1}`,
          title: subTitle,
          type: detected,
          subsections: []
        };
        sections.push(currentSection);
        currentSubsection = { title: undefined, paragraphs: [], bullets: [], numbered: [], table: undefined };
        currentSection.subsections.push(currentSubsection);
        continue;
      }

      ensureSection('Details', 'custom');
      if (currentSubsection && (currentSubsection.paragraphs.length > 0 || currentSubsection.bullets.length > 0 || currentSubsection.numbered.length > 0 || currentSubsection.title || currentSubsection.table)) {
        currentSubsection = { title: subTitle, paragraphs: [], bullets: [], numbered: [], table: undefined };
        currentSection?.subsections.push(currentSubsection);
      } else if (currentSubsection) {
        currentSubsection.title = subTitle;
      }
      continue;
    }

    // Bullet point: - or * or •
    const bulletMatch = line.match(/^[-*•]\s+(.+)/);
    if (bulletMatch) {
      flushTable();
      ensureSection('Key Responsibilities', 'responsibilities');
      currentSubsection?.bullets.push(bulletMatch[1].trim());
      continue;
    }

    // Numbered item: 1. or 2)
    const numMatch = line.match(/^(\d+)[\.\)]\s+(.+)/);
    if (numMatch) {
      flushTable();
      ensureSection('Details', 'custom');
      currentSubsection?.numbered.push(numMatch[2].trim());
      continue;
    }

    // Skip redundant top-level metadata lines before first header (e.g. **Company:** Zool Technologies)
    if (!currentSection && /^\*\*[^:]+:\*\*/.test(line)) {
      continue;
    }

    // Regular paragraph
    flushTable();
    ensureSection('Overview', 'overview');
    currentSubsection?.paragraphs.push(line);
  }

  flushTable();

  // If no sections were found (e.g. plain text or empty description), build from fallback props
  if (sections.length === 0) {
    if (rawDescription && rawDescription.trim().length > 0) {
      sections.push({
        id: 'sec-overview',
        title: 'About the Opportunity',
        type: 'overview',
        subsections: [{ title: undefined, paragraphs: [rawDescription.trim()], bullets: [], numbered: [] }]
      });
    }
    if (fallbackResponsibilities.length > 0) {
      sections.push({
        id: 'sec-resp',
        title: 'Key Responsibilities',
        type: 'responsibilities',
        subsections: [{ title: undefined, paragraphs: [], bullets: fallbackResponsibilities, numbered: [] }]
      });
    }
    if (fallbackRequirements.length > 0) {
      sections.push({
        id: 'sec-req',
        title: 'Requirements & Qualifications',
        type: 'requirements',
        subsections: [{ title: undefined, paragraphs: [], bullets: fallbackRequirements, numbered: [] }]
      });
    }
    if (fallbackNiceToHave.length > 0) {
      sections.push({
        id: 'sec-nice',
        title: 'Nice to Have',
        type: 'niceToHave',
        subsections: [{ title: undefined, paragraphs: [], bullets: fallbackNiceToHave, numbered: [] }]
      });
    }
  }

  return sections;
}

/**
 * Parses full Markdown job description into structured sections and provides
 * both flat arrays and ordered sequential sections.
 */
export function parseJobMarkdown(
  rawDescription: string = '',
  fallbackResponsibilities: string[] = [],
  fallbackRequirements: string[] = [],
  fallbackNiceToHave: string[] = []
): ParsedJobSections {
  const orderedSections = parseJobToOrderedSections(
    rawDescription,
    fallbackResponsibilities,
    fallbackRequirements,
    fallbackNiceToHave
  );

  const result: ParsedJobSections = {
    overview: [],
    responsibilities: [],
    requirements: [],
    benefits: [],
    niceToHave: [],
    otherSections: [],
    orderedSections
  };

  orderedSections.forEach(s => {
    if (s.type === 'overview') {
      s.subsections.forEach(sub => {
        result.overview.push(...sub.paragraphs);
        if (sub.bullets.length > 0) {
          const subType = sub.title ? detectSectionType(sub.title) : 'custom';
          if (subType === 'responsibilities') result.responsibilities.push(...sub.bullets);
          else if (subType === 'requirements') result.requirements.push(...sub.bullets);
          else if (subType === 'benefits') result.benefits.push(...sub.bullets);
          else if (subType === 'niceToHave') result.niceToHave.push(...sub.bullets);
        }
      });
    } else if (s.type === 'responsibilities') {
      s.subsections.forEach(sub => {
        sub.bullets.forEach(b => result.responsibilities.push(b));
      });
    } else if (s.type === 'requirements') {
      s.subsections.forEach(sub => {
        const isNice = sub.title && /(nice|bonus|preferred)/i.test(sub.title);
        if (isNice) {
          result.niceToHave.push(...sub.bullets);
        } else {
          result.requirements.push(...sub.bullets);
        }
      });
    } else if (s.type === 'niceToHave') {
      s.subsections.forEach(sub => result.niceToHave.push(...sub.bullets));
    } else if (s.type === 'benefits') {
      s.subsections.forEach(sub => result.benefits.push(...sub.bullets));
    } else {
      s.subsections.forEach(sub => {
        const items = [...sub.bullets, ...sub.paragraphs, ...sub.numbered];
        if (items.length > 0) {
          result.otherSections.push({
            title: sub.title || s.title,
            items
          });
        }
      });
    }
  });

  // Fallbacks if arrays are empty
  if (result.responsibilities.length === 0 && fallbackResponsibilities.length > 0) {
    result.responsibilities = fallbackResponsibilities;
  }
  if (result.requirements.length === 0 && fallbackRequirements.length > 0) {
    result.requirements = fallbackRequirements;
  }
  if (result.niceToHave.length === 0 && fallbackNiceToHave.length > 0) {
    result.niceToHave = fallbackNiceToHave;
  }

  return result;
}
