import os

def create_simple_pdf(filename, title, contact, summary, skills, experience, education):
    # Standard minimal valid PDF 1.4 with standard Helvetica font
    text_lines = []
    text_lines.append(f"{title}")
    text_lines.append(f"{contact}")
    text_lines.append("")
    text_lines.append("PROFESSIONAL SUMMARY")
    text_lines.append(f"{summary}")
    text_lines.append("")
    text_lines.append("TECHNICAL SKILLS")
    for s in skills:
        text_lines.append(f"• {s}")
    text_lines.append("")
    text_lines.append("PROFESSIONAL EXPERIENCE")
    for exp in experience:
        text_lines.append(f"{exp['role']} | {exp['company']} ({exp['dates']})")
        for bullet in exp['bullets']:
            text_lines.append(f"  - {bullet}")
        text_lines.append("")
    text_lines.append("EDUCATION")
    text_lines.append(f"{education}")

    # Build stream
    stream_content = "BT\n"
    stream_content += "/F1 18 Tf\n"
    stream_content += "50 750 Td\n"
    stream_content += f"({title}) Tj\n"
    stream_content += "/F2 9 Tf\n"
    stream_content += "0 -16 Td\n"
    stream_content += f"({contact}) Tj\n"
    stream_content += "0 -16 Td\n"

    # Line separator
    y_pos = 710
    stream_content += "ET\n"
    stream_content += "q 0.15 0.39 0.92 rg 50 714 512 2 re f Q\n"
    stream_content += "BT\n"
    stream_content += "50 695 Td\n"

    # Summary
    stream_content += "/F1 12 Tf\n"
    stream_content += "(PROFESSIONAL SUMMARY) Tj\n"
    stream_content += "/F2 10 Tf\n"
    stream_content += "0 -14 Td\n"

    # Wrap summary
    words = summary.split()
    line = ""
    for w in words:
        if len(line + " " + w) > 90:
            stream_content += f"({line.strip()}) Tj\n"
            stream_content += "0 -12 Td\n"
            line = w
        else:
            line += " " + w
    if line:
        stream_content += f"({line.strip()}) Tj\n"
        stream_content += "0 -16 Td\n"

    # Skills
    stream_content += "/F1 12 Tf\n"
    stream_content += "(CORE COMPETENCIES & SKILLS) Tj\n"
    stream_content += "/F2 9.5 Tf\n"
    stream_content += "0 -14 Td\n"
    for s in skills:
        safe_s = s.replace("(", "[").replace(")", "]")
        stream_content += f"({safe_s}) Tj\n"
        stream_content += "0 -12 Td\n"
    stream_content += "0 -6 Td\n"

    # Experience
    stream_content += "/F1 12 Tf\n"
    stream_content += "(EXPERIENCE) Tj\n"
    stream_content += "0 -14 Td\n"
    for exp in experience:
        stream_content += "/F1 10 Tf\n"
        stream_content += f"({exp['role']} - {exp['company']}) Tj\n"
        stream_content += "/F3 9 Tf\n"
        stream_content += f" ( {exp['dates']} ) Tj\n"
        stream_content += "/F2 9 Tf\n"
        stream_content += "0 -12 Td\n"
        for b in exp['bullets']:
            safe_b = b.replace("(", "[").replace(")", "]")
            stream_content += f"(   * {safe_b[:95]}) Tj\n"
            stream_content += "0 -11 Td\n"
        stream_content += "0 -4 Td\n"

    # Education
    stream_content += "0 -4 Td\n"
    stream_content += "/F1 12 Tf\n"
    stream_content += "(EDUCATION) Tj\n"
    stream_content += "/F2 9.5 Tf\n"
    stream_content += "0 -14 Td\n"
    stream_content += f"({education}) Tj\n"

    stream_content += "ET\n"

    stream_bytes = stream_content.encode('latin1')
    stream_len = len(stream_bytes)

    pdf = bytearray()
    pdf.extend(b"%PDF-1.4\n")
    offsets = []

    # Object 1: Catalog
    offsets.append(len(pdf))
    pdf.extend(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")

    # Object 2: Pages
    offsets.append(len(pdf))
    pdf.extend(b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")

    # Object 3: Page
    offsets.append(len(pdf))
    pdf.extend(b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> >> >>\nendobj\n")

    # Object 4: Contents
    offsets.append(len(pdf))
    pdf.extend(f"4 0 obj\n<< /Length {stream_len} >>\nstream\n".encode('ascii'))
    pdf.extend(stream_bytes)
    pdf.extend(b"\nendstream\nendobj\n")

    # Object 5: Font Bold
    offsets.append(len(pdf))
    pdf.extend(b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n")

    # Object 6: Font Regular
    offsets.append(len(pdf))
    pdf.extend(b"6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")

    # Object 7: Font Oblique
    offsets.append(len(pdf))
    pdf.extend(b"7 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>\nendobj\n")

    # Xref
    xref_offset = len(pdf)
    pdf.extend(f"xref\n0 8\n0000000000 65535 f \n".encode('ascii'))
    for off in offsets:
        pdf.extend(f"{off:010d} 00000 n \n".encode('ascii'))

    pdf.extend(f"trailer\n<< /Size 8 /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode('ascii'))

    with open(filename, 'wb') as f:
        f.write(pdf)
    print(f"Created {filename} ({len(pdf)} bytes)")

os.makedirs("samples/resumes", exist_ok=True)

# 1. Alex Mercer
create_simple_pdf(
    "samples/resumes/Alex_Mercer_Resume.pdf",
    "Alex Mercer",
    "Email: alex.mercer@email.dev | Phone: +1 555-019-9482 | LinkedIn: linkedin.com/in/alexmercer | Remote",
    "Results-driven Senior Full Stack Engineer with 5+ years of experience architecting high-scale web platforms. Expert in React, TypeScript, Node.js, and PostgreSQL. Passionate about performant UX, generative AI integrations, and developer productivity.",
    [
        "Frontend: React 18, Next.js, Redux Toolkit, Tailwind CSS, TypeScript, Vite",
        "Backend: Node.js, Express, Fastify, REST APIs, GraphQL, Python",
        "Database & Cloud: PostgreSQL, Supabase, Redis, AWS [S3, ECS], Docker, CI/CD"
    ],
    [
        {
            "role": "Senior Full Stack Engineer",
            "company": "TechSolutions Inc. [Remote]",
            "dates": "2023 - Present",
            "bullets": [
                "Architected enterprise analytics dashboard in React/TypeScript, improving load speed by 42%.",
                "Built secure payment APIs handling $4M+ transactions with 99.98% reliability.",
                "Optimized PostgreSQL query indexes, reducing latency across core tables by 60ms."
            ]
        },
        {
            "role": "Software Engineer",
            "company": "CodeLab LLC [Austin, TX]",
            "dates": "2021 - 2023",
            "bullets": [
                "Engineered responsive components in React and Tailwind matching Figma design system.",
                "Migrated legacy Express services to fully typed TypeScript microservices."
            ]
        }
    ],
    "B.S. in Computer Science - University of California, Berkeley [2017 - 2021]"
)

# 2. Priya Sharma
create_simple_pdf(
    "samples/resumes/Priya_Sharma_Resume.pdf",
    "Priya Sharma",
    "Email: priya.sharma@talentpool.io | Phone: +91 98450 78219 | LinkedIn: linkedin.com/in/priyasharmapm | Bangalore",
    "Customer-centric Product Manager with 6+ years driving B2B SaaS and AI platforms from concept to hypergrowth. Proven success delivering intuitive workflow automation tools, scaling ARR from $2M to $9M, and leading Agile cross-functional teams.",
    [
        "Product Strategy: Roadmapping, OKR Planning, Customer Discovery, Wireframing",
        "Analytics & Growth: Mixpanel, Amplitude, SQL, A/B Testing, Feature Adoption Tracking",
        "Domain Expertise: Enterprise ATS, Generative AI Copilots, Recruitment Workflows, SaaS Billing"
    ],
    [
        {
            "role": "Lead Product Manager - AI & Platform",
            "company": "Nexus Cloud Systems [Bangalore]",
            "dates": "2022 - Present",
            "bullets": [
                "Spearheaded launch of AI-assisted candidate screening, cutting recruiter review time by 65%.",
                "Conducted 50+ discovery interviews to shape MVP specifications, boosting activation by 28%.",
                "Orchestrated bi-weekly agile releases across 3 product engineering squads."
            ]
        },
        {
            "role": "Senior Product Manager",
            "company": "Zool Technologies [Bangalore]",
            "dates": "2020 - 2022",
            "bullets": [
                "Led core workflow automation features adopted by 120+ corporate client accounts.",
                "Redesigned self-serve onboarding flow, lifting trial-to-paid conversion by 22%."
            ]
        }
    ],
    "MBA [IIM Bangalore] & B.Tech in Computer Engineering [NIT Trichy]"
)

# 3. David Chen
create_simple_pdf(
    "samples/resumes/David_Chen_Resume.pdf",
    "David Chen",
    "Email: david.chen@clouddev.net | Phone: +1 415-892-3341 | LinkedIn: linkedin.com/in/davidchen-devops | Seattle, WA",
    "Senior DevOps & Cloud Architect with 7+ years designing multi-region cloud infrastructure, Kubernetes clusters, and zero-downtime deployment pipelines. AWS Certified Solutions Architect Professional.",
    [
        "Cloud & Infrastructure: AWS [EKS, RDS, S3, CloudFront], GCP, Terraform, Ansible, Pulumi",
        "Containers & Orchestration: Kubernetes, Docker, Helm, Istio Service Mesh",
        "CI/CD & Observability: GitHub Actions, ArgoCD, Prometheus, Grafana, Datadog"
    ],
    [
        {
            "role": "Staff DevOps Engineer",
            "company": "Apex Cloud Solutions [Seattle, WA]",
            "dates": "2021 - Present",
            "bullets": [
                "Architected multi-cluster Kubernetes platform supporting 60+ production microservices.",
                "Implemented GitOps deployment workflows via ArgoCD, cutting deployment time to 8 mins.",
                "Reduced AWS compute spend by 34% [$180K/year] using automated spot instance groups."
            ]
        },
        {
            "role": "DevOps Engineer",
            "company": "Vanguard Systems [San Jose, CA]",
            "dates": "2018 - 2021",
            "bullets": [
                "Maintained high-availability AWS infrastructure with Terraform, achieving 99.99% uptime.",
                "Standardized automated container security scanning in CI/CD pipeline."
            ]
        }
    ],
    "B.S. in Electrical & Computer Engineering - University of Washington [2014 - 2018]"
)
