export interface ScreeningQuestion {
  id: string;
  category?: 'logistics' | 'compensation' | 'technical' | 'experience' | 'culture';
  categoryLabel?: string;
  text: string;
  type: 'text' | 'textarea' | 'date' | 'url' | 'choice' | 'boolean';
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

export const QUESTION_CATEGORIES = [
  { id: 'all', label: 'All Questions' },
  { id: 'logistics', label: 'Availability & Logistics' },
  { id: 'compensation', label: 'Compensation' },
  { id: 'technical', label: 'Technical & Portfolio' },
  { id: 'culture', label: 'Culture & Motivation' },
] as const;

export const SYSTEM_QUESTION_LIBRARY: ScreeningQuestion[] = [
  // Availability & Logistics
  {
    id: 'lib-notice-period',
    category: 'logistics',
    categoryLabel: 'Availability & Logistics',
    text: 'What is your current notice period?',
    type: 'choice',
    options: ['Immediate (0 - 15 days)', '30 Days', '60 Days', '90 Days']
  },
  {
    id: 'lib-earliest-joining',
    category: 'logistics',
    categoryLabel: 'Availability & Logistics',
    text: 'What is your earliest possible joining date?',
    type: 'date',
    placeholder: 'Select your earliest start date'
  },
  {
    id: 'lib-hybrid-onsite',
    category: 'logistics',
    categoryLabel: 'Availability & Logistics',
    text: 'Are you comfortable working in a hybrid or on-site office setting if required?',
    type: 'boolean'
  },
  {
    id: 'lib-visa-sponsorship',
    category: 'logistics',
    categoryLabel: 'Availability & Logistics',
    text: 'Do you require visa sponsorship or work authorization assistance in this location?',
    type: 'boolean'
  },

  // Compensation
  {
    id: 'lib-expected-ctc',
    category: 'compensation',
    categoryLabel: 'Compensation',
    text: 'What is your expected annual compensation (CTC / Salary)?',
    type: 'text',
    placeholder: 'e.g. ₹25 LPA or $120,000/yr'
  },
  {
    id: 'lib-current-ctc',
    category: 'compensation',
    categoryLabel: 'Compensation',
    text: 'What is your current annual base compensation?',
    type: 'text',
    placeholder: 'e.g. ₹20 LPA or $100,000/yr'
  },

  // Technical & Portfolio
  {
    id: 'lib-portfolio-url',
    category: 'technical',
    categoryLabel: 'Technical & Portfolio',
    text: 'Please share a link to your GitHub, portfolio, or live product project.',
    type: 'url',
    placeholder: 'https://github.com/yourhandle or https://yourportfolio.com'
  },
  {
    id: 'lib-tech-stack-exp',
    category: 'technical',
    categoryLabel: 'Technical & Portfolio',
    text: 'How many years of relevant hands-on experience do you have with the core tech stack?',
    type: 'choice',
    options: ['1 - 2 years', '3 - 5 years', '6 - 8 years', '8+ years']
  },
  {
    id: 'lib-challenging-project',
    category: 'technical',
    categoryLabel: 'Technical & Portfolio',
    text: 'Describe a challenging architectural or complex problem you personally delivered.',
    type: 'textarea',
    placeholder: 'Detail the engineering challenge, technical trade-offs, and resulting impact...'
  },

  // Culture & Motivation
  {
    id: 'lib-why-join',
    category: 'culture',
    categoryLabel: 'Culture & Motivation',
    text: 'Why are you interested in this role and joining our mission?',
    type: 'textarea',
    placeholder: 'Share what aligns you with our culture, product, and mission...'
  },
  {
    id: 'lib-timezone-collab',
    category: 'culture',
    categoryLabel: 'Culture & Motivation',
    text: 'Are you comfortable collaborating with distributed teammates across different timezones?',
    type: 'boolean'
  }
];
