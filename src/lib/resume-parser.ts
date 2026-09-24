import { SKILL_CATALOG } from './ai-screening';

export interface ParsedCandidateContact {
  fullName: string;
  email: string;
  phone: string;
  roleTitle?: string;
  company?: string;
  experienceYears?: number;
  location?: string;
  linkedIn: string;
  portfolio: string;
  detectedSkills: string[];
  extractedText: string;
  wordCount: number;
}

export interface ResumeWorkExperience {
  role: string;
  company: string;
  duration?: string;
  highlights: string[];
}

export interface ParsedResumeData {
  summary: string;
  experience: ResumeWorkExperience[];
  skills: string[];
  education: string[];
  certifications?: string[];
  rawText: string;
}

/**
 * Extracts readable plain text from a PDF file using pdfjs-dist,
 * with an automatic fallback to Web-native DecompressionStream for FlateDecode streams.
 */
export async function extractTextFromPdf(bytes: Uint8Array): Promise<string> {
  // Method 1: Try pdfjs-dist
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs').catch(() => import('pdfjs-dist/build/pdf.mjs'));
    if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions?.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    }

    const loadingTask = pdfjsLib.getDocument({
      data: bytes,
      useSystemFonts: true,
      isEvalSupported: false
    });

    const pdfDoc = await loadingTask.promise;
    let fullText = '';
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');
      if (pageText.trim()) {
        fullText += pageText + '\n\n';
      }
    }

    const cleaned = cleanExtractedText(fullText);
    if (cleaned.length > 30) {
      return cleaned;
    }
  } catch (pdfjsErr) {
    console.warn('[Resume Parser] pdfjs-dist execution failed, falling back to stream decompressor:', pdfjsErr);
  }

  // Method 2: Native DecompressionStream FlateDecode stream extractor
  try {
    const streamText = await extractTextFromPdfStreams(bytes);
    if (streamText && streamText.length > 30) {
      return cleanExtractedText(streamText);
    }
  } catch (streamErr) {
    console.warn('[Resume Parser] PDF stream decompression error:', streamErr);
  }

  return '';
}

/**
 * Pure Web-API based PDF text extraction using DecompressionStream('deflate')
 * Unpacks compressed FlateDecode streams and extracts all Tj / TJ text tokens.
 */
export async function extractTextFromPdfStreams(bytes: Uint8Array): Promise<string> {
  const binaryStr = Array.from(bytes.subarray(0, Math.min(bytes.length, 2500000)))
    .map(b => String.fromCharCode(b))
    .join('');

  const textChunks: string[] = [];

  // Find all stream ... endstream blocks in PDF
  let streamIndex = 0;
  while ((streamIndex = binaryStr.indexOf('stream', streamIndex)) !== -1) {
    let dataStart = streamIndex + 6;
    if (binaryStr.charCodeAt(dataStart) === 13) dataStart++; // \r
    if (binaryStr.charCodeAt(dataStart) === 10) dataStart++; // \n

    const endStreamIndex = binaryStr.indexOf('endstream', dataStart);
    if (endStreamIndex === -1) break;

    const streamSlice = bytes.subarray(dataStart, endStreamIndex);
    streamIndex = endStreamIndex + 9;

    if (streamSlice.length > 4) {
      let decompressedStr = '';
      // Check for zlib/deflate header (0x78 0x01, 0x78 0x9C, 0x78 0xDA)
      if (typeof DecompressionStream !== 'undefined' && streamSlice[0] === 0x78) {
        try {
          const ds = new DecompressionStream('deflate');
          const writer = ds.writable.getWriter();
          writer.write(streamSlice);
          writer.close();
          const reader = ds.readable.getReader();
          const parts: Uint8Array[] = [];
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) parts.push(value);
          }
          const total = parts.reduce((acc, p) => acc + p.length, 0);
          const combined = new Uint8Array(total);
          let off = 0;
          for (const p of parts) {
            combined.set(p, off);
            off += p.length;
          }
          decompressedStr = new TextDecoder('utf-8', { fatal: false }).decode(combined);
        } catch {
          // stream was not standard deflate
        }
      }

      const contentToScan = decompressedStr || '';
      if (contentToScan) {
        // Extract Tj strings: (text) Tj
        const tjRegex = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj/g;
        let m: RegExpExecArray | null;
        while ((m = tjRegex.exec(contentToScan)) !== null) {
          const str = m[1].replace(/\\([()\\])/g, '$1').trim();
          if (str && !str.startsWith('/') && str.length > 0) {
            textChunks.push(str);
          }
        }

        // Extract TJ arrays: [(text) 120 (more)] TJ
        const tjArrayRegex = /\[([^\]]+)\]\s*TJ/g;
        while ((m = tjArrayRegex.exec(contentToScan)) !== null) {
          const inner = m[1];
          const innerSubRegex = /\(([^)\\]*(?:\\.[^)\\]*)*)\)/g;
          let subMatch: RegExpExecArray | null;
          let line = '';
          while ((subMatch = innerSubRegex.exec(inner)) !== null) {
            line += subMatch[1].replace(/\\([()\\])/g, '$1') + ' ';
          }
          if (line.trim().length > 0) {
            textChunks.push(line.trim());
          }
        }
      }
    }
  }

  // Filter out any PDF structural metadata keywords
  const cleanChunks = textChunks.filter(chunk => {
    return !chunk.startsWith('/Font') && 
           !chunk.startsWith('/Type') && 
           !chunk.startsWith('/ProcSet') && 
           !chunk.startsWith('/ColorSpace') && 
           !chunk.includes('FlateDecode') &&
           !/^\d+\s+\d+\s+R$/.test(chunk) &&
           !/^\d{10,}\s+\d+\s+[fn]$/.test(chunk) &&
           !/^[0-9a-f]{20,}$/i.test(chunk);
  });

  return cleanChunks.join(' ');
}

