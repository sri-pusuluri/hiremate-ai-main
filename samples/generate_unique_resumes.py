import os
import subprocess

RESUMES_DIR = "samples/resumes"
os.makedirs(RESUMES_DIR, exist_ok=True)

resumes = [
    # 1. ELENA ROSTOVA - 94% Top Match (UI/UX Frontend Architect)
    {
        "id": "elena_rostova",
        "name": "Elena Rostova",
        "title": "Lead UI/UX & Frontend Architect",
        "contact": "elena.rostova@designsystems.io • +1 (415) 628-9901 • San Francisco, CA • linkedin.com/in/elenarostova-ui",
        "html": """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: letter; margin: 20mm; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5; margin: 0; padding: 24px; background: #ffffff; }
  .header { border-bottom: 3px solid #6366f1; padding-bottom: 16px; margin-bottom: 20px; }
  .name { font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; margin: 0; }
  .role-title { font-size: 16px; font-weight: 600; color: #6366f1; margin-top: 4px; }
  .contact-bar { font-size: 12px; color: #64748b; margin-top: 8px; }
  h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #4338ca; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin: 18px 0 10px 0; }
  .summary { font-size: 13px; color: #334155; line-height: 1.6; }
  .skill-pills { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0; }
  .pill { display: inline-block; padding: 3px 8px; background: #eef2ff; color: #4338ca; font-size: 11px; font-weight: 600; border-radius: 4px; border: 1px solid #c7d2fe; margin-right: 4px; margin-bottom: 4px; }
  .exp-item { margin-bottom: 14px; }
  .exp-head { display: flex; justify-content: space-between; font-size: 13.5px; font-weight: 700; color: #0f172a; }
  .exp-company { font-size: 12px; font-weight: 600; color: #6366f1; margin-bottom: 4px; }
  ul { margin: 4px 0 0 18px; padding: 0; font-size: 12.5px; color: #334155; }
  li { margin-bottom: 3px; }
</style>
</head>
<body>
  <div class="header">
    <h1 class="name">Elena Rostova</h1>
    <div class="role-title">Lead UI/UX & Frontend Architect (Design Systems)</div>
    <div class="contact-bar">elena.rostova@designsystems.io • +1 (415) 628-9901 • San Francisco, CA (Hybrid / Remote) • portfolio.elenarostova.dev</div>
  </div>

  <h2>Professional Profile</h2>
  <p class="summary">
    Senior UI/UX Front End Architect with 6+ years specializing in modern React 18, TypeScript, and design systems. Expert bridge between product design (Figma, token architecture, WCAG AAA accessibility) and production web applications (Next.js, TailwindCSS, micro-frontends). Led core design systems utilized by 45+ enterprise application engineers.
  </p>

  <h2>Core Competencies & Technologies</h2>
  <div class="skill-pills">
    <span class="pill">React 18</span>
    <span class="pill">TypeScript</span>
    <span class="pill">TailwindCSS</span>
    <span class="pill">Figma Design Tokens</span>
    <span class="pill">UI/UX Design Systems</span>
    <span class="pill">Storybook</span>
    <span class="pill">Next.js</span>
    <span class="pill">Web Accessibility (WCAG)</span>
    <span class="pill">Responsive Architecture</span>
    <span class="pill">Component Libraries</span>
  </div>

  <h2>Professional Experience</h2>
  <div class="exp-item">
    <div class="exp-head">
      <span>Lead Frontend & Design Systems Architect</span>
      <span>2022 – Present</span>
    </div>
    <div class="exp-company">Veloce Systems • San Francisco, CA</div>
    <ul>
      <li>Architected multi-tenant React + TypeScript component library used by 12 product teams, reducing UI defect rates by 68%.</li>
      <li>Synchronized Figma design tokens directly into TailwindCSS configuration via automated CI pipeline.</li>
      <li>Conducted user testing and revamped client onboarding flow, driving an 18% improvement in conversion.</li>
      <li>Authored comprehensive Storybook documentation, interactive component guidelines, and accessibility audits.</li>
    </ul>
  </div>

  <div class="exp-item">
    <div class="exp-head">
      <span>Senior Frontend Engineer (UI/UX Specialist)</span>
      <span>2019 – 2022</span>
    </div>
    <div class="exp-company">Aura Labs • Seattle, WA</div>
    <ul>
      <li>Designed and built customer-facing SaaS dashboards with React, Next.js, and CSS Modules.</li>
      <li>Partnered directly with principal product designers to implement micro-animations and responsive layouts.</li>
      <li>Optimized client-side bundle size by 35% using lazy-loading and dynamic imports.</li>
    </ul>
  </div>

  <h2>Education</h2>
  <p class="summary"><strong>B.S. in Human-Computer Interaction & Computer Science</strong> — University of Washington (2019)</p>
</body>
</html>"""
    },

    # 2. ALEX MERCER - 84% Strong Match (Full Stack & Frontend Engineer)
    {
        "id": "alex_mercer",
        "name": "Alex Mercer",
        "title": "Senior Full Stack & Frontend Engineer",
        "contact": "alex.mercer@techsolutions.dev • +1 (555) 019-9482 • San Francisco, CA • linkedin.com/in/alexmercer-dev",
        "html": """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: letter; margin: 20mm; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; line-height: 1.5; margin: 0; padding: 24px; background: #ffffff; }
  .name { font-size: 26px; font-weight: 700; color: #0284c7; margin: 0; }
  .tagline { font-size: 14px; font-weight: 600; color: #475569; margin-top: 2px; }
  .contact { font-size: 11.5px; color: #64748b; margin: 6px 0 16px 0; border-bottom: 2px solid #0284c7; padding-bottom: 8px; }
  h2 { font-size: 13px; font-weight: 700; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px; margin: 16px 0 8px 0; border-bottom: 1px solid #e0f2fe; padding-bottom: 4px; }
  p { font-size: 12.5px; color: #334155; margin: 4px 0; }
  .skills-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 8px 12px; font-size: 12px; margin-bottom: 12px; }
  .job { margin-bottom: 14px; }
  .job-title-row { font-size: 13px; font-weight: bold; color: #0f172a; }
  .job-sub { font-size: 11.5px; color: #0284c7; margin-bottom: 4px; }
  ul { margin: 4px 0 0 18px; padding: 0; font-size: 12px; color: #334155; }
  li { margin-bottom: 3px; }
</style>
</head>
<body>
  <h1 class="name">Alex Mercer</h1>
  <div class="tagline">Senior Full Stack Engineer (React, TypeScript & Web Architecture)</div>
  <div class="contact">Email: alex.mercer@techsolutions.dev | Phone: +1 (555) 019-9482 | Location: San Francisco, CA | GitHub: github.com/alexmercer</div>

  <h2>Executive Summary</h2>
  <p>
    Accomplished Senior Full Stack Engineer with 5+ years of experience delivering robust web applications using React, TypeScript, TailwindCSS, and Node.js. Experienced in designing responsive user interfaces, integrating backend microservices, and optimizing frontend performance.
  </p>

  <h2>Technical Toolset</h2>
  <div class="skills-box">
    <strong>Frontend:</strong> React 18, TypeScript, Tailwind CSS, Next.js, Redux Toolkit, HTML5/CSS3, Vite<br>
    <strong>Backend:</strong> Node.js, Express, Fastify, REST APIs, GraphQL, PostgreSQL<br>
    <strong>Testing & CI:</strong> Jest, React Testing Library, Cypress, GitHub Actions, Docker
  </div>

  <h2>Employment History</h2>
  <div class="job">
    <div class="job-title-row">Senior Full Stack Engineer — TechSolutions Inc. (2022 – Present)</div>
    <div class="job-sub">San Francisco, CA (Remote)</div>
    <ul>
      <li>Built high-throughput customer dashboard using React, TypeScript, and TailwindCSS, reducing latency by 42%.</li>
      <li>Implemented responsive UI designs collaborated with product designers, improving mobile usage by 28%.</li>
      <li>Spearheaded unit testing coverage from 45% to 88% using Jest and React Testing Library.</li>
    </ul>
  </div>

  <div class="job">
    <div class="job-title-row">Full Stack Developer — CloudNova Solutions (2019 – 2022)</div>
    <div class="job-sub">Austin, TX</div>
    <ul>
      <li>Developed responsive web portals using React, JavaScript (ES6+), and CSS3 Flexbox/Grid.</li>
      <li>Integrated RESTful APIs and PostgreSQL databases for over 20,000 daily active users.</li>
    </ul>
  </div>

  <h2>Education</h2>
  <p><strong>B.S. in Computer Science</strong>, University of Texas at Austin (2019)</p>
</body>
</html>"""
    },

    # 3. ROHAN MEHTA - 65% Moderate Match (Junior/Mid Web Developer)
    {
        "id": "rohan_mehta",
        "name": "Rohan Mehta",
        "title": "Frontend Web Developer (Junior / Mid)",
        "contact": "rohan.mehta@devmail.com • +91 98450 11223 • Bangalore, India • github.com/rohanmehta-web",
        "html": """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: letter; margin: 20mm; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #27272a; line-height: 1.5; margin: 0; padding: 24px; }
  .name { font-size: 24px; font-weight: bold; color: #ea580c; margin: 0; }
  .sub { font-size: 13px; color: #71717a; margin-top: 4px; }
  .contact { font-size: 11px; color: #a1a1aa; border-bottom: 1px dashed #fdba74; padding-bottom: 8px; margin-bottom: 16px; }
  h2 { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #c2410c; margin: 14px 0 6px 0; border-bottom: 1px solid #fed7aa; padding-bottom: 2px; }
  p { font-size: 12px; color: #3f3f46; margin: 4px 0; }
  ul { margin: 4px 0 8px 18px; padding: 0; font-size: 11.5px; color: #3f3f46; }
  li { margin-bottom: 3px; }
</style>
</head>
<body>
  <div class="name">Rohan Mehta</div>
  <div class="sub">Frontend Web Developer (2.5 Years Experience)</div>
  <div class="contact">Bangalore, India • rohan.mehta@devmail.com • +91 98450 11223 • rohanmehta.tech</div>

  <h2>Career Objective</h2>
  <p>
    Enthusiastic web developer with 2.5 years experience building responsive web pages using HTML5, CSS3, JavaScript, and React. Eager to advance frontend skills in TypeScript and design systems while contributing to scalable customer-facing applications.
  </p>

  <h2>Technical Skills</h2>
  <p><strong>Languages:</strong> JavaScript (ES6), HTML5, CSS3, basic TypeScript</p>
  <p><strong>Frameworks & Tools:</strong> React.js, Bootstrap 5, basic TailwindCSS, Git, NPM, Webpack</p>

  <h2>Experience</h2>
  <div>
    <p><strong>Junior Frontend Developer</strong> | PixelKraft Studios (June 2022 – Present)</p>
    <ul>
      <li>Built 15+ marketing landing pages and responsive client portals using React and CSS3.</li>
      <li>Collaborated with design team to convert basic Figma wireframes into functional web pages.</li>
      <li>Maintained cross-browser compatibility and optimized mobile responsiveness across iOS and Android.</li>
    </ul>
  </div>
  <div>
    <p><strong>Web Development Intern</strong> | Infotech Labs (Jan 2022 – June 2022)</p>
    <ul>
      <li>Assisted senior developers in styling components using Bootstrap and vanilla CSS.</li>
      <li>Resolved UI bugs and improved site accessibility and page load speeds.</li>
    </ul>
  </div>

  <h2>Education</h2>
  <p><strong>Bachelor of Computer Applications (BCA)</strong> — Bangalore University (2022)</p>
</body>
</html>"""
    },

    # 4. SARAH JENKINS - 45% Transferable Match (Product Designer / Figma Lead)
    {
        "id": "sarah_jenkins",
        "name": "Sarah Jenkins",
        "title": "Senior Product & Design Systems Lead",
        "contact": "sarah.jenkins@designstudio.co • +1 (312) 840-5521 • Chicago, IL • dribbble.com/sarahjenkins",
        "html": """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: letter; margin: 20mm; }
  body { font-family: 'Avenir Next', 'Century Gothic', sans-serif; color: #1f2937; line-height: 1.5; margin: 0; padding: 24px; }
  .name { font-size: 26px; font-weight: 300; color: #059669; letter-spacing: 1px; text-transform: uppercase; margin: 0; }
  .title { font-size: 13px; font-weight: 600; color: #4b5563; margin-top: 4px; }
  .contact { font-size: 11px; color: #9ca3af; margin: 6px 0 16px 0; border-bottom: 2px solid #10b981; padding-bottom: 6px; }
  h2 { font-size: 12px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 1px; margin: 16px 0 6px 0; }
  p { font-size: 12px; color: #374151; line-height: 1.6; }
  ul { margin: 4px 0 10px 18px; padding: 0; font-size: 11.5px; color: #374151; }
  li { margin-bottom: 3px; }
  .highlight { background: #ecfdf5; border-left: 3px solid #059669; padding: 8px 12px; font-size: 11.5px; margin: 10px 0; }
</style>
</head>
<body>
  <div class="name">Sarah Jenkins</div>
  <div class="title">Lead Product Designer & UX Strategist</div>
  <div class="contact">Chicago, IL • sarah.jenkins@designstudio.co • +1 (312) 840-5521 • portfolio: sarahjenkins.design</div>

  <h2>Design Philosophy</h2>
  <div class="highlight">
    "Great software is built at the intersection of empathetic user research, scalable design systems, and seamless cross-functional handoffs."
  </div>

  <h2>Profile Summary</h2>
  <p>
    Award-winning Product Designer with 6+ years creating intuitive digital products, enterprise SaaS design systems, and user-centric workflows. Master in Figma, design token specifications, wireframing, and interactive prototyping. Deep familiarity with frontend handoff processes (HTML/CSS conceptual understanding, though non-coder).
  </p>

  <h2>Design Competencies</h2>
  <p><strong>Design & Prototyping:</strong> Figma (Auto-layout, Components, Variants, Variables), FigJam, Principle, Adobe XD</p>
  <p><strong>UX Research:</strong> User Personas, Journey Mapping, Usability Testing, Information Architecture, Heuristic Audits</p>
  <p><strong>Handoff & Systems:</strong> Design Tokens, Zeroheight, Zeplin, Basic HTML/CSS styling principles</p>

  <h2>Experience</h2>
  <div>
    <p><strong>Lead Product Designer</strong> | Nimbus SaaS Group (2021 – Present)</p>
    <ul>
      <li>Built and maintained enterprise Figma design system comprising 300+ components and design tokens.</li>
      <li>Conducted 40+ user research sessions resulting in complete redesign of dashboard navigation.</li>
      <li>Partnered with frontend engineering leads to inspect CSS implementations and ensure 100% design fidelity.</li>
    </ul>
  </div>
  <div>
    <p><strong>Senior UI/UX Designer</strong> | Elevation Digital (2018 – 2021)</p>
    <ul>
      <li>Delivered end-to-end UX wireframes and high-fidelity prototypes for B2B FinTech web applications.</li>
    </ul>
  </div>

  <h2>Education</h2>
  <p><strong>B.F.A. in Graphic & Interactive Design</strong> — Rhode Island School of Design (2018)</p>
</body>
</html>"""
    },

    # 5. DAVID CHEN - 22% Mismatch (Staff DevOps / Cloud Engineer)
    {
        "id": "david_chen",
        "name": "David Chen",
        "title": "Staff DevOps & Cloud Infrastructure Engineer",
        "contact": "david.chen@clouddev.net • +1 (415) 892-3341 • Seattle, WA • github.com/davidchen-ops",
        "html": """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: letter; margin: 20mm; }
  body { font-family: 'Courier New', Courier, monospace; color: #18181b; line-height: 1.4; margin: 0; padding: 24px; }
  .name { font-size: 24px; font-weight: bold; color: #09090b; margin: 0; letter-spacing: -0.5px; }
  .title { font-size: 13px; font-weight: bold; color: #6b21a8; margin-top: 2px; }
  .contact { font-size: 11px; color: #71717a; border-bottom: 2px solid #9333ea; padding-bottom: 6px; margin: 6px 0 14px 0; }
  h2 { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #7e22ce; margin: 14px 0 4px 0; border-bottom: 1px solid #e4e4e7; }
  p { font-size: 11.5px; margin: 4px 0; color: #27272a; }
  ul { margin: 4px 0 8px 18px; padding: 0; font-size: 11px; color: #27272a; }
  li { margin-bottom: 2px; }
</style>
</head>
<body>
  <div class="name">DAVID CHEN</div>
  <div class="title">Staff DevOps & Cloud Infrastructure Engineer</div>
  <div class="contact">Seattle, WA • david.chen@clouddev.net • +1 (415) 892-3341 • linkedin.com/in/davidchen-devops</div>

  <h2>[01] SYSTEM OVERVIEW</h2>
  <p>
    Infrastructure engineer with 7+ years architecting high-availability cloud platforms, Kubernetes orchestration, and GitOps CI/CD automation. Proven record managing AWS multi-region infrastructure handling 100M+ requests daily with 99.99% SLA. Zero frontend, UI, or CSS design expertise.
  </p>

  <h2>[02] TECHNICAL ARCHITECTURE TOOLSET</h2>
  <p><strong>Cloud Platforms:</strong> AWS (EKS, VPC, RDS, S3, IAM), Google Cloud Platform (GCP)</p>
  <p><strong>Infrastructure as Code:</strong> Terraform, Ansible, Pulumi, CloudFormation</p>
  <p><strong>Containers & Orchestration:</strong> Kubernetes, Docker, Helm, Istio Service Mesh</p>
  <p><strong>Observability & CI/CD:</strong> Prometheus, Grafana, Datadog, ArgoCD, GitLab CI</p>

  <h2>[03] PROFESSIONAL EXPERIENCE</h2>
  <div>
    <p><strong>Staff DevOps Engineer</strong> | Apex Cloud Solutions (2021 – Present)</p>
    <ul>
      <li>Architected automated multi-cluster Kubernetes platform supporting 50+ microservices on AWS EKS.</li>
      <li>Cut deployment lead time from 2 hours to 8 minutes via ArgoCD declarative GitOps pipelines.</li>
      <li>Reduced cloud infrastructure spend by 34% ($180K annually) through spot instance automation.</li>
    </ul>
  </div>
  <div>
    <p><strong>DevOps Engineer</strong> | Vanguard Systems (2018 – 2021)</p>
    <ul>
      <li>Maintained Terraform infrastructure modules across 4 AWS regions with 99.99% service uptime.</li>
      <li>Implemented automated container vulnerability scanning in GitHub Actions pipelines.</li>
    </ul>
  </div>

  <h2>[04] EDUCATION & CERTS</h2>
  <p><strong>B.S. in Computer Engineering</strong> — University of Illinois Urbana-Champaign (2018)<br>
  <strong>Certifications:</strong> Certified Kubernetes Administrator (CKA), AWS Solutions Architect Professional</p>
</body>
</html>"""
    },

    # 6. MARCUS VANCE - 10% Low Match (B2B SaaS Sales Director)
    {
        "id": "marcus_vance",
        "name": "Marcus Vance",
        "title": "Enterprise B2B Account Executive & Sales Director",
        "contact": "marcus.vance@enterprisesales.com • +1 (212) 774-9023 • New York, NY • linkedin.com/in/marcusvance-sales",
        "html": """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: letter; margin: 20mm; }
  body { font-family: 'Georgia', serif; color: #1c1917; line-height: 1.5; margin: 0; padding: 24px; }
  .name { font-size: 26px; font-weight: normal; color: #78350f; text-transform: uppercase; letter-spacing: 2px; margin: 0; }
  .title { font-size: 13px; font-weight: bold; color: #44403c; margin-top: 4px; font-family: sans-serif; }
  .contact { font-size: 11px; color: #78716c; border-bottom: 2px solid #b45309; padding-bottom: 6px; margin: 6px 0 14px 0; font-family: sans-serif; }
  h2 { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #92400e; margin: 14px 0 4px 0; border-bottom: 1px solid #fed7aa; font-family: sans-serif; }
  p { font-size: 12px; margin: 4px 0; color: #292524; }
  ul { margin: 4px 0 8px 18px; padding: 0; font-size: 11.5px; color: #292524; }
  li { margin-bottom: 3px; }
</style>
</head>
<body>
  <div class="name">Marcus Vance</div>
  <div class="title">Enterprise B2B Software Account Executive</div>
  <div class="contact">New York, NY • marcus.vance@enterprisesales.com • +1 (212) 774-9023 • linkedin.com/in/marcusvance-sales</div>

  <h2>Executive Biography</h2>
  <p>
    Top-performing Enterprise SaaS Account Executive with 8+ years driving net-new revenue, closing 6-figure ARR contracts, and managing Fortune 500 strategic partnerships. 142% average quota achievement. Non-technical background in enterprise sales, pipeline generation, and customer negotiations.
  </p>

  <h2>Sales Expertise & Methodologies</h2>
  <p><strong>Core Competencies:</strong> Enterprise B2B Sales, MEDDPICC, Challenger Sales, C-Suite Negotiations, Pipeline Management</p>
  <p><strong>Software & CRM:</strong> Salesforce CRM, Outreach.io, Gong, ZoomInfo, LinkedIn Sales Navigator</p>

  <h2>Sales Leadership Experience</h2>
  <div>
    <p><strong>Senior Enterprise Account Executive</strong> | Datasync Global (2021 – Present)</p>
    <ul>
      <li>Generated $2.8M in net-new ARR across financial services and healthcare enterprise accounts.</li>
      <li>Exceeded annual quota at 138% in 2023 and 144% in 2024; named President's Club recipient.</li>
      <li>Led complex multi-stakeholder RFP evaluations, negotiating MSAs with legal and procurement teams.</li>
    </ul>
  </div>
  <div>
    <p><strong>Account Executive</strong> | CloudMetrics SaaS (2018 – 2021)</p>
    <ul>
      <li>Managed 45-client pipeline, consistently sourcing 35% of self-generated pipeline.</li>
    </ul>
  </div>

  <h2>Education</h2>
  <p><strong>B.A. in Business Administration & Marketing</strong> — New York University, Stern School of Business (2018)</p>
</body>
</html>"""
    }
]

