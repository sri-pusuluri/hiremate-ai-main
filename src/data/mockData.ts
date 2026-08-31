import { Candidate, Job } from '@/types/hiresort';

export const mockJobs: Job[] = [
  {
    id: 'job-1',
    title: 'Senior Frontend Engineer',
    department: 'Engineering',
    location: 'Bangalore, India',
    type: 'full-time',
    postedDate: '2024-01-08',
    screeningEndDate: '2024-02-15',
    status: 'active',
    candidateCount: 847,
    hireSortEnabled: false,
    description: `We are looking for a Senior Frontend Engineer to join our core product engineering team at a pivotal stage of growth. In this role, you will own the architecture and delivery of mission-critical, customer-facing web applications used by thousands of recruiters and hiring managers globally.

You will work in a cross-functional product squad alongside senior designers, backend engineers, and product managers — contributing not just code, but technical direction. This is a high-impact role where your decisions shape user experiences at scale.

We value engineers who care deeply about performance, accessibility, and developer experience. If you've led major frontend migrations, championed component systems, or driven adoption of testing culture, you'll thrive here.

Our stack: React 18, TypeScript, Vite, TailwindCSS, React Query, Supabase, and Vercel. We move fast, ship weekly, and invest heavily in code quality and developer tooling.`,
    responsibilities: [
      'Lead the development of complex React-based web applications',
      'Architect scalable frontend solutions and establish best practices',
      'Mentor junior developers and conduct code reviews',
      'Collaborate with UX designers to implement pixel-perfect designs',
      'Optimize application performance and ensure accessibility standards',
      'Participate in technical planning and sprint ceremonies',
    ],
    requirements: [
      '5+ years of experience in frontend development',
      'Expert knowledge of React, TypeScript, and modern JavaScript',
      'Experience with state management (Redux, Zustand, or similar)',
      'Strong understanding of CSS, responsive design, and design systems',
      'Experience with testing frameworks (Jest, React Testing Library)',
      'Excellent communication and collaboration skills',
    ],
    niceToHave: [
      'Experience with Next.js or similar SSR frameworks',
      'Knowledge of Node.js and backend development',
      'Contributions to open-source projects',
      'Experience in a high-growth startup environment',
    ],
    salary: '₹35-50 LPA',
    predictiveEffectiveness: {
      score: 42,
      strengths: ['Clear responsibilities', 'Standard formatting'],
      weaknesses: ['Vague salary range', 'Generic requirements', 'Biased language potential'],
      suggestions: [
        'Specify tech stack versions (e.g., React 18)',
        'Use more inclusive language for "ninja" or "rockstar" terms',
        'Narrow down salary range for better targeting'
      ]
    }
  },
  {
    id: 'job-2',
    title: 'Product Manager',
    department: 'Product',
    location: 'Singapore',
    type: 'full-time',
    postedDate: '2024-01-05',
    screeningEndDate: '2024-02-01',
    status: 'active',
    candidateCount: 234,
    hireSortEnabled: true,
    aiProcessingStatus: 'complete',
    lastRankedAt: '2024-01-10',
    description: `We are seeking a driven and strategic Product Manager to take ownership of our core hiring intelligence platform. This role sits at the intersection of AI innovation, recruiter workflows, and enterprise SaaS — and requires someone equally comfortable in a data deep-dive as they are in a customer discovery call.

You will lead the end-to-end lifecycle of product features — from shaping the opportunity and writing detailed PRDs to working alongside engineers in sprint planning and measuring launch success through analytics. You'll have a direct line to the CEO and significant influence over our 12-month roadmap.

This is not an execution-only PM role. We expect you to challenge assumptions, bring data-backed perspectives to leadership, and advocate fiercely for the users you serve — enterprise HR teams, talent acquisition leads, and recruiting coordinators.

Our product philosophy: build fewer things better. We use Notion for specs, Linear for sprint tracking, Mixpanel for analytics, and Figma for design collaboration. Prior experience in HR-tech, recruitment automation, or B2B SaaS will give you a strong head start.`,
    responsibilities: [
      'Define product roadmap and prioritize features based on business impact',
      'Conduct user research and translate insights into product requirements',
      'Work closely with engineering and design teams to deliver features',
      'Analyze product metrics and iterate based on data-driven insights',
      'Communicate product strategy to stakeholders across the organization',
      'Manage the full product lifecycle from ideation to launch',
    ],
    requirements: [
      '4+ years of product management experience in tech companies',
      'Strong analytical skills with experience in data-driven decision making',
      'Excellent written and verbal communication skills',
      'Experience with agile development methodologies',
      'Track record of shipping successful products',
      'Technical background or ability to work closely with engineers',
    ],
    niceToHave: [
      'MBA or equivalent advanced degree',
      'Experience with B2B SaaS products',
      'Background in fintech or HR-tech',
      'Experience with Southeast Asian markets',
    ],
    salary: 'SGD 120-180K',
    predictiveEffectiveness: {
      score: 88,
      strengths: ['Strong inclusive language', 'Clear impact description', 'Well-structured requirements'],
      weaknesses: ['Could be more specific on tools used'],
      suggestions: [
        'Mention specific PM tools (Jira, Linear, Mixpanel)',
        'Highlight remote working policy details'
      ]
    }
  },
  {
    id: 'job-3',
    title: 'UX Designer',
    department: 'Design',
    location: 'Remote',
    type: 'full-time',
    postedDate: '2024-01-02',
    screeningEndDate: '2024-01-31',
    status: 'active',
    candidateCount: 156,
    hireSortEnabled: true,
    aiProcessingStatus: 'processing',
    aiProcessingProgress: 67,
    description: `We are hiring a UX Designer who is passionate about designing enterprise tools that genuinely make people's working lives better. You will be the primary design voice for our recruitment intelligence platform — shaping experiences that help thousands of talent teams find, evaluate, and hire more effectively.

This is a full-cycle design role. You will conduct discovery research to surface real recruiter pain points, facilitate design sprints, produce wireframes and interactive Figma prototypes, and see designs through to shipped product. You'll partner closely with our PM and engineering leads, and have full creative ownership of your problem space.

As a growing team, your influence will extend beyond screens — you'll help evolve our design system, contribute to our brand language, and set the standard for accessibility across all products. We believe in design that's inclusive by default, not by afterthought.

We use Figma for everything — from low-fidelity sketches to handoff-ready specs. Familiarity with Storybook for component documentation and basic HTML/CSS for design-engineering collaboration is a strong advantage. Remote-first culture with async-friendly rituals and quarterly in-person offsites.`,
    responsibilities: [
      'Conduct user research and usability testing',
      'Create wireframes, prototypes, and high-fidelity designs',
      'Develop and maintain our design system',
      'Collaborate with product managers and engineers',
      'Advocate for user needs and accessibility standards',
      'Present design decisions to stakeholders',
    ],
    requirements: [
      '3+ years of UX/Product design experience',
      'Strong portfolio demonstrating user-centered design process',
      'Proficiency in Figma and prototyping tools',
      'Experience with design systems and component libraries',
      'Understanding of accessibility guidelines (WCAG)',
      'Ability to work independently in a remote environment',
    ],
    niceToHave: [
      'Experience with motion design and micro-interactions',
      'Knowledge of HTML/CSS for design handoff',
      'Experience with B2B or enterprise software',
      'Background in HR-tech or recruitment platforms',
    ],
    salary: '$90-130K USD',
    predictiveEffectiveness: {
      score: 92,
      strengths: ['Excellent role clarity', 'Strong emphasis on accessibility', 'Competitive salary range'],
      weaknesses: [],
      suggestions: [
        'Add information about design team structure',
        'Include link to design handbook if public'
      ]
    }
  },
];

