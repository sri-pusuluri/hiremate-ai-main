import { describe, it, expect } from 'vitest';
import { evaluateResumeDeterministically } from '../lib/ai-screening';

describe('Dynamic ATS Screening Engine', () => {
  const alexMercerResume = `
# Resume: Alex Mercer
Email: alex.mercer@email.dev | Location: Remote
Summary: Resourceful Full Stack Engineer with 4 years of experience building scalable web solutions.
Technical Skills:
- Frontend: React, Redux Toolkit, TypeScript, HTML5/CSS3, Tailwind CSS
- Backend: Node.js, Express, REST APIs, GraphQL
- Database: PostgreSQL, MySQL, Redis
- DevOps: Docker, AWS (S3, EC2), Git, GitHub Actions

Experience:
Software Engineer | TechSolutions Inc. (June 2022 - Present)
- Spearheaded development of a modern customer billing dashboard using React and Tailwind CSS.
- Built robust RESTful APIs in Node.js and Express to handle transactions.
- Optimized PostgreSQL database queries.
`;

  const wordPressJob = {
    title: 'WordPress Developer (Custom Themes, Plugins & Headless)',
    description: 'We are seeking a passionate WordPress Developer to build custom themes, Gutenberg blocks, and custom plugins with PHP 8 and WooCommerce.',
    requirements: [
      '3 to 5 years of hands-on WordPress development experience',
      'Strong proficiency in PHP (7.4 & 8.x), MySQL, JavaScript (ES6+), HTML5, and CSS3/SCSS',
      'Demonstrated capability of creating custom WordPress themes and plugins from the ground up',
      'Deep expertise with Advanced Custom Fields (ACF Pro) and Gutenberg block creation',
      'WooCommerce store customization',
      'Core Web Vitals performance optimization',
      'Git workflows'
    ],
    responsibilities: [
      'Develop custom themes and Gutenberg blocks with PHP and React',
      'Architect custom plugins adhering to WordPress VIP coding standards'
    ]
  };

  const fullStackJob = {
    title: 'Full Stack Engineer (React, Node.js, TypeScript)',
    description: 'Looking for a skilled Full Stack Engineer experienced in building scalable web applications with React, TypeScript, Node.js, and relational databases.',
    requirements: [
      '3+ years experience with React and TypeScript',
      'Backend development in Node.js and Express',
      'PostgreSQL or MySQL relational database design',
      'Building and consuming REST APIs and GraphQL',
      'Docker and AWS cloud deployments',
      'Git and CI/CD pipelines'
    ]
  };

  it('correctly classifies a mismatched candidate as Low fit without fake skills injection', () => {
    const result = evaluateResumeDeterministically({
      candidateName: 'Alex Mercer',
      resumeText: alexMercerResume,
      job: wordPressJob
    });

    // Score must be Low (< 35%) because Alex has zero WordPress or PHP experience
    expect(result.score).toBe('low');
    expect(result.similarity).toBeLessThanOrEqual(0.32);
    expect(result.isUnprocessed).toBe(false);

    // Missing skills must explicitly identify PHP and WordPress
    expect(result.missingSkills).toContain('PHP');
    expect(result.missingSkills).toContain('WordPress Core');

    // Matched skills should only be technologies actually present in resume that match JD (e.g. MySQL, REST APIs, Git)
    expect(result.matchedSkills).toContain('MySQL');
    expect(result.matchedSkills).not.toContain('WordPress Core');
    expect(result.matchedSkills).not.toContain('PHP');

    // Assessment should explain the domain gap
    expect(result.assessment).toContain('lacks core WordPress Developer (Custom Themes, Plugins & Headless) competencies');
  });

  it('correctly classifies a matched candidate as High fit when skills align', () => {
    const result = evaluateResumeDeterministically({
      candidateName: 'Alex Mercer',
      resumeText: alexMercerResume,
      job: fullStackJob
    });

    // Score must be High (>= 72%) because Alex is a strong React/Node engineer
    expect(result.score).toBe('high');
    expect(result.similarity).toBeGreaterThanOrEqual(0.72);

    // Matched skills should include his core strengths
    expect(result.matchedSkills).toContain('React');
    expect(result.matchedSkills).toContain('TypeScript');
    expect(result.matchedSkills).toContain('Node.js');
    expect(result.matchedSkills).toContain('PostgreSQL');

    // Assessment must be positive
    expect(result.assessment).toContain('Strong match');
  });

  it('returns explicit diagnostic error when resume text is empty or corrupted', () => {
    const emptyResult = evaluateResumeDeterministically({
      candidateName: 'Empty Applicant',
      resumeText: '',
      job: wordPressJob
    });

    expect(emptyResult.isUnprocessed).toBe(true);
    expect(emptyResult.similarity).toBeNull();
    expect(emptyResult.error).toContain('Data Not Processed');
    expect(emptyResult.assessment).toContain('No parseable resume text');
  });
});
