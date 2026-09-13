import { SKILL_CATALOG } from './ai-screening';

export interface ParsedCandidateContact {
  fullName: string;
  email: string;
  phone: string;
  linkedIn: string;
  portfolio: string;
  location?: string;
  detectedSkills: string[];
  extractedText: string;
  wordCount: number;
}

/**
 * Extracts raw readable text from an uploaded File object (txt, md, html, json, pdf strings).
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  // 1. Text, Markdown, HTML, JSON, RTF
  if (
    file.type.includes('text') ||
    file.type.includes('json') ||
    file.type.includes('html') ||
    fileName.endsWith('.md') ||
    fileName.endsWith('.txt') ||
    fileName.endsWith('.html') ||
    fileName.endsWith('.htm') ||
    fileName.endsWith('.json') ||
    fileName.endsWith('.rtf')
  ) {
    try {
      const text = await file.text();
      return cleanExtractedText(text);
    } catch (err) {
      console.warn('[Resume Parser] Failed reading text file:', err);
    }
  }

  // 2. Binary PDF text extraction fallback
  if (file.type.includes('pdf') || fileName.endsWith('.pdf')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binaryStr = '';
      const len = Math.min(bytes.length, 500000); // scan first 500KB
      for (let i = 0; i < len; i++) {
        binaryStr += String.fromCharCode(bytes[i]);
      }

      // Look for text in standard PDF text objects (Tj and TJ operators)
      const textChunks: string[] = [];
      const tjRegex = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj/g;
      let match: RegExpExecArray | null;
      while ((match = tjRegex.exec(binaryStr)) !== null) {
        const chunk = match[1].replace(/\\([()\\])/g, '$1').trim();
        if (chunk.length > 1) textChunks.push(chunk);
      }

      const tjArrayRegex = /\[([^\]]+)\]\s*TJ/g;
      while ((match = tjArrayRegex.exec(binaryStr)) !== null) {
        const inner = match[1];
        const innerSubRegex = /\(([^)\\]*(?:\\.[^)\\]*)*)\)/g;
        let subMatch: RegExpExecArray | null;
        let line = '';
        while ((subMatch = innerSubRegex.exec(inner)) !== null) {
          line += subMatch[1].replace(/\\([()\\])/g, '$1');
        }
        if (line.trim().length > 1) textChunks.push(line.trim());
      }

      if (textChunks.length > 5) {
        return cleanExtractedText(textChunks.join(' '));
      }

      // Fallback: extract continuous ASCII text strings from stream
      const asciiMatches = binaryStr.match(/[A-Za-z0-9@._+\-–—:,#/'"()\s]{4,}/g) || [];
      const filtered = asciiMatches
        .map(s => s.trim())
        .filter(s => 
          s.length > 3 && 
          !s.startsWith('/Font') && 
          !s.startsWith('/Type') && 
          !s.startsWith('endobj') && 
          !s.startsWith('stream') &&
          !s.includes('Adobe') &&
          !s.includes('deflate')
        );

      if (filtered.length > 0) {
        return cleanExtractedText(filtered.join(' '));
      }
    } catch (pdfErr) {
      console.warn('[Resume Parser] PDF extraction fallback error:', pdfErr);
    }
  }

  // Generic fallback: try reading as plain text
  try {
    const text = await file.text();
    return cleanExtractedText(text);
  } catch {
    return '';
  }
}

/**
 * Strips HTML tags and excessive whitespace while keeping structured content.
 */
export function cleanExtractedText(raw: string): string {
  if (!raw) return '';
  let cleaned = raw;
  // If HTML, strip script and style tags first
  if (cleaned.includes('<html') || cleaned.includes('<body') || cleaned.includes('class=')) {
    cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, ' ');
    cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, ' ');
    cleaned = cleaned.replace(/<[^>]+>/g, ' ');
  }
  return cleaned
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extracts candidate contact information, social links, and detected skills from resume text.
 */
export function parseContactInfoFromText(text: string, fileName?: string): ParsedCandidateContact {
  const extractedText = text || '';

  // 1. Email Address
  const emailMatch = extractedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0].trim().toLowerCase() : '';

  // 2. Phone Number
  const phoneMatch = extractedText.match(/(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}|\+\d{10,13}/);
  const phone = phoneMatch ? phoneMatch[0].trim() : '';

  // 3. LinkedIn Profile
  const linkedinMatch = extractedText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
  let linkedIn = '';
  if (linkedinMatch) {
    linkedIn = linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`;
  }

  // 4. Portfolio / GitHub Link (must not match plain email addresses)
  const portfolioMatch = extractedText.match(/(?:https?:\/\/)?(?:www\.)?(?:github\.com\/[a-zA-Z0-9_-]+|gitlab\.com\/[a-zA-Z0-9_-]+|behance\.net\/[a-zA-Z0-9_-]+|dribbble\.com\/[a-zA-Z0-9_-]+|portfolio\.[a-zA-Z0-9_.-]+)|https?:\/\/[a-zA-Z0-9_.-]+\.(?:dev|design|io|me|com)\/?[a-zA-Z0-9_\-/]*/i);
  let portfolio = '';
  if (portfolioMatch) {
    portfolio = portfolioMatch[0].startsWith('http') ? portfolioMatch[0] : `https://${portfolioMatch[0]}`;
  }

  // 5. Candidate Full Name
  let fullName = '';

  // Case A: HTML <h1 class="name">Elena Rostova</h1>
  const htmlNameMatch = text.match(/class=["']name["'][^>]*>([^<]+)/i);
  if (htmlNameMatch && htmlNameMatch[1].trim()) {
    fullName = htmlNameMatch[1].trim();
  }

  // Case B: Markdown header: # Resume: Alex Mercer or # Tariq Al-Mansoor
  if (!fullName) {
    const mdHeaderMatch = text.match(/^#+[ \t]*(?:resume[ \t]*[:-]?[ \t]*)?([A-Za-z][a-zA-Z'–-]+(?:[ \t]+[A-Za-z][a-zA-Z'–-]+){1,3})/im);
    if (mdHeaderMatch && mdHeaderMatch[1].trim()) {
      fullName = mdHeaderMatch[1].trim();
    }
  }

  // Case C: Top lines of resume before contact bar
  if (!fullName) {
    const lines = extractedText.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
    for (const line of lines.slice(0, 5)) {
      if (/^[A-Za-z][a-zA-Z'–-]+(?:[ \t]+[A-Za-z][a-zA-Z'–-]+){1,3}$/.test(line) && !line.includes('@') && !line.includes('Resume') && !line.includes('Experience')) {
        fullName = line;
        break;
      }
    }
  }

  // Case D: Cleaned filename fallback
  if (!fullName && fileName) {
    const clean = fileName
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\bresume\b/gi, '')
      .replace(/\bcv\b/gi, '')
      .trim();
    if (clean.length > 2 && clean.length < 35) {
      fullName = clean
        .split(' ')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
  }

  // 6. Detect Skills Present in Text
  const lowerText = extractedText.toLowerCase();
  const detectedSkills: string[] = [];
  for (const skill of SKILL_CATALOG) {
    const hasSkill = skill.patterns.some(p => p.test(lowerText));
    if (hasSkill && !detectedSkills.includes(skill.label)) {
      detectedSkills.push(skill.label);
    }
  }

  const wordCount = extractedText.trim() ? extractedText.trim().split(/\s+/).length : 0;

  return {
    fullName: fullName || 'Applicant',
    email,
    phone,
    linkedIn,
    portfolio,
    detectedSkills,
    extractedText,
    wordCount
  };
}