# Write HTML files and generate PDF & DOCX
chrome_bin = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

for r in resumes:
    html_file = os.path.join(RESUMES_DIR, f"{r['id']}.html")
    pdf_file = os.path.join(RESUMES_DIR, f"{r['name'].replace(' ', '_')}_Resume.pdf")
    docx_file = os.path.join(RESUMES_DIR, f"{r['name'].replace(' ', '_')}_Resume.docx")

    # 1. Write HTML
    with open(html_file, "w", encoding="utf-8") as f:
        f.write(r["html"])
    print(f"Written HTML: {html_file}")

    # 2. Generate PDF via Chrome Headless
    try:
        abs_html = os.path.abspath(html_file)
        abs_pdf = os.path.abspath(pdf_file)
        cmd = [
            chrome_bin,
            "--headless",
            "--disable-gpu",
            f"--print-to-pdf={abs_pdf}",
            abs_html
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        print(f"Generated PDF: {pdf_file}")
    except Exception as e:
        print(f"Error generating PDF for {r['id']}: {e}")

    # 3. Generate DOCX via textutil
    try:
        cmd = ["textutil", "-convert", "docx", html_file, "-output", docx_file]
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        print(f"Generated DOCX: {docx_file}")
    except Exception as e:
        print(f"Error generating DOCX for {r['id']}: {e}")

print("\nAll 6 unique resumes generated successfully in samples/resumes/!")