// Helper function to generate predictive insights for candidates
const getPredictiveInsights = (aiScore: 'high' | 'medium' | 'low') => {
  if (aiScore === 'high') {
    return {
      interviewPassProb: Math.floor(Math.random() * (95 - 75) + 75),
      offerAcceptanceProb: Math.floor(Math.random() * (90 - 60) + 60),
      onboardingSuccessProb: Math.floor(Math.random() * (98 - 85) + 85),
      retentionRisk: 'low' as const,
      retentionRiskFactor: 'Strong cultural fit & career progression alignment.',
      timeToJoinEstimate: '2-3 weeks',
      assessment: "**Strong Contender**: This candidate shows exceptional alignment with the core requirements, particularly in technical skills and industry experience.\n\n**Key Factors**:\n• **High Skills Match**: The 90%+ match in React and TypeScript significantly boosts interview pass probability.\n• **Stable Career History**: A consistent track record suggests high retention potential.\n• **Cultural Alignment**: Previous experience in similar high-paced environments indicates a smooth onboarding process.",
      resumeFormat: Math.random() > 0.5 ? 'AI Generated' : 'Human Written' as const,
    };
  } else if (aiScore === 'medium') {
    return {
      interviewPassProb: Math.floor(Math.random() * (70 - 40) + 40),
      offerAcceptanceProb: Math.floor(Math.random() * (80 - 50) + 50),
      onboardingSuccessProb: Math.floor(Math.random() * (85 - 70) + 70),
      retentionRisk: 'medium' as const,
      retentionRiskFactor: 'Salary expectations slightly above band.',
      timeToJoinEstimate: '1 month',
      assessment: "**Moderate Potential**: The candidate meets the baseline requirements but may need support in specific areas.\n\n**Key Factors**:\n• **Skill Gaps**: Missing experience in some nice-to-have areas lowers the immediate interview pass probability.\n• **Salary Expectations**: Slightly above standard bands, which may impact offer acceptance.\n• **Growth Potential**: Strong foundational skills suggest good long-term potential despite initial ramp-up needs.",
      resumeFormat: Math.random() > 0.5 ? 'AI Generated' : 'Human Written' as const,
    };
  } else {
    return {
      interviewPassProb: Math.floor(Math.random() * (30 - 10) + 10),
      offerAcceptanceProb: Math.floor(Math.random() * (50 - 20) + 20),
      onboardingSuccessProb: Math.floor(Math.random() * (60 - 40) + 40),
      retentionRisk: 'high' as const,
      retentionRiskFactor: 'High turnover history in previous roles.',
      timeToJoinEstimate: 'Unknown',
      assessment: "**Challenging Fit**: Significant misalignment with the role's core requirements.\n\n**Key Factors**:\n• **Experience Mismatch**: Lack of required senior-level experience is the primary driver for low interview probability.\n• **Retention Concerns**: Frequent job changes in the past 2 years flag a high retention risk.\n• **Skill Variance**: Core technical stack does not fully align with our current infrastructure.",
      resumeFormat: Math.random() > 0.5 ? 'AI Generated' : 'Human Written' as const,
    };
  }
};

