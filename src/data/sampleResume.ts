import type { ResumeData } from '../types/resume';

export const sampleResume: ResumeData = {
  personalInfo: {
    name: 'Alex Chen',
    title: 'Software Engineer',
    email: 'alex.chen@email.com',
    phone: '(415) 555-0192',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/alexchen',
    website: 'alexchen.dev',
  },
  summary:
    'Software engineer with 4 years of experience building web applications. Worked across the full stack with React, Node.js and Python. Interested in improving user-facing products and writing maintainable code.',
  experience: [
    {
      id: 'exp-1',
      company: 'Meridian Labs',
      title: 'Software Engineer',
      location: 'San Francisco, CA',
      startDate: 'Jun 2022',
      endDate: 'Present',
      bullets: [
        {
          id: 'exp-1-b1',
          text: 'Built and maintained React components for the core dashboard used by 15,000+ monthly active users.',
        },
        {
          id: 'exp-1-b2',
          text: 'Reduced API response time by 38% by introducing Redis caching and query optimization in the Node.js backend.',
        },
        {
          id: 'exp-1-b3',
          text: 'Collaborated with design team to implement a new design system, improving component consistency across 6 product areas.',
        },
        {
          id: 'exp-1-b4',
          text: 'Wrote unit and integration tests using Jest and React Testing Library, raising code coverage from 52% to 81%.',
        },
        {
          id: 'exp-1-b5',
          text: 'Participated in on-call rotation and resolved production incidents, maintaining 99.7% uptime over 12 months.',
        },
      ],
    },
    {
      id: 'exp-2',
      company: 'Tangent Digital',
      title: 'Junior Frontend Developer',
      location: 'Remote',
      startDate: 'Aug 2020',
      endDate: 'May 2022',
      bullets: [
        {
          id: 'exp-2-b1',
          text: 'Developed responsive marketing pages and landing pages using React and Tailwind CSS for 8 client projects.',
        },
        {
          id: 'exp-2-b2',
          text: 'Integrated third-party APIs including Stripe, Twilio and Salesforce for e-commerce and CRM features.',
        },
        {
          id: 'exp-2-b3',
          text: 'Migrated legacy jQuery codebase to React, reducing bundle size by 22% and improving Lighthouse score from 61 to 88.',
        },
      ],
    },
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'OpenFlow',
      description: 'Open-source workflow automation tool for small teams.',
      technologies: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
      startDate: 'Jan 2023',
      endDate: 'Present',
      bullets: [
        {
          id: 'proj-1-b1',
          text: 'Built a drag-and-drop workflow editor with undo/redo using React and a custom state machine.',
        },
        {
          id: 'proj-1-b2',
          text: '340+ GitHub stars; used by 50+ teams for internal automation.',
        },
      ],
    },
    {
      id: 'proj-2',
      name: 'Budgetly',
      description: 'Personal finance tracker with AI-powered categorization.',
      technologies: ['Next.js', 'Prisma', 'OpenAI API'],
      startDate: 'Mar 2023',
      endDate: 'Aug 2023',
      bullets: [
        {
          id: 'proj-2-b1',
          text: 'Used OpenAI API to automatically categorize and tag 95% of transactions with minimal user input.',
        },
      ],
    },
  ],
  education: [
    {
      id: 'edu-1',
      institution: 'University of California, Davis',
      degree: 'B.S.',
      field: 'Computer Science',
      location: 'Davis, CA',
      startDate: 'Sep 2016',
      endDate: 'Jun 2020',
      gpa: '3.7',
    },
  ],
  skills: [
    {
      id: 'skill-1',
      category: 'Frontend',
      skills: ['React', 'TypeScript', 'JavaScript', 'HTML/CSS', 'Tailwind CSS', 'Next.js'],
    },
    {
      id: 'skill-2',
      category: 'Backend',
      skills: ['Node.js', 'Python', 'PostgreSQL', 'Redis', 'REST APIs', 'GraphQL'],
    },
    {
      id: 'skill-3',
      category: 'Tools & Practices',
      skills: ['Git', 'Docker', 'Jest', 'CI/CD', 'Agile', 'Figma'],
    },
  ],
  languages: [
    { id: 'lang-1', name: 'English', proficiency: 'Native' },
    { id: 'lang-2', name: 'Mandarin', proficiency: 'Professional working proficiency' },
  ],
};