/**
 * Extracts readable plain text from a Microsoft Word (.docx) file using mammoth.
 */
export async function extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer });
    return cleanExtractedText(result.value || '');
  } catch (err) {
    console.warn('[Resume Parser] DOCX parsing error:', err);
    return '';
  }
}

/**
 * Converts a File or Blob into a base64 encoded string.
 */
function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Extracts raw readable text from an image File (JPG, PNG, WEBP) using browser OCR (Tesseract.js)
 * and optional Vision API fallback.
 */
export async function extractTextFromImage(file: File): Promise<string> {
  // 1. Try Gemini Vision or OpenAI Vision if client keys are configured
  const geminiKey = typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : null;
  const openaiKey = typeof window !== 'undefined' ? localStorage.getItem('openai_api_key') : null;

  if (geminiKey) {
    try {
      const base64 = await fileToBase64(file);
      const mimeType = file.type || 'image/jpeg';
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Extract all text, candidate names, contact details, experiences, and technical skills from this resume image verbatim. Output clean plain text without commentary." },
              { inline_data: { mime_type: mimeType, data: base64 } }
            ]
          }]
        })
      });
      if (res.ok) {
        const data = await res.json();
        const extracted = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (extracted && extracted.trim().length > 20) {
          return cleanExtractedText(extracted);
        }
      }
    } catch (gErr) {
      console.warn('[Resume Parser] Gemini Vision OCR skipped:', gErr);
    }
  }

  if (openaiKey) {
    try {
      const base64 = await fileToBase64(file);
      const mimeType = file.type || 'image/jpeg';
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: 'Extract all text, candidate name, contact details, work history, and skills from this resume image verbatim. Output plain text only.' },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } }
            ]
          }],
          max_tokens: 2000
        })
      });
      if (res.ok) {
        const data = await res.json();
        const extracted = data.choices?.[0]?.message?.content;
        if (extracted && extracted.trim().length > 20) {
          return cleanExtractedText(extracted);
        }
      }
    } catch (oErr) {
      console.warn('[Resume Parser] OpenAI Vision OCR skipped:', oErr);
    }
  }

  // 2. Client-side OCR via Tesseract.js (100% offline in-browser OCR)
  try {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');
    const ret = await worker.recognize(file);
    await worker.terminate();
    const ocrText = cleanExtractedText(ret.data?.text || '');
    if (ocrText && ocrText.trim().length > 15) {
      return ocrText;
    }
  } catch (tessErr) {
    console.warn('[Resume Parser] Tesseract OCR error:', tessErr);
  }

  return '';
}