// Helper function to generate unique candidates
const firstNames = [
  'Priya', 'Rahul', 'Aisha', 'Karthik', 'Sneha', 'Vikram', 'Meera', 'Arjun', 'Deepa', 'Suresh',
  'Kavitha', 'Anita', 'Rajesh', 'Pooja', 'Amit', 'Divya', 'Sanjay', 'Nisha', 'Ravi', 'Anjali',
  'Varun', 'Shruti', 'Nikhil', 'Swati', 'Pranav', 'Megha', 'Rohit', 'Pallavi', 'Arun', 'Neha',
  'Ashwin', 'Rekha', 'Vishal', 'Kavya', 'Manoj', 'Tanya', 'Gaurav', 'Simran', 'Akash', 'Isha',
  'Kunal', 'Bhavna', 'Vivek', 'Ritika', 'Sahil', 'Kriti', 'Tushar', 'Sonali', 'Harsh', 'Jyoti',
  'Sachin', 'Manisha', 'Yash', 'Preeti', 'Mohit', 'Archana', 'Abhishek', 'Rashmi', 'Siddharth', 'Komal',
  'Rohan', 'Ananya', 'Dhruv', 'Sakshi', 'Tarun', 'Garima', 'Aman', 'Shweta', 'Nakul', 'Aditi',
  'Karan', 'Namrata', 'Ajay', 'Prachi', 'Sameer', 'Tanvi', 'Vinay', 'Richa', 'Aditya', 'Nikita',
  'Rajat', 'Shreya', 'Dev', 'Ankita', 'Chirag', 'Sonal', 'Pankaj', 'Madhuri', 'Ishaan', 'Payal',
];

