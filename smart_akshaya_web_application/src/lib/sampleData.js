export const SAMPLE_RESUME = {
  templateId: 'modern-sidebar',
  theme: {
    primaryColor: '#0f766e',
    secondaryColor: '#1e293b',
    textColor: '#1f2937',
    backgroundColor: '#ffffff',
    fontFamily: 'Inter',
    fontSize: 'medium',
    spacing: 'normal',
    sectionVisibility: {
      summary: true,
      work: true,
      education: true,
      skills: true,
      projects: true,
      certifications: true,
      references: true
    }
  },
  basics: {
    name: 'Olivia Wilson',
    label: 'Senior Full-Stack Developer',
    email: 'olivia.wilson@email.com',
    phone: '+1 (555) 019-2834',
    url: 'https://github.com/oliviawilson',
    location: 'Austin, TX',
    summary: 'Detail-oriented Senior Full-Stack Engineer with 6+ years of experience designing and implementing scalable cloud architectures. Passionate about building performant user experiences and optimizing backend databases.',
    image: ''
  },
  work: [
    {
      id: 'w1',
      company: 'CloudStream Systems',
      position: 'Senior Engineer',
      startDate: '2022-03',
      endDate: '',
      current: true,
      summary: 'Architected serverless API infrastructure handling 12M+ daily requests, improving response times by 35%. Mentored 4 junior developers and established CI/CD automation pipelines.'
    },
    {
      id: 'w2',
      company: 'PixelForge Studio',
      position: 'Software Developer',
      startDate: '2020-01',
      endDate: '2022-02',
      current: false,
      summary: 'Developed modern React applications utilizing context state and Tailwind CSS, reducing bundle sizes by 20%. Integrated payment processing gateways and third-party dashboard APIs.'
    }
  ],
  education: [
    {
      id: 'e1',
      institution: 'University of Texas at Austin',
      studyType: 'B.S.',
      area: 'Computer Science',
      startDate: '2016-09',
      endDate: '2020-05'
    }
  ],
  skills: [
    {
      id: 's1',
      name: 'Languages',
      keywords: ['JavaScript', 'TypeScript', 'Node.js', 'Python', 'SQL']
    },
    {
      id: 's2',
      name: 'Frontend Frameworks',
      keywords: ['React', 'Next.js', 'Vite', 'Redux', 'Tailwind CSS']
    }
  ],
  projects: [
    {
      id: 'p1',
      name: 'Distributed Task Queue',
      description: 'Built a lightweight redis-backed job runner supporting scheduling, delays, and crash recovery.',
      url: 'https://github.com/olivia/task-queue',
      keywords: ['Node.js', 'Redis', 'TypeScript']
    }
  ],
  certifications: [
    {
      id: 'c1',
      name: 'AWS Certified Developer Associate',
      issuer: 'Amazon Web Services',
      date: '2023-08'
    }
  ],
  references: [
    {
      id: 'ref1',
      name: 'Harumi Kobayashi',
      company: 'Salford & Co.',
      position: 'CEO',
      phone: '123-456-7890',
      email: 'hello@reallygreatsite.com'
    },
    {
      id: 'ref2',
      name: 'Bailey Dupont',
      company: 'Arowwai Industries',
      position: 'CEO',
      phone: '123-456-7890',
      email: 'hello@reallygreatsite.com'
    }
  ]
};
