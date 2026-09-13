import { describe, it, expect } from 'vitest';
import { cleanExtractedText, parseContactInfoFromText } from '../lib/resume-parser';
import { evaluateResumeDeterministically } from '../lib/ai-screening';

describe('Resume Parser & ATS Ingestion Verification', () => {
  it('cleanExtractedText correctly strips HTML scripts, styles and excessive whitespace', () => {
    const rawHtml = `
      <html>
        <head><style>.test { color: red; }</style></head>
        <body>
          <h1 class="name">Elena Rostova</h1>
          <script>console.log("secret");</script>
          <p>Lead UI/UX Designer with 5 years experience.</p>
        </body>
      </html>
    `;
    const cleaned = cleanExtractedText(rawHtml);
    expect(cleaned).not.toContain('<style>');
    expect(cleaned).not.toContain('console.log');
    expect(cleaned).toContain('Elena Rostova');
    expect(cleaned).toContain('Lead UI/UX Designer with 5 years experience.');
  });

  it('parseContactInfoFromText extracts name, email, phone, and links from markdown resume', () => {
    const mdText = `
# Tariq Al-Mansoor
Email: tariq.almansoor@wpdev.io | Phone: +1 (512) 840-2194 | GitHub: https://github.com/tariq-wpdev | Portfolio: https://tariq.dev

## Professional Summary
Senior WordPress Architect with 5 years of experience in PHP 8, Gutenberg Blocks, and WooCommerce.
    `;

    const contact = parseContactInfoFromText(mdText, 'tariq_resume.md');
    expect(contact.fullName).toBe('Tariq Al-Mansoor');
    expect(contact.email).toBe('tariq.almansoor@wpdev.io');
    expect(contact.phone).toBe('+1 (512) 840-2194');
    expect(contact.portfolio).toContain('github.com/tariq-wpdev');
    expect(contact.wordCount).toBeGreaterThan(15);
    expect(contact.detectedSkills).toContain('WordPress Core');
    expect(contact.detectedSkills).toContain('PHP');
    expect(contact.detectedSkills).toContain('Gutenberg Blocks');
  });

  it('parseContactInfoFromText falls back gracefully to cleaned file name when text has no header', () => {
    const plainText = `
email: alex.mercer@gmail.com
phone: +1 555 0199
Experienced engineer in full stack development.
    `;
    const contact = parseContactInfoFromText(plainText, 'Alex_Mercer_Resume.pdf');
    expect(contact.fullName).toBe('Alex Mercer');
    expect(contact.email).toBe('alex.mercer@gmail.com');
  });

  it('confirms that uploaded resume text is parsed and evaluated honestly by ATS engine', () => {
    // 1. High Fit candidate
    const wpResume = `
# Tariq Al-Mansoor
Email: tariq@wp.dev
5 years of experience building custom WordPress themes, custom plugins, Gutenberg blocks with React, ACF Pro, WooCommerce, and PHP 8.
    `;

    const highEval = evaluateResumeDeterministically({
      candidateName: 'Tariq Al-Mansoor',
      resumeText: wpResume,
      job: {
        title: 'WordPress Developer (Custom Themes, Plugins & Headless)',
        requirements: ['WordPress', 'PHP', 'Gutenberg blocks', 'ACF Pro', 'WooCommerce'],
        responsibilities: ['Build custom themes', 'Plugin engineering']
      }
    });

    expect(highEval.score).toBe('high');
    expect(highEval.similarity).toBeGreaterThanOrEqual(0.72);
    expect(highEval.matchedSkills).toContain('WordPress Core');
    expect(highEval.matchedSkills).toContain('PHP');
    expect(highEval.matchedSkills).toContain('Gutenberg Blocks');
    expect(highEval.matchedSkills).toContain('ACF Pro');

    // 2. Mismatched candidate (DevOps applying to WordPress role)
    const devopsResume = `
# David Chen
Email: david@cloud.dev
4 years of experience with AWS, Kubernetes, Docker, Terraform, and Python.
    `;

    const lowEval = evaluateResumeDeterministically({
      candidateName: 'David Chen',
      resumeText: devopsResume,
      job: {
        title: 'WordPress Developer (Custom Themes, Plugins & Headless)',
        requirements: ['WordPress', 'PHP', 'Gutenberg blocks', 'ACF Pro', 'WooCommerce']
      }
    });

    expect(lowEval.score).toBe('low');
    expect(lowEval.similarity).toBeLessThan(0.40);
    expect(lowEval.matchedSkills).not.toContain('WordPress Core');
    expect(lowEval.matchedSkills).not.toContain('PHP');
    expect(lowEval.retentionRiskFactor).toContain('Domain gap');
  });
});