const lastNames = [
  'Sharma', 'Patel', 'Singh', 'Reddy', 'Nair', 'Menon', 'Gupta', 'Kumar', 'Verma', 'Iyer',
  'Krishnan', 'Kapoor', 'Mehta', 'Joshi', 'Desai', 'Rao', 'Pillai', 'Choudhary', 'Banerjee', 'Das',
  'Bhatt', 'Chakraborty', 'Mishra', 'Saxena', 'Aggarwal', 'Thakur', 'Sinha', 'Malhotra', 'Khanna', 'Bose',
  'Sen', 'Mukherjee', 'Ghosh', 'Roy', 'Dutta', 'Chatterjee', 'Pandey', 'Tiwari', 'Yadav', 'Shukla',
  'Kulkarni', 'Patil', 'Deshpande', 'Jain', 'Shah', 'Agarwal', 'Bhat', 'Hegde', 'Shetty', 'Kamath',
  'Naidu', 'Rajan', 'Subramaniam', 'Venkatesh', 'Natarajan', 'Raghavan', 'Sundaram', 'Mohan', 'Prasad', 'Swamy',
];

const companies = [
  'Google', 'Microsoft', 'Amazon', 'Flipkart', 'Swiggy', 'Zomato', 'Razorpay', 'Paytm', 'PhonePe', 'CRED',
  'Zerodha', 'Groww', 'Byju\'s', 'Unacademy', 'Ola', 'Uber', 'Myntra', 'Nykaa', 'Meesho', 'Dunzo',
  'Dream11', 'MPL', 'ShareChat', 'Lenskart', 'CarDekho', 'PolicyBazaar', 'Freshworks', 'Zoho', 'Postman', 'BrowserStack',
  'Infosys', 'TCS', 'Wipro', 'HCL', 'Tech Mahindra', 'Cognizant', 'Accenture', 'Capgemini', 'Deloitte', 'PwC',
  'Adobe', 'Salesforce', 'SAP', 'Oracle', 'IBM', 'Intel', 'NVIDIA', 'Qualcomm', 'Samsung', 'LG',
  'Atlassian', 'Spotify', 'Netflix', 'LinkedIn', 'Twitter', 'Meta', 'Stripe', 'Twilio', 'Slack', 'Notion',
];

const roles = [
  'Frontend Developer', 'Senior Frontend Developer', 'Lead Frontend Developer', 'Frontend Engineer',
  'Software Engineer', 'Senior Software Engineer', 'Staff Engineer', 'Full Stack Developer',
  'React Developer', 'Senior React Developer', 'UI Developer', 'UI Engineer', 'Web Developer',
  'JavaScript Developer', 'TypeScript Developer', 'Frontend Architect', 'Product Manager',
  'Senior Product Manager', 'Technical Product Manager', 'UX Designer', 'Senior UX Designer',
  'UI/UX Designer', 'Product Designer', 'Design Lead', 'Engineering Manager',
];

const locations = [
  'Bangalore', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad',
  'Jaipur', 'Kochi', 'Gurugram', 'Noida', 'Chandigarh', 'Indore', 'Lucknow', 'Remote',
];

const skillSets = [
  ['React', 'TypeScript', 'Node.js', 'Redux', 'GraphQL'],
  ['React', 'JavaScript', 'CSS', 'Tailwind', 'Jest'],
  ['Vue.js', 'TypeScript', 'Vuex', 'CSS', 'Webpack'],
  ['Angular', 'TypeScript', 'RxJS', 'NgRx', 'Jasmine'],
  ['React', 'Next.js', 'TypeScript', 'PostgreSQL', 'Prisma'],
  ['JavaScript', 'HTML', 'CSS', 'jQuery', 'Bootstrap'],
  ['React', 'TypeScript', 'AWS', 'Docker', 'Kubernetes'],
  ['React', 'Redux', 'Sass', 'Webpack', 'Babel'],
  ['React', 'TypeScript', 'Testing Library', 'Cypress', 'Storybook'],
  ['React', 'MobX', 'TypeScript', 'REST APIs', 'Figma'],
];