/**
 * Extracts raw readable text from an uploaded File object (PDF, DOCX, TXT, MD, HTML, RTF, JPG, PNG, WEBP).
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  // 1. Image Files (.jpg, .jpeg, .png, .webp) - OCR Pipeline
  const isImage =
    file.type.startsWith('image/') ||
    fileName.endsWith('.jpg') ||
    fileName.endsWith('.jpeg') ||
    fileName.endsWith('.png') ||
    fileName.endsWith('.webp');

  if (isImage) {
    try {
      const text = await extractTextFromImage(file);
      if (text && text.trim().length > 15) {
        return text;
      }
    } catch (err) {
      console.warn('[Resume Parser] Image OCR extraction failed:', err);
    }
    return '';
  }

  // 2. PDF Documents (.pdf)
  if (file.type.includes('pdf') || fileName.endsWith('.pdf')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const text = await extractTextFromPdf(bytes);
      if (text && text.trim().length > 20) {
        return text;
      }
    } catch (err) {
      console.warn('[Resume Parser] PDF file extraction failed:', err);
    }
  }

  // 3. Microsoft Word Documents (.docx)
  if (
    file.type.includes('wordprocessingml') ||
    file.type.includes('msword') ||
    fileName.endsWith('.docx')
  ) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const text = await extractTextFromDocx(arrayBuffer);
      if (text && text.trim().length > 20) {
        return text;
      }
    } catch (err) {
      console.warn('[Resume Parser] Word DOCX extraction failed:', err);
    }
  }

  // 4. Text, Markdown, HTML, JSON, RTF
  try {
    const text = await file.text();
    const cleaned = cleanExtractedText(text);
    // Reject binary garbage if file was actually a binary PDF/DOCX read as text
    if (!cleaned.includes('/Size ') && !cleaned.includes('endobj') && !cleaned.includes('xref')) {
      return cleaned;
    }
  } catch (err) {
    console.warn('[Resume Parser] Failed reading text file:', err);
  }

  return '';
}

/**
 * Strips HTML tags, PDF stream artifacts, and excessive whitespace while keeping structured content.
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

  // Strip raw PDF xref tables and binary stream leftovers if present
  cleaned = cleaned
    .replace(/\b\d{10}\s+\d{5}\s+[fn]\b/g, '')
    .replace(/\b\d+\s+\d+\s+obj\b[\s\S]*?endobj/g, ' ')
    .replace(/<<[\s\S]*?>>/g, ' ')
    .replace(/\b(?:xref|trailer|startxref)\b/gi, ' ')
    .replace(/\/[A-Za-z0-9_-]+\s+\d+/g, ' ')
    .replace(/[0-9A-Fa-f]{24,}/g, ' ');

  return cleaned
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extracts candidate contact information, social links, role, company, and detected skills.
 */
