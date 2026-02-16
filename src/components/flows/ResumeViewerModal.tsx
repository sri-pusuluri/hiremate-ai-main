import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Candidate } from '@/types/hiresort';
import { FileText, Download, ExternalLink, User, Briefcase, MapPin, Calendar, GraduationCap, Award, Code } from 'lucide-react';

interface ResumeViewerModalProps {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock resume content for demonstration
const mockResumeContent = {
  summary: "Experienced software developer with a passion for building scalable web applications. Strong background in frontend technologies with a focus on React and TypeScript. Proven track record of leading cross-functional teams and delivering high-impact projects.",
  education: [
    { degree: "B.Tech in Computer Science", institution: "IIT Bangalore", year: "2018" },
    { degree: "High School", institution: "DAV Public School", year: "2014" }
  ],
  experience: [
    {
      role: "Senior Frontend Developer",
      company: "Current Company",
      duration: "2021 - Present",
      highlights: [
        "Led the development of a React-based dashboard serving 50K+ daily users",
        "Reduced page load time by 40% through code splitting and lazy loading",
        "Mentored 4 junior developers and established frontend best practices"
      ]
    },
    {
      role: "Frontend Developer",
      company: "Previous Company",
      duration: "2018 - 2021",
      highlights: [
        "Built reusable component library used across 5 products",
        "Implemented real-time collaboration features using WebSockets",
        "Collaborated with design team to create responsive mobile-first designs"
      ]
    }
  ],
  skills: {
    technical: ["React", "TypeScript", "JavaScript", "Node.js", "HTML/CSS", "GraphQL", "Redux", "Jest"],
    soft: ["Team Leadership", "Agile/Scrum", "Code Review", "Technical Documentation"]
  },
  certifications: [
    "AWS Certified Developer - Associate",
    "Meta Frontend Developer Professional Certificate"
  ]
};

export function ResumeViewerModal({ candidate, open, onOpenChange }: ResumeViewerModalProps) {
  if (!candidate) return null;

  const handleDownloadResume = () => {
    // Generate resume content as text (in production, this would fetch the actual PDF)
    const resumeContent = `
${'='.repeat(60)}
RESUME - ${candidate.name.toUpperCase()}
${'='.repeat(60)}

CONTACT INFORMATION
-------------------
Name: ${candidate.name}
Email: ${candidate.email}
Location: ${candidate.location}
Experience: ${candidate.experience} years

CURRENT POSITION
----------------
${candidate.currentRole} at ${candidate.company}

PROFESSIONAL SUMMARY
--------------------
${mockResumeContent.summary}

WORK EXPERIENCE
---------------
${mockResumeContent.experience.map(exp => `
${exp.role}
${exp.company} | ${exp.duration}
${exp.highlights.map(h => `  • ${h}`).join('\n')}
`).join('\n')}

EDUCATION
---------
${mockResumeContent.education.map(edu => `${edu.degree} - ${edu.institution} (${edu.year})`).join('\n')}

TECHNICAL SKILLS
----------------
${mockResumeContent.skills.technical.join(', ')}

SOFT SKILLS
-----------
${mockResumeContent.skills.soft.join(', ')}

CERTIFICATIONS
--------------
${mockResumeContent.certifications.join('\n')}

${'='.repeat(60)}
    `.trim();

    // Create and download the file as text
    const blob = new Blob([resumeContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${candidate.name.replace(/\s+/g, '-').toLowerCase()}-resume.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-semibold text-primary">
                  {candidate.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">{candidate.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">{candidate.currentRole} at {candidate.company}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => window.open(candidate.resumeUrl, '_blank')}>
                <ExternalLink className="w-4 h-4" />
                Open
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadResume}>
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          {/* Contact & Quick Info */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4" />
              {candidate.experience} years experience
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {candidate.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Applied {candidate.appliedDate}
            </span>
          </div>

          {/* Summary */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Professional Summary
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 p-4 rounded-lg">
              {mockResumeContent.summary}
            </p>
          </section>

          {/* Experience */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              Work Experience
            </h3>
            <div className="space-y-4">
              {mockResumeContent.experience.map((exp, idx) => (
                <div key={idx} className="border-l-2 border-primary/30 pl-4">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-foreground">{exp.role}</h4>
                    <span className="text-xs text-muted-foreground">{exp.duration}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{exp.company}</p>
                  <ul className="space-y-1">
                    {exp.highlights.map((highlight, hIdx) => (
                      <li key={hIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1.5">•</span>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Skills */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Code className="w-4 h-4 text-primary" />
              Skills
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Technical Skills</p>
                <div className="flex flex-wrap gap-2">
                  {mockResumeContent.skills.technical.map((skill) => (
                    <span 
                      key={skill}
                      className={`px-2 py-1 text-xs rounded-md ${
                        candidate.matchedSkills?.includes(skill)
                          ? 'bg-success-muted text-success border border-success/20'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {skill}
                      {candidate.matchedSkills?.includes(skill) && ' ✓'}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Soft Skills</p>
                <div className="flex flex-wrap gap-2">
                  {mockResumeContent.skills.soft.map((skill) => (
                    <span key={skill} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Education */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              Education
            </h3>
            <div className="space-y-2">
              {mockResumeContent.education.map((edu, idx) => (
                <div key={idx} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground text-sm">{edu.degree}</p>
                    <p className="text-xs text-muted-foreground">{edu.institution}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{edu.year}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Certifications */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              Certifications
            </h3>
            <div className="flex flex-wrap gap-2">
              {mockResumeContent.certifications.map((cert) => (
                <span key={cert} className="px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-full">
                  {cert}
                </span>
              ))}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