const jobIds = ['job-1', 'job-2', 'job-3'];

// Helper function to generate rich AI explanation based on candidate data
function generateAIExplanation(
  name: string,
  company: string,
  role: string,
  experience: number,
  aiScore: 'high' | 'medium' | 'low',
  matchedSkills: string[],
  missingSkills: string[],
  expDiff: number
): string {
  const firstName = name.split(' ')[0];
  const keySkills = matchedSkills.slice(0, 3).join(', ');
  const primarySkill = matchedSkills[0] || 'frontend development';

  // Experience insight
  let expInsight: string;
  if (expDiff >= 3) {
    expInsight = `With ${experience} years of experience, ${firstName} significantly exceeds the 5-year requirement, bringing deep technical maturity.`;
  } else if (expDiff >= 1) {
    expInsight = `${firstName}'s ${experience} years of experience exceeds requirements, indicating solid professional growth.`;
  } else if (expDiff === 0) {
    expInsight = `${firstName} meets the experience requirement precisely with ${experience} years in the field.`;
  } else if (expDiff === -1) {
    expInsight = `At ${experience} years experience, ${firstName} is just shy of the 5-year requirement but shows strong trajectory.`;
  } else {
    expInsight = `${firstName} has ${experience} years experience, ${Math.abs(expDiff)} years below requirement, which may need consideration.`;
  }

  // Skills insight
  let skillsInsight: string;
  if (missingSkills.length === 0) {
    skillsInsight = `Technical profile shows complete alignment with job requirements across ${keySkills}.`;
  } else if (missingSkills.length <= 2) {
    skillsInsight = `Strong skills in ${keySkills}, with minor gaps in ${missingSkills.join(' and ')} that could be addressed through onboarding.`;
  } else {
    skillsInsight = `Core competency in ${primarySkill}, but notable gaps in ${missingSkills.slice(0, 2).join(', ')} may require development investment.`;
  }

  // Company/role insight
  let companyInsight: string;
  const topTierCompanies = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Stripe', 'Atlassian', 'Salesforce', 'Adobe'];
  const scaleUpCompanies = ['Flipkart', 'Swiggy', 'Zomato', 'Razorpay', 'Paytm', 'PhonePe', 'CRED', 'Zerodha', 'Groww', 'Dream11'];

  if (topTierCompanies.includes(company)) {
    companyInsight = `Background at ${company} indicates exposure to world-class engineering practices and scale.`;
  } else if (scaleUpCompanies.includes(company)) {
    companyInsight = `Experience at ${company} suggests familiarity with high-growth environments and rapid iteration.`;
  } else {
    companyInsight = `Current role at ${company} provides relevant industry experience.`;
  }

  // Leadership insight for senior roles
  let leadershipInsight = '';
  if (role.toLowerCase().includes('lead') || role.toLowerCase().includes('senior') || role.toLowerCase().includes('staff')) {
    leadershipInsight = ` ${firstName}'s ${role} position suggests mentorship capabilities and technical decision-making experience.`;
  }

  // Final recommendation
  let recommendation: string;
  if (aiScore === 'high') {
    recommendation = 'Strongly recommended for interview based on comprehensive skill-experience alignment.';
  } else if (aiScore === 'medium') {
    recommendation = 'Worth considering for interview with focus on assessing transferable skills and growth potential.';
  } else {
    recommendation = 'May require additional screening to evaluate readiness for senior role expectations.';
  }

  return `${expInsight} ${skillsInsight} ${companyInsight}${leadershipInsight} ${recommendation}`;
}