export function parseContactInfoFromText(text: string, fileName?: string): ParsedCandidateContact {
  const extractedText = text || '';

  // 1. Email Address — Multi-strategy extraction to handle PDF glyph fragmentation,
  //    fullwidth Unicode @, labelled prefixes, and [at]/(at) obfuscation.
  let email = '';

  // Normalize fullwidth @ (U+FF20) and common obfuscations before matching
  const normalizedForEmail = extractedText
    .replace(/＠/g, '@')                         // fullwidth @
    .replace(/\[at\]/gi, '@')                    // [at] obfuscation
    .replace(/\(at\)/gi, '@')                    // (at) obfuscation
    .replace(/\bat\b(?=\s*[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi, '@') // bare "at" between parts
    // Remove spaces that PDF extractors inject inside email tokens
    // e.g. "maruti @gmail .com" -> "maruti@gmail.com"
    .replace(/([a-zA-Z0-9._%+-])\s+@\s*/g, '$1@')
    .replace(/@\s+([a-zA-Z0-9.-])/g, '@$1')
    .replace(/([a-zA-Z0-9.-])\s+\.\s*([a-zA-Z]{2,})/g, '$1.$2');

  // Strategy A: Standard email pattern on normalised text
  const emailMatchA = normalizedForEmail.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
  if (emailMatchA) {
    email = emailMatchA[0].trim().toLowerCase();
  }

  // Strategy B: Look after common label prefixes (Email:, E:, Mail:) on any line
  if (!email) {
    const labelMatch = normalizedForEmail.match(
      /(?:e[\s-]?mail|mail|e)[\s:：]+([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i
    );
    if (labelMatch) {
      email = labelMatch[1].trim().toLowerCase();
    }
  }

  // Strategy C: Reconstruct from lines where PDF split "user @ domain . com" across tokens
  if (!email) {
    for (const line of extractedText.split(/[\r\n]+/)) {
      // Remove all whitespace in a line, then see if a valid email appears
      const collapsed = line.replace(/\s+/g, '');
      const maybeEmail = collapsed.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/i);
      if (maybeEmail) {
        email = maybeEmail[0].trim().toLowerCase();
        break;
      }
    }
  }


  // 2. Phone Number (handles 10-digit Indian numbers, +91, US formats; rejects binary timestamps)
  let phone = '';
  const phoneCandidates = Array.from(extractedText.matchAll(/(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b|\b[6-9]\d{9}\b/g))
    .map(m => m[0].trim())
    .filter(p => {
      const digits = p.replace(/\D/g, '');
      // Valid phone numbers are 10 to 12 digits, not all zeros, and not timestamps like 20260310...
      return digits.length >= 10 && digits.length <= 12 && !/^0+$/.test(digits) && !digits.startsWith('20260310');
    });

  if (phoneCandidates.length > 0) {
    phone = phoneCandidates[0];
  }

  // 3. LinkedIn Profile
  const linkedinMatch = extractedText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
  let linkedIn = '';
  if (linkedinMatch) {
    linkedIn = linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`;
  }

  // 4. Portfolio / GitHub / Behance Link
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

  // Case C: Top lines of resume before contact info
  if (!fullName) {
    const lines = extractedText.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
    for (const line of lines.slice(0, 5)) {
      // Check if line looks like a person's name (2 to 4 capitalized words)
      const candidateLine = line.replace(/^(?:resume|cv)\s*[:-]?\s*/i, '').trim();
      if (/^[A-Za-z][a-zA-Z'–-]+(?:[ \t]+[A-Za-z][a-zA-Z'–-]+){1,3}$/.test(candidateLine) && 
          !candidateLine.includes('@') && 
          !/experience|education|skills|summary|profile|project/i.test(candidateLine)) {
        fullName = candidateLine;
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
    if (clean.length > 2 && clean.length < 40) {
      fullName = clean
        .split(' ')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
  }

function formatProperName(name: string): string {
  return name
    .split(/\s+/)
    .map(w => {
      if (w.includes('-')) {
        return w.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join('-');
      }
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');
}

  // Clean job role titles from candidate full name if accidentally included (e.g. "Adlin Yona Ui Ux Designer" -> "Adlin Yona")
  if (fullName) {
    const strippedName = fullName
      .replace(/\b(ui\/?ux|designer|developer|engineer|architect|manager|lead|frontend|backend|fullstack|consultant|analyst|specialist)\b/gi, '')
      .trim();
    if (strippedName.length >= 3) {
      fullName = formatProperName(strippedName);
    } else {
      fullName = formatProperName(fullName);
    }
  }

  // 6. Candidate Current Role & Company Extraction
  let roleTitle = '';
  let company = '';
  let experienceYears = 0;
  let location = '';

  // Detect Experience years (e.g. "2.5+ years of experience", "5 years experience")
  const expMatch = extractedText.match(/(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+experience/i);
  if (expMatch) {
    experienceYears = parseFloat(expMatch[1]);
  }

  // Detect Location (e.g. "Bengaluru, India" or "Austin, TX")
  const locMatch = extractedText.match(/\b([A-Z][a-zA-Z ]+,\s*[A-Z][a-zA-Z ]+)\b/);
  if (locMatch && !locMatch[1].includes('Experience') && !locMatch[1].includes('University')) {
    location = locMatch[1].trim();
  }

  // Detect Role Title (e.g. "UI/UX Designer", "Software Engineer")
  const roleRegex = /\b(UI\/UX Designer|UX\/UI Designer|Lead UI\/UX|Frontend Developer|Senior Frontend Engineer|Backend Developer|Full Stack Engineer|DevOps Engineer|Software Engineer|Product Designer|Graphic & UI Designer)\b/i;
  const roleFound = extractedText.match(roleRegex);
  if (roleFound) {
    roleTitle = roleFound[0].replace(/\bui\/ux\b/i, 'UI/UX').trim();
  }

  // Detect Company (e.g. "UI/UX Designer – Zool Tech Solutions", "Senior Engineer at DigitalCraft")
  const compMatch = extractedText.match(/(?:at|–|-|—)\s*([A-Za-z0-9\s&]{3,35}?)(?:\s*\n|\s*(?:Aug|Jan|Feb|Mar|Apr|May|Jun|Jul|Sep|Oct|Nov|Dec|\d{4}|Present))/i);
  if (compMatch && compMatch[1]) {
    const candidateComp = compMatch[1].trim();
    if (!/designer|engineer|developer|experience|present/i.test(candidateComp)) {
      company = candidateComp;
    }
  }

  // 7. Detect Skills Present in Text
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
    roleTitle,
    company,
    experienceYears,
    location,
    linkedIn,
    portfolio,
    detectedSkills,
    extractedText,
    wordCount
  };
}

/**
 * Parses full resume text (Markdown or plain structured text) into structured sections:
 * Summary, Work Experience timeline, Skills, Education, and Certifications.
 */
export function parseCandidateResume(resumeText?: string): ParsedResumeData | null {
  if (!resumeText || resumeText.trim().length === 0) return null;

  const rawText = resumeText.trim();

  // 1. Extract Summary
  let summary = '';
  const summaryMatch = rawText.match(/##?\s*(?:Professional\s+)?(?:Summary|Profile)\s*\n([\s\S]*?)(?=\n##?|$)/i);
  if (summaryMatch) {
    summary = summaryMatch[1].trim();
  }

  // 2. Extract Experience
  const expMatch = rawText.match(/##?\s*(?:Professional\s+)?(?:Experience|Work\s+Experience)\s*\n([\s\S]*?)(?=\n##?|$)/i);
  const experience: ResumeWorkExperience[] = [];

  if (expMatch) {
    const expContent = expMatch[1];
    // Split by '### ' or job role headers
    const roleBlocks = expContent.split(/(?=(?:###\s*|[■•-]\s*[A-Z]))/g).filter(b => b.trim().length > 10);
    
    for (const block of roleBlocks) {
      const headerLine = block.match(/(?:###|[■•-])?\s*([^|–\n]+)(?:[|–-]\s*([^\n]+))?/);
      const durationLine = block.match(/(?:\*([^*]+)\*|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})\b[^\n]*)/i);
      const highlights = Array.from(block.matchAll(/^\s*[-•*]\s*(.+)$/gm)).map(m => m[1].trim());

      if (headerLine && headerLine[1] && headerLine[1].trim().length > 3) {
        experience.push({
          role: headerLine[1]?.trim().replace(/^###\s*/, '') || 'Software Engineer',
          company: headerLine[2]?.trim().replace(/\*.*$/, '') || 'Tech Company',
          duration: durationLine ? (durationLine[1] || durationLine[0]).trim() : undefined,
          highlights
        });
      }
    }
  }

  // Fallback pattern if no markdown ### headings (e.g. "Software Engineer at Company (2020 - 2024)")
  if (experience.length === 0) {
    const plainExpMatches = Array.from(
      rawText.matchAll(/([A-Z][A-Za-z0-9\s/]{3,35})\s+(?:at|–|-|@)\s+([A-Za-z0-9\s.,&]{3,35}?)(?:\s*[–—(-]\s*(\d{4}[^\n)]*))?$/gm)
    );
    for (const m of plainExpMatches.slice(0, 4)) {
      if (m[1].length < 40 && m[2].length < 40) {
        experience.push({
          role: m[1].trim(),
          company: m[2].trim(),
          duration: m[3] ? m[3].replace(/[()]/g, '').trim() : undefined,
          highlights: []
        });
      }
    }
  }

  // 3. Extract Skills
  const skills: string[] = [];
  const skillsMatch = rawText.match(/##?\s*(?:Core\s+Technical\s+Competencies|Technical\s+Skills|Design\s+Tools|Skills)\s*\n([\s\S]*?)(?=\n##?|$)/i);
  if (skillsMatch) {
    const lines = skillsMatch[1].split('\n');
    for (const line of lines) {
      const bulletMatch = line.match(/^[-•*]\s*(?:\*\*[^*]+:\*\*\s*)?(.+)$/);
      const targetStr = bulletMatch ? bulletMatch[1] : line;
      const items = targetStr.split(/[,/|]/).map(s => s.trim().replace(/\.$/, ''));
      skills.push(...items.filter(s => s.length > 1 && s.length < 35 && !/skills|tools|competencies/i.test(s)));
    }
  }

  // 4. Extract Education
  const education: string[] = [];
  const eduMatch = rawText.match(/##?\s*Education\s*\n([\s\S]*?)(?=\n##?|$)/i);
  if (eduMatch) {
    const eduLines = eduMatch[1].split('\n').filter(l => l.trim().length > 0);
    education.push(...eduLines.map(l => l.replace(/^[-•*]\s*/, '').trim()));
  }

  // 5. Extract Certifications
  const certifications: string[] = [];
  const certMatch = rawText.match(/##?\s*(?:Certifications|Awards|Credentials|Key\s+Projects)\s*\n([\s\S]*?)(?=\n##?|$)/i);
  if (certMatch) {
    const certLines = certMatch[1].split('\n').filter(l => l.trim().length > 0);
    certifications.push(...certLines.map(l => l.replace(/^[-•*]\s*/, '').trim()));
  }

  return {
    summary,
    experience,
    skills,
    education,
    certifications,
    rawText
  };
}
