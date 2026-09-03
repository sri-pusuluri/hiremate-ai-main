#!/bin/bash
set -e

mkdir -p samples/resumes

# 1. Alex Mercer (Full Stack Engineer)
cat << 'EOF' > samples/resumes/alex_mercer.html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.5; color: #222; margin: 40px; }
  h1 { margin: 0 0 4px 0; font-size: 26px; color: #111; }
  .contact { font-size: 13px; color: #555; margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 8px; }
  h2 { font-size: 16px; color: #2563eb; text-transform: uppercase; margin: 16px 0 6px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  .job { margin-bottom: 12px; }
  .job-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; }
  .job-title { color: #1e293b; }
  .job-date { color: #64748b; font-size: 12px; }
  .job-company { color: #475569; font-style: italic; font-size: 13px; margin-bottom: 4px; }
  ul { margin: 4px 0 10px 20px; padding: 0; font-size: 13px; }
  li { margin-bottom: 3px; }
  .skills-list { font-size: 13px; }
  .skills-list strong { color: #1e293b; }
</style>
</head>
<body>
  <h1>Alex Mercer</h1>
  <div class="contact">
    Email: alex.mercer@email.dev &bull; Phone: +1 (555) 019-9482 &bull; Location: San Francisco, CA (Remote) &bull; LinkedIn: linkedin.com/in/alexmercer
  </div>

  <h2>Professional Summary</h2>
  <p style="font-size: 13px; margin: 0 0 12px 0;">
    Results-driven Senior Full Stack Engineer with 5+ years of experience architecting high-scale web platforms. Expert in React, TypeScript, Node.js, and PostgreSQL. Passionate about performant UX, generative AI integrations, and developer productivity.
  </p>

  <h2>Technical Skills</h2>
  <div class="skills-list">
    <p><strong>Languages:</strong> TypeScript, JavaScript, Python, SQL, HTML5, CSS3</p>
    <p><strong>Frontend:</strong> React 18, Next.js, Redux Toolkit, Tailwind CSS, Vite, Jest</p>
    <p><strong>Backend:</strong> Node.js, Express, Fastify, RESTful APIs, GraphQL</p>
    <p><strong>Databases & Cloud:</strong> PostgreSQL, Redis, Supabase, AWS (S3, ECS), Docker</p>
  </div>

  <h2>Professional Experience</h2>
  <div class="job">
    <div class="job-header">
      <span class="job-title">Senior Full Stack Engineer</span>
      <span class="job-date">June 2023 - Present</span>
    </div>
    <div class="job-company">TechSolutions Inc. &bull; Remote</div>
    <ul>
      <li>Architected enterprise analytics dashboard with React and TypeScript, boosting load performance by 42%.</li>
      <li>Designed and deployed secure REST APIs handling 3M+ monthly transactions with 99.98% uptime.</li>
      <li>Integrated Supabase real-time subscriptions and optimized PostgreSQL indexing, decreasing query latency by 60ms.</li>
      <li>Mentored 4 junior engineers and instituted automated GitHub Actions testing pipelines.</li>
    </ul>
  </div>

  <div class="job">
    <div class="job-header">
      <span class="job-title">Software Engineer</span>
      <span class="job-date">January 2021 - May 2023</span>
    </div>
    <div class="job-company">CodeLab LLC &bull; Austin, TX</div>
    <ul>
      <li>Built responsive, accessible UI components in React and Tailwind CSS matching design systems.</li>
      <li>Migrated legacy Express services to typed TypeScript microservices.</li>
      <li>Collaborated cross-functionally with Product and Design teams to ship monthly major releases.</li>
    </ul>
  </div>

  <h2>Education</h2>
  <div class="job">
    <div class="job-header">
      <span class="job-title">B.S. in Computer Science</span>
      <span class="job-date">2017 - 2021</span>
    </div>
    <div class="job-company">University of California, Berkeley</div>
  </div>
</body>
</html>
EOF

# 2. Priya Sharma (Product Manager)
cat << 'EOF' > samples/resumes/priya_sharma.html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.5; color: #222; margin: 40px; }
  h1 { margin: 0 0 4px 0; font-size: 26px; color: #111; }
  .contact { font-size: 13px; color: #555; margin-bottom: 20px; border-bottom: 2px solid #059669; padding-bottom: 8px; }
  h2 { font-size: 16px; color: #059669; text-transform: uppercase; margin: 16px 0 6px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  .job { margin-bottom: 12px; }
  .job-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; }
  .job-title { color: #1e293b; }
  .job-date { color: #64748b; font-size: 12px; }
  .job-company { color: #475569; font-style: italic; font-size: 13px; margin-bottom: 4px; }
  ul { margin: 4px 0 10px 20px; padding: 0; font-size: 13px; }
  li { margin-bottom: 3px; }
  .skills-list { font-size: 13px; }
  .skills-list strong { color: #1e293b; }
</style>
</head>
<body>
  <h1>Priya Sharma</h1>
  <div class="contact">
    Email: priya.sharma@talentpool.io &bull; Phone: +91 98450 78219 &bull; Location: Bangalore, India &bull; LinkedIn: linkedin.com/in/priyasharmapm
  </div>

  <h2>Professional Summary</h2>
  <p style="font-size: 13px; margin: 0 0 12px 0;">
    Customer-centric Product Manager with 6+ years driving B2B SaaS and AI platforms from concept to hypergrowth. Proven success delivering intuitive workflow automation tools, scaling ARR from $2M to $9M, and leading Agile cross-functional teams.
  </p>

  <h2>Core Competencies</h2>
  <div class="skills-list">
    <p><strong>Product Management:</strong> Product Strategy, Roadmapping, OKR Planning, User Research, Wireframing</p>
    <p><strong>Methodologies:</strong> Agile/Scrum, Sprint Planning, Data Analytics (Mixpanel, Amplitude), A/B Testing</p>
    <p><strong>Domain Knowledge:</strong> Enterprise ATS, Generative AI Copilots, Recruitment Automation, SaaS Billing</p>
  </div>

  <h2>Professional Experience</h2>
  <div class="job">
    <div class="job-header">
      <span class="job-title">Lead Product Manager - AI & Platform</span>
      <span class="job-date">August 2022 - Present</span>
    </div>
    <div class="job-company">Nexus Cloud Systems &bull; Bangalore, India</div>
    <ul>
      <li>Spearheaded launch of AI-assisted candidate screening, reducing recruiter manual review time by 65%.</li>
      <li>Conducted 50+ customer discovery interviews to define MVP features, driving a 28% increase in activation.</li>
      <li>Partnered with engineering and design to maintain a bi-weekly release cycle across 3 product squads.</li>
    </ul>
  </div>

  <div class="job">
    <div class="job-header">
      <span class="job-title">Senior Product Manager</span>
      <span class="job-date">March 2020 - July 2022</span>
    </div>
    <div class="job-company">Zool Technologies &bull; Bangalore, India</div>
    <ul>
      <li>Led core workflow automation features adopted by 120+ mid-market corporate clients.</li>
      <li>Revamped billing and self-serve onboarding flow, accelerating conversion rates by 22%.</li>
    </ul>
  </div>

  <h2>Education</h2>
  <div class="job">
    <div class="job-header">
      <span class="job-title">Master of Business Administration (MBA) &bull; B.Tech in Computer Engineering</span>
      <span class="job-date">2016 - 2020</span>
    </div>
    <div class="job-company">National Institute of Technology (NIT)</div>
  </div>
</body>
</html>
EOF

# 3. David Chen (DevOps / Cloud Architect)
cat << 'EOF' > samples/resumes/david_chen.html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.5; color: #222; margin: 40px; }
  h1 { margin: 0 0 4px 0; font-size: 26px; color: #111; }
  .contact { font-size: 13px; color: #555; margin-bottom: 20px; border-bottom: 2px solid #7c3aed; padding-bottom: 8px; }
  h2 { font-size: 16px; color: #7c3aed; text-transform: uppercase; margin: 16px 0 6px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  .job { margin-bottom: 12px; }
  .job-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; }
  .job-title { color: #1e293b; }
  .job-date { color: #64748b; font-size: 12px; }
  .job-company { color: #475569; font-style: italic; font-size: 13px; margin-bottom: 4px; }
  ul { margin: 4px 0 10px 20px; padding: 0; font-size: 13px; }
  li { margin-bottom: 3px; }
  .skills-list { font-size: 13px; }
  .skills-list strong { color: #1e293b; }
</style>
</head>
<body>
  <h1>David Chen</h1>
  <div class="contact">
    Email: david.chen@clouddev.net &bull; Phone: +1 (415) 892-3341 &bull; Location: Seattle, WA &bull; LinkedIn: linkedin.com/in/davidchen-devops
  </div>

  <h2>Professional Summary</h2>
  <p style="font-size: 13px; margin: 0 0 12px 0;">
    Senior DevOps & Cloud Architect with 7+ years designing multi-region cloud infrastructure, Kubernetes clusters, and zero-downtime deployment pipelines. AWS Certified Solutions Architect Professional.
  </p>

  <h2>Technical Arsenal</h2>
  <div class="skills-list">
    <p><strong>Cloud Platforms:</strong> AWS (EKS, RDS, S3, CloudFront, Lambda), GCP, Azure</p>
    <p><strong>Infrastructure as Code:</strong> Terraform, Ansible, Pulumi, CloudFormation</p>
    <p><strong>Container & Orchestration:</strong> Kubernetes, Docker, Helm, Istio Service Mesh</p>
    <p><strong>CI/CD & Monitoring:</strong> GitHub Actions, GitLab CI, ArgoCD, Prometheus, Grafana, Datadog</p>
  </div>

  <h2>Professional Experience</h2>
  <div class="job">
    <div class="job-header">
      <span class="job-title">Staff DevOps Engineer</span>
      <span class="job-date">October 2021 - Present</span>
    </div>
    <div class="job-company">Apex Cloud Solutions &bull; Seattle, WA</div>
    <ul>
      <li>Architected automated multi-cluster Kubernetes platform supporting 50+ microservices.</li>
      <li>Implemented GitOps deployment workflows via ArgoCD, cutting deployment lead time from 2 hours to 8 minutes.</li>
      <li>Reduced cloud infrastructure costs by 34% ($180K/yr) through spot instances and auto-scaling policies.</li>
    </ul>
  </div>

  <div class="job">
    <div class="job-header">
      <span class="job-title">DevOps Engineer</span>
      <span class="job-date">June 2018 - September 2021</span>
    </div>
    <div class="job-company">Vanguard Systems &bull; San Jose, CA</div>
    <ul>
      <li>Maintained AWS infrastructure via Terraform modules with 99.99% service availability.</li>
      <li>Standardized security scanning and container vulnerability assessments in CI pipelines.</li>
    </ul>
  </div>
</body>
</html>
EOF

echo "HTML files created. Converting to PDF and DOCX..."

# Convert each HTML file to PDF and DOCX
for person in alex_mercer priya_sharma david_chen; do
  # 1. Generate PDF using Chrome Headless
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    --headless \
    --disable-gpu \
    --print-to-pdf="samples/resumes/${person}.pdf" \
    "samples/resumes/${person}.html"

  # 2. Generate DOCX using macOS textutil
  textutil -convert docx "samples/resumes/${person}.html" -output "samples/resumes/${person}.docx"
done

echo "All PDF and DOCX resumes successfully generated!"