function generateUniqueCandidate(index: number, source: 'applied' | 'talent-pool', totalCount: number): Candidate {
  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[Math.floor(index / firstNames.length) % lastNames.length];
  const suffix = Math.floor(index / (firstNames.length * lastNames.length));
  const uniqueName = suffix > 0 ? `${firstName} ${lastName} ${suffix}` : `${firstName} ${lastName}`;

  const company = companies[index % companies.length];
  const role = roles[index % roles.length];
  const location = locations[index % locations.length];
  const skills = skillSets[index % skillSets.length];

  // Required experience for Senior Frontend Engineer is 5+ years
  const requiredExperience = 5;

  // Calculate experience based on rank position
  // Top candidates have 5+ years, lower ranked have less
  const percentile = index / totalCount;
  let experience: number;
  let cosineSimilarity: number;

  if (percentile < 0.20) {
    // Top 20% - High experience (6-12 years) and high score (80-95%)
    experience = 6 + Math.floor((1 - percentile / 0.20) * 6); // 6-12 years
    cosineSimilarity = 0.95 - (percentile / 0.20) * 0.15; // 0.95 to 0.80
  } else if (percentile < 0.60) {
    // Next 40% - Medium experience (4-6 years) and medium score (50-79%)
    experience = 4 + Math.floor((1 - (percentile - 0.20) / 0.40) * 2); // 4-6 years
    cosineSimilarity = 0.79 - ((percentile - 0.20) / 0.40) * 0.29; // 0.79 to 0.50
  } else {
    // Bottom 40% - Low experience (1-4 years) and low score (30-49%)
    experience = 1 + Math.floor((1 - (percentile - 0.60) / 0.40) * 3); // 1-4 years
    cosineSimilarity = 0.49 - ((percentile - 0.60) / 0.40) * 0.19; // 0.49 to 0.30
  }

  // Round to 2 decimal places
  cosineSimilarity = Math.round(cosineSimilarity * 100) / 100;

  const aiScore: 'high' | 'medium' | 'low' = cosineSimilarity >= 0.8 ? 'high' : cosineSimilarity >= 0.5 ? 'medium' : 'low';

  const baseDate = new Date('2024-01-01');
  baseDate.setDate(baseDate.getDate() + (index % 30));
  const appliedDate = baseDate.toISOString().split('T')[0];

  const lastUpdatedDate = new Date();
  lastUpdatedDate.setDate(lastUpdatedDate.getDate() - (index % 60));
  const lastUpdated = lastUpdatedDate.toISOString().split('T')[0];

  // Calculate experience alignment text
  const expDiff = experience - requiredExperience;
  let experienceAlignment: string;
  if (expDiff >= 2) {
    experienceAlignment = `Exceeds requirement by ${expDiff} years`;
  } else if (expDiff >= 0) {
    experienceAlignment = 'Meets experience requirement';
  } else {
    experienceAlignment = `${Math.abs(expDiff)} year${Math.abs(expDiff) > 1 ? 's' : ''} below requirement`;
  }

  const matchedSkills = aiScore === 'high' ? skills : aiScore === 'medium' ? skills.slice(0, 3) : skills.slice(0, 2);
  const missingSkills = aiScore === 'high' ? [] : aiScore === 'medium' ? skills.slice(-1) : skills.slice(-2);




  return {
    id: source === 'applied' ? `c-${index + 1}` : `tp-${index + 1}`,
    name: uniqueName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${suffix > 0 ? suffix : ''}@email.com`,
    currentRole: role,
    company: company,
    experience: experience,
    location: location,
    appliedDate: source === 'applied' ? appliedDate : '',
    jobId: source === 'applied' ? jobIds[index % jobIds.length] : undefined,
    resumeUrl: `https://example.com/resumes/${firstName.toLowerCase()}-${lastName.toLowerCase()}.pdf`,
    lastUpdated: lastUpdated,
    source: source,
    aiRank: index + 1,
    aiScore: aiScore,
    cosineSimilarity: cosineSimilarity,
    matchedSkills: matchedSkills,
    missingSkills: missingSkills,
    experienceAlignment: experienceAlignment,
    aiExplanation: generateAIExplanation(uniqueName, company, role, experience, aiScore, matchedSkills, missingSkills, expDiff),
    isPinned: index < 3 && source === 'applied',
    predictiveInsights: getPredictiveInsights(aiScore),
  };
}

