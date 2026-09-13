import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { evaluateResumeDeterministically } from '../src/lib/ai-screening';

const envPath = path.resolve(process.cwd(), '.env');
const env = fs.readFileSync(envPath, 'utf8');

function getVal(key: string): string {
  const m = env.match(new RegExp(`${key}="?([^\\r\\n"]+)"?`));
  return m ? m[1].trim() : '';
}

const supabaseUrl = getVal('VITE_SUPABASE_URL');
const supabaseKey = getVal('VITE_SUPABASE_PUBLISHABLE_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);

const CLIENT_ID = '00000000-0000-0000-0000-000000000001';

interface CandidateDefinition {
  jobId: string;
  fullName: string;
  email: string;
  phone: string;
  roleTitle: string;
  company: string;
  experience: number;
  resumeText: string;
  fileName: string;
}

const CANDIDATES: CandidateDefinition[] = [
  // ==========================================
  // JOB 1: WordPress Developer
  // ==========================================
  {
    jobId: '327d29eb-2660-47be-a55a-2b42c96b0f66',
    fullName: 'Tariq Al-Mansoor',
    email: 'tariq.almansoor@wpdev.io',
    phone: '+1 (512) 840-2194',
    roleTitle: 'Senior WordPress & Headless Architect',
    company: 'Automattic Partner Agency',
    experience: 5,
    fileName: 'tariq_al_mansoor.md',
    resumeText: `# Tariq Al-Mansoor
Email: tariq.almansoor@wpdev.io | Phone: +1 (512) 840-2194 | Location: Austin, TX (Remote) | GitHub: github.com/tariq-wpdev

## Professional Summary
Senior WordPress Engineer with 5 years of specialized experience architecting custom themes, custom plugins, and enterprise headless CMS platforms. Deep technical authority in PHP 8 modern OOP, WordPress Coding Standards (WPCS), Gutenberg block engineering with React and @wordpress/blocks, Advanced Custom Fields (ACF Pro), and WooCommerce payment gateways. Proven record of optimizing Core Web Vitals to 95+ scores on Lighthouse.

## Core Technical Competencies
- **WordPress Core:** Custom Themes from scratch, Custom Plugins, Template Hierarchy, WP_Query, Transient API, Hook Architecture (Actions/Filters), Nonces, Data Sanitization
- **Modern Development:** PHP 8, Gutenberg Blocks, Advanced Custom Fields (ACF Pro), Custom Post Types (CPT), Custom Taxonomies, REST APIs
- **Frontend & Headless:** JavaScript ES6+, React, HTML5/CSS3, Tailwind CSS, Headless CMS integration with Next.js
- **E-Commerce & Data:** WooCommerce, MySQL schema design, query optimization
- **DevOps & Tooling:** Git & CI/CD workflows, WP Engine, Kinsta, Cloudways, Docker, Composer, npm

## Professional Experience
### Senior WordPress Architect | DigitalCraft Solutions (Automattic Partner)
*March 2022 – Present*
- Engineered 14 bespoke custom WordPress themes and high-traffic plugins from ground zero adhering strictly to WPCS guidelines.
- Created over 35 dynamic Gutenberg blocks using React, ESNext, and @wordpress/block-editor, empowering editorial teams to build complex landing pages without shortcode hacks.
- Implemented deep ACF Pro flexible content layouts, custom options pages, and structured relational queries via WP_Query.
- Built custom REST API endpoints to feed a headless Next.js frontend, maintaining sub-300ms response times with transient caching.
- Enforced security protocols using nonce verification, current_user_can capability checks, and esc_html/sanitize_text_field sanitization.

### Full Stack WordPress Developer | Austin Web Agency
*January 2020 – February 2022*
- Developed custom WooCommerce checkout flows, automated subscription billing modules, and third-party logistics webhook integrations.
- Optimized database queries across 250,000+ posts, tuning MySQL indexes and eliminating N+1 database queries.
- Audited Core Web Vitals across client portfolio, elevating Largest Contentful Paint (LCP) from 4.2s to 1.4s.
- Managed version-controlled deployments using GitHub Actions directly to WP Engine staging and production clusters.

## Education
B.S. in Computer Science — University of Texas at Austin (2019)`
  },
  {
    jobId: '327d29eb-2660-47be-a55a-2b42c96b0f66',
    fullName: 'Rachel Vance',
    email: 'rachel.vance@designweb.co',
    phone: '+1 (602) 771-4402',
    roleTitle: 'Web Designer & Junior WordPress Integrator',
    company: 'BrightPixel Creative',
    experience: 2,
    fileName: 'rachel_vance.md',
    resumeText: `# Rachel Vance
Email: rachel.vance@designweb.co | Phone: +1 (602) 771-4402 | Location: Phoenix, AZ | Portfolio: rachelvancedesign.com

## Professional Summary
Creative Web Designer and Frontend Integrator with 2 years of experience building visually appealing client websites using WordPress Core, Elementor page builder, HTML5/CSS3, and responsive styling. Passionate about typography, responsive layouts, and user engagement.

## Technical Skills
- **CMS & Builders:** WordPress Core, Elementor Pro, Basic WooCommerce setup
- **Frontend:** HTML5/CSS3, JavaScript basics, Tailwind CSS, Responsive Web Design
- **Design Tools:** Figma, Adobe Photoshop, Adobe Illustrator
- **Version Control:** Basic Git, cPanel file manager

## Experience
### Junior Web Designer & Integrator | BrightPixel Creative
*August 2023 – Present*
- Customized WordPress sites using pre-built child themes and Elementor templates for small businesses.
- Styled headers, footers, and landing pages with custom CSS and responsive media queries.
- Assisted with blog migrations, content updates, and plugin updates.
- Collaborated with marketing managers to produce promotional banners and landing page graphics.

## Education
B.A. in Graphic Design & Web Communication — Arizona State University (2023)`
  },

  // ==========================================
  // JOB 2: MEAN Stack Developer
  // ==========================================
  {
    jobId: '7aea3405-5394-424b-8379-ccc2d6807b68',
    fullName: 'Kunal Shah',
    email: 'kunal.shah@meanstack.dev',
    phone: '+1 (408) 512-8873',
    roleTitle: 'Senior Full Stack MEAN Engineer',
    company: 'CloudNexus Solutions',
    experience: 4,
    fileName: 'kunal_shah.md',
    resumeText: `# Kunal Shah
Email: kunal.shah@meanstack.dev | Phone: +1 (408) 512-8873 | Location: San Jose, CA (Hybrid) | GitHub: github.com/kunal-mean

## Professional Summary
Senior Full Stack Engineer with 4.5 years of hands-on experience in the JavaScript/TypeScript ecosystem, specializing in both Angular and React on the frontend and Node.js with MongoDB on the backend. Expert in architectural design, asynchronous I/O, MongoDB aggregation pipelines, and reactive state management with RxJS and Redux.

## Core Technical Competencies
- **Frontend Dual Mastery:** Angular 16+ (Components, Services, Directives, RxJS, Dependency Injection, Signals), React 18 (Functional Components, Hooks, Context API, Redux Toolkit), HTML5/CSS3, Tailwind CSS, Core Web Vitals
- **Backend Mastery:** Node.js, Express.js, REST APIs, GraphQL, Microservices, Async I/O, Security (CORS, Helmet, JWT)
- **Database Expertise:** MongoDB, Mongoose ODM, Schema Architecture, Aggregation Pipelines, Transactions, Compound Indexing, Redis caching, PostgreSQL
- **Languages:** TypeScript (strict mode, generics, union types), JavaScript (ES6+)
- **Tooling & Cloud:** Git & CI/CD, Docker, AWS (EC2, S3), npm/yarn, Postman, Webpack, Vite, Angular CLI, Jest, System Design

## Professional Experience
### Lead MEAN Stack Engineer | CloudNexus Solutions
*May 2022 – Present*
- Architected enterprise SaaS management portal utilizing Angular 16 on the frontend and Node.js / Express microservices on the backend.
- Leveraged RxJS Observables and Subject streams for real-time sensor telemetries, reducing unnecessary DOM recalculations by 40%.
- Designed and maintained high-throughput MongoDB databases handling 12M+ documents; implemented complex multi-stage aggregation pipelines ($lookup, $unwind, $facet) reducing analytics query runtimes from 2.8s to 180ms.
- Built reusable React micro-frontend dashboards embedded within customer self-service portals, ensuring consistent design tokens.
- Authored strictly typed TypeScript interfaces shared across frontend clients and backend services.

### Full Stack Software Engineer | Horizon Fintech Labs
*July 2020 – April 2022*
- Developed authenticated REST APIs in Node.js and Express to process merchant transactions with rigorous rate-limiting and input validation.
- Converted legacy AngularJS applications into modern Angular 12 modular architecture with dependency injection and lazy-loaded routing.
- Designed schema validations and transaction rollbacks using Mongoose ODM for financial ledgers.
- Established automated testing pipelines using Jest, Supertest, and GitHub Actions CI.

## Education
B.S. in Software Engineering — San Jose State University (2020)`
  },
  {
    jobId: '7aea3405-5394-424b-8379-ccc2d6807b68',
    fullName: 'Priya Sharma',
    email: 'priya.sharma@frontendflow.com',
    phone: '+1 (650) 931-4022',
    roleTitle: 'Frontend React Specialist',
    company: 'NextGen Web Labs',
    experience: 3,
    fileName: 'priya_sharma_mean.md',
    resumeText: `# Priya Sharma
Email: priya.sharma@frontendflow.com | Phone: +1 (650) 931-4022 | Location: San Francisco, CA | GitHub: github.com/priyasharma-ui

## Professional Summary
Frontend Developer with 3 years of experience specializing in React, TypeScript, Redux Toolkit, and modern CSS architecture. Passionate about building responsive user interfaces, accessible web components, and smooth animations.

## Core Competencies
- **Frontend:** React, TypeScript, Redux Toolkit, HTML5/CSS3, Tailwind CSS, Next.js
- **Backend & APIs:** REST APIs, Node.js basics, Express basics, JSON
- **Databases:** PostgreSQL basics, SQLite
- **Tools:** Git, Postman, Vite, Storybook, Figma

## Professional Experience
### Frontend UI Engineer | NextGen Web Labs
*February 2022 – Present*
- Built customer-facing analytics dashboards using React, TypeScript, and Tailwind CSS.
- Managed global state with Redux Toolkit and integrated RESTful endpoints with Axios.
- Partnered with product designers to implement pixel-perfect Figma screens.
- Focused primarily on client-side state; limited exposure to Angular enterprise structures or MongoDB aggregation pipelines.

## Education
B.S. in Information Systems — UC Davis (2021)`
  },
  {
    jobId: '7aea3405-5394-424b-8379-ccc2d6807b68',
    fullName: 'David Chen',
    email: 'david.chen@clouddev.net',
    phone: '+1 (415) 892-3341',
    roleTitle: 'Senior DevOps & Cloud Infrastructure Engineer',
    company: 'CloudScale Infrastructure',
    experience: 4,
    fileName: 'david_chen_mean.md',
    resumeText: `# David Chen
Email: david.chen@clouddev.net | Phone: +1 (415) 892-3341 | Location: San Francisco, CA | LinkedIn: linkedin.com/in/davidchen-devops

## Professional Summary
DevOps & Cloud Systems Engineer with 4 years of experience specializing in AWS cloud infrastructure, Kubernetes clusters, Docker containerization, and Terraform automation. Expertise in setting up continuous deployment pipelines and site reliability engineering.

## Technical Skills
- **Cloud & DevOps:** AWS (EC2, S3, RDS, VPC), Docker, Kubernetes, Terraform, GitHub Actions, Linux administration
- **Languages & Tools:** Python, Bash scripting, SQL, Prometheus, Grafana, CI/CD pipelines
- **Infrastructure:** Microservices architecture, cluster autoscaling, high availability systems

## Experience
### Cloud Systems Engineer | CloudScale Infrastructure
*January 2021 – Present*
- Deployed multi-region Kubernetes clusters on AWS EKS serving 50+ microservices.
- Wrote declarative Terraform modules provisioning VPCs, security groups, and automated backups.
- Monitored cluster health and lowered operational downtime by 30%.

## Education
B.S. in Computer Engineering — San Francisco State University (2020)`
  },

  // ==========================================
  // JOB 3: UX/UI Designer
  // ==========================================
  {
    jobId: 'c88102e3-796d-4553-87b4-9966d545bb7e',
    fullName: 'Elena Rostova',
    email: 'elena.rostova@designsystems.io',
    phone: '+1 (415) 628-9901',
    roleTitle: 'Lead UI/UX & Design Systems Architect',
    company: 'Veloce Systems',
    experience: 5,
    fileName: 'elena_rostova.md',
    resumeText: `# Elena Rostova
Email: elena.rostova@designsystems.io | Phone: +1 (415) 628-9901 | Location: San Francisco, CA (Hybrid / Remote) | Portfolio: portfolio.elenarostova.dev

## Professional Summary
Lead UI/UX Designer and Design Systems Architect with 5.5 years of experience crafting enterprise web applications, design systems, and user-centered SaaS experiences. Expert in Figma mastery (Auto-layout, Variants, Interactive Components, Design Tokens, Variables), User Research, Wireframing, and Web Accessibility (WCAG AAA). Deep technical literacy in HTML5/CSS3 and Tailwind CSS ensuring designs are seamlessly feasible to engineer.

## Core Design Competencies
- **Design Tooling:** Figma (Expert in Auto-layout, Variants, Interactive Components, Component Properties, Design Tokens, Variables)
- **UX Process:** User Research, User Journeys, Wireframing, Prototyping, Information Architecture, Heuristic Evaluation, Usability Testing
- **Design Systems:** Multi-brand Design Systems, Design Tokens, Storybook synchronization, Documentation
- **Accessibility & Standards:** WCAG AAA compliance, Color Contrast, Keyboard Navigation, Screen Reader workflows
- **Technical Literacy:** HTML5/CSS3, Tailwind CSS, Responsive Breakpoints, Web Performance Constraints

## Professional Experience
### Lead UI/UX & Design Systems Architect | Veloce Systems
*April 2021 – Present*
- Architected and governed an enterprise multi-tenant Figma design system with 250+ components, utilized by 12 cross-functional product teams.
- Standardized design token architectures (spacing, typography, semantic colors, elevation) and synchronized tokens directly to Tailwind CSS via automated pipeline.
- Conducted over 40 moderated user usability sessions and card sorting exercises, reducing user onboarding drop-off by 28%.
- Produced high-fidelity interactive Figma prototypes demonstrating micro-interactions, responsive states, and validation edge cases for developer handoffs.
- Championed WCAG AAA accessibility across all web products, auditing color contrast and interactive focus rings.

### Senior Product Designer | Horizon Labs
*September 2019 – March 2021*
- Led end-to-end UX redesign of cloud security dashboard, transforming complex telemetry data into intuitive visual workflows.
- Developed comprehensive wireframes, user flow diagrams, and interactive prototypes for executive stakeholders.
- Partnered directly with engineering leads in daily standups to verify responsive CSS implementation fidelity.

## Education
B.S. in Human-Computer Interaction & Cognitive Science — University of Washington (2019)`
  },
  {
    jobId: 'c88102e3-796d-4553-87b4-9966d545bb7e',
    fullName: 'Marcus Vance',
    email: 'marcus.vance@brandcraft.agency',
    phone: '+1 (312) 449-8012',
    roleTitle: 'Product & Interaction Designer',
    company: 'Horizon Digital Studio',
    experience: 3,
    fileName: 'marcus_vance.md',
    resumeText: `# Marcus Vance
Email: marcus.vance@brandcraft.agency | Phone: +1 (312) 449-8012 | Location: Chicago, IL | Portfolio: marcusvance.design

## Professional Summary
Product and Interaction Designer with 3 years of experience designing mobile apps and web platforms. Skilled in Figma, wireframing, UI prototyping, and visual branding.

## Skills
- **Design:** UI/UX Design, Figma, Design Systems, Wireframing, Prototyping, Mobile App Design
- **Frontend Familiarity:** HTML5/CSS3 basics, responsive layout constraints
- **Visual:** Adobe Creative Suite (Photoshop, Illustrator), Typography, Iconography
- **Process:** User Flows, Concept Sketches, Rapid Prototyping

## Experience
### Product Designer | Horizon Digital Studio
*June 2022 – Present*
- Designed consumer web and mobile app interfaces in Figma with interactive prototypes.
- Created wireframes and user flow charts for early-stage startup clients.
- Maintained a UI component kit for internal projects.

## Education
B.A. in Visual Design — Columbia College Chicago (2022)`
  },
  {
    jobId: 'c88102e3-796d-4553-87b4-9966d545bb7e',
    fullName: 'Rohan Mehta',
    email: 'rohan.mehta@datanode.io',
    phone: '+1 (206) 714-3329',
    roleTitle: 'Junior Backend & Systems Developer',
    company: 'CoreData Labs',
    experience: 2,
    fileName: 'rohan_mehta_ux.md',
    resumeText: `# Rohan Mehta
Email: rohan.mehta@datanode.io | Phone: +1 (206) 714-3329 | Location: Seattle, WA | GitHub: github.com/rohan-data

## Professional Summary
Junior Backend Developer with 1.5 years of experience in Python, SQL databases, REST APIs, and Linux server scripting.

## Technical Skills
- Python, SQL, PostgreSQL, REST APIs, Git, Linux
- Data pipelines, ETL scripts, Cron jobs, Server monitoring

## Experience
### Junior Backend Developer | CoreData Labs
*January 2023 – Present*
- Wrote Python data ingestion scripts and managed database migrations in PostgreSQL.
- Maintained automated cron jobs and server backups.

## Education
B.S. in Computer Science — Washington State University (2023)`
  }
];

async function main() {
  console.log('--- Ingesting Realistic Sample Candidates ---');

  // Fetch jobs
  const { data: jobs, error: jErr } = await supabase
    .from('jobs')
    .select('id, title, description, requirements, responsibilities');

  if (jErr || !jobs) {
    console.error('Failed fetching jobs:', jErr);
    process.exit(1);
  }

  const jobMap = new Map(jobs.map(j => [j.id, j]));

  // Ensure samples/resumes folder exists
  const resumesDir = path.resolve(process.cwd(), 'samples/resumes');
  if (!fs.existsSync(resumesDir)) {
    fs.mkdirSync(resumesDir, { recursive: true });
  }

  for (const cand of CANDIDATES) {
    const job = jobMap.get(cand.jobId);
    if (!job) {
      console.warn(`Job ${cand.jobId} not found for candidate ${cand.fullName}`);
      continue;
    }

    // Save resume file to samples/resumes
    const filePath = path.join(resumesDir, cand.fileName);
    fs.writeFileSync(filePath, cand.resumeText, 'utf8');
    console.log(`Saved sample resume to ${cand.fileName}`);

    // Evaluate deterministically
    const evalResult = evaluateResumeDeterministically({
      candidateName: cand.fullName,
      resumeText: cand.resumeText,
      job: {
        title: job.title,
        description: job.description,
        requirements: job.requirements || [],
        responsibilities: job.responsibilities || []
      }
    });

    console.log(`[Screening] ${cand.fullName} -> Job: "${job.title.slice(0, 30)}..."`);
    console.log(`   Score: ${evalResult.score.toUpperCase()} | Similarity: ${Math.round((evalResult.similarity || 0) * 100)}%`);
    console.log(`   Matched Skills (${evalResult.matchedSkills.length}): [${evalResult.matchedSkills.join(', ')}]`);
    console.log(`   Missing Skills (${evalResult.missingSkills.length}): [${evalResult.missingSkills.join(', ')}]`);

    // Check if candidate already exists in this job
    const { data: existing } = await supabase
      .from('candidates')
      .select('id')
      .eq('email', cand.email)
      .eq('job_id', cand.jobId)
      .maybeSingle();

    const candidatePayload = {
      full_name: cand.fullName,
      email: cand.email,
      phone: cand.phone,
      job_id: cand.jobId,
      client_id: CLIENT_ID,
      source: 'applied',
      status: 'new',
      pipeline_stage: 'applied',
      experience: evalResult.experience || cand.experience,
      role_title: cand.roleTitle,
      company: cand.company,
      resume_text: cand.resumeText,
      resume_url: `/samples/resumes/${cand.fileName}`,
      ai_score: evalResult.score,
      cosine_similarity: evalResult.similarity,
      matched_skills: evalResult.matchedSkills,
      missing_skills: evalResult.missingSkills,
      predictive_insights: {
        currentRole: cand.roleTitle,
        company: cand.company,
        interviewPassProb: evalResult.interviewPassProb,
        offerAcceptanceProb: evalResult.offerAcceptanceProb,
        onboardingSuccessProb: evalResult.onboardingSuccessProb,
        retentionRisk: evalResult.retentionRisk,
        retentionRiskFactor: evalResult.retentionRiskFactor,
        timeToJoinEstimate: evalResult.timeToJoinEstimate,
        assessment: evalResult.assessment,
        evaluatedAt: new Date().toISOString()
      }
    };

    if (existing) {
      const { error: upErr } = await supabase
        .from('candidates')
        .update(candidatePayload)
        .eq('id', existing.id);

      if (upErr) console.error(`Error updating ${cand.fullName}:`, upErr.message);
      else console.log(`   Updated existing record (${existing.id}) in Supabase.`);
    } else {
      const { error: inErr } = await supabase
        .from('candidates')
        .insert([{ ...candidatePayload, created_at: new Date().toISOString() }]);

      if (inErr) console.error(`Error inserting ${cand.fullName}:`, inErr.message);
      else console.log(`   Inserted new candidate into Supabase.`);
    }
    console.log('---');
  }

  console.log('Candidate ingestion completed successfully!');
}

main().catch(console.error);