// Generate 847 unique applied candidates with proper rank-score correlation
const appliedCandidates: Candidate[] = Array.from({ length: 847 }, (_, i) =>
  generateUniqueCandidate(i, 'applied', 847)
);

// Generate 6 unique talent pool candidates with proper ranks
const talentPoolCandidates: Candidate[] = [
  {
    id: 'tp-1',
    name: 'Priyanka Mehta',
    email: 'priyanka.m@email.com',
    currentRole: 'Frontend Tech Lead',
    company: 'Atlassian',
    experience: 8,
    location: 'Pune',
    appliedDate: '',
    resumeUrl: 'https://example.com/resumes/priyanka-mehta.pdf',
    lastUpdated: '2026-01-08',
    source: 'talent-pool',
    aiRank: 1,
    aiScore: 'high',
    cosineSimilarity: 0.93,
    matchedSkills: ['React', 'TypeScript', 'System Design', 'Team Leadership', 'Mentoring'],
    missingSkills: [],
    experienceAlignment: 'Excellent leadership experience with tier-1 company',
    aiExplanation: 'With 8 years of experience, Priyanka significantly exceeds the 5-year requirement, bringing deep technical maturity. Technical profile shows complete alignment with job requirements across React, TypeScript, and System Design. Background at Atlassian indicates exposure to world-class engineering practices and scale. Priyanka\'s Frontend Tech Lead position suggests mentorship capabilities and technical decision-making experience. Strongly recommended for interview based on comprehensive skill-experience alignment.',
    predictiveInsights: getPredictiveInsights('high'),
  },
  {
    id: 'tp-2',
    name: 'Deepak Sharma',
    email: 'deepak.sharma@email.com',
    currentRole: 'Lead Frontend Developer',
    company: 'Amazon',
    experience: 7,
    location: 'Bangalore',
    appliedDate: '',
    resumeUrl: 'https://example.com/resumes/deepak-sharma.pdf',
    lastUpdated: '2026-01-15',
    source: 'talent-pool',
    aiRank: 2,
    aiScore: 'high',
    cosineSimilarity: 0.91,
    matchedSkills: ['React', 'TypeScript', 'AWS', 'Team Leadership', 'Performance Optimization'],
    missingSkills: [],
    experienceAlignment: 'Excellent match with leadership experience',
    aiExplanation: 'Deepak\'s 7 years of experience exceeds requirements, indicating solid professional growth. Technical profile shows complete alignment with job requirements across React, TypeScript, and AWS. Background at Amazon indicates exposure to world-class engineering practices and scale. Deepak\'s Lead Frontend Developer position suggests mentorship capabilities and technical decision-making experience. Strongly recommended for interview based on comprehensive skill-experience alignment.',
    predictiveInsights: getPredictiveInsights('high'),
  },
  {
    id: 'tp-3',
    name: 'Rajesh Gupta',
    email: 'rajesh.g@email.com',
    currentRole: 'Senior React Developer',
    company: 'Infosys',
    experience: 6,
    location: 'Bangalore',
    appliedDate: '',
    resumeUrl: 'https://example.com/resumes/rajesh-gupta.pdf',
    lastUpdated: '2026-01-12',
    source: 'talent-pool',
    aiRank: 3,
    aiScore: 'high',
    cosineSimilarity: 0.88,
    matchedSkills: ['React', 'TypeScript', 'Redux', 'Jest', 'Node.js'],
    missingSkills: [],
    experienceAlignment: 'Strong match with modern frontend stack',
    aiExplanation: 'Rajesh\'s 6 years of experience exceeds requirements, indicating solid professional growth. Technical profile shows complete alignment with job requirements across React, TypeScript, and Redux. Current role at Infosys provides relevant industry experience. Rajesh\'s Senior React Developer position suggests mentorship capabilities and technical decision-making experience. Strongly recommended for interview based on comprehensive skill-experience alignment.',
    predictiveInsights: getPredictiveInsights('high'),
  },
  {
    id: 'tp-4',
    name: 'Kavitha Rajan',
    email: 'kavitha.r@email.com',
    currentRole: 'Senior Software Engineer',
    company: 'Microsoft',
    experience: 5,
    location: 'Hyderabad',
    appliedDate: '',
    resumeUrl: 'https://example.com/resumes/kavitha-rajan.pdf',
    lastUpdated: '2026-01-10',
    source: 'talent-pool',
    aiRank: 4,
    aiScore: 'high',
    cosineSimilarity: 0.85,
    matchedSkills: ['TypeScript', 'React', 'Node.js', 'System Design'],
    missingSkills: ['Team Leadership'],
    experienceAlignment: 'Meets 5 year requirement with tier-1 company background',
    aiExplanation: 'Kavitha meets the experience requirement precisely with 5 years in the field. Strong skills in TypeScript, React, and Node.js, with minor gaps in Team Leadership that could be addressed through onboarding. Background at Microsoft indicates exposure to world-class engineering practices and scale. Kavitha\'s Senior Software Engineer position suggests mentorship capabilities and technical decision-making experience. Strongly recommended for interview based on comprehensive skill-experience alignment.',
    predictiveInsights: getPredictiveInsights('high'),
  },
  {
    id: 'tp-5',
    name: 'Suresh Iyer',
    email: 'suresh.iyer@email.com',
    currentRole: 'Frontend Developer',
    company: 'Wipro',
    experience: 4,
    location: 'Chennai',
    appliedDate: '',
    resumeUrl: 'https://example.com/resumes/suresh-iyer.pdf',
    lastUpdated: '2026-01-05',
    source: 'talent-pool',
    aiRank: 5,
    aiScore: 'medium',
    cosineSimilarity: 0.68,
    matchedSkills: ['React', 'JavaScript', 'CSS'],
    missingSkills: ['TypeScript', 'Node.js'],
    experienceAlignment: '1 year below 5 year requirement',
    aiExplanation: 'At 4 years experience, Suresh is just shy of the 5-year requirement but shows strong trajectory. Strong skills in React, JavaScript, and CSS, with minor gaps in TypeScript and Node.js that could be addressed through onboarding. Current role at Wipro provides relevant industry experience. Worth considering for interview with focus on assessing transferable skills and growth potential.',
    predictiveInsights: getPredictiveInsights('medium'),
  },
  {
    id: 'tp-6',
    name: 'Anita Kumari',
    email: 'anita.k@email.com',
    currentRole: 'UI Engineer',
    company: 'Cognizant',
    experience: 3,
    location: 'Pune',
    appliedDate: '',
    resumeUrl: 'https://example.com/resumes/anita-kumari.pdf',
    lastUpdated: '2025-12-20',
    source: 'talent-pool',
    aiRank: 6,
    aiScore: 'medium',
    cosineSimilarity: 0.62,
    matchedSkills: ['JavaScript', 'HTML', 'CSS', 'React Basics'],
    missingSkills: ['TypeScript', 'Advanced React'],
    experienceAlignment: '2 years below 5 year requirement',
    aiExplanation: 'Anita has 3 years experience, 2 years below requirement, which may need consideration. Core competency in JavaScript, but notable gaps in TypeScript and Advanced React may require development investment. Current role at Cognizant provides relevant industry experience. Worth considering for interview with focus on assessing transferable skills and growth potential.',
    predictiveInsights: getPredictiveInsights('medium'),
  },
];

export const mockCandidates: Candidate[] = [...appliedCandidates, ...talentPoolCandidates];

export const generateProcessingCandidates = (count: number): Partial<Candidate>[] => {
  const names = [
    'Ananya Desai', 'Rohit Joshi', 'Divya Pillai', 'Sanjay Gupta',
    'Nisha Verma', 'Amit Choudhary', 'Pooja Mehta', 'Ravi Kumar'
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `pending-${i}`,
    name: names[i % names.length],
    currentRole: 'Processing...',
    company: '—',
    appliedDate: '2024-01-10',
  }));
};
