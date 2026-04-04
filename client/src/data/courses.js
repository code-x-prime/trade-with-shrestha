export const STATIC_COURSES = [
  {
    id: 'course-1',
    title: 'Data Analyst Mastery',
    slug: 'data-analyst-mastery',
    price: 25000,
    salePrice: 19999,
    pricing: {
      effectivePrice: 19999,
      displayOriginalPrice: 25000,
      discountPercent: 20,
      hasFlashSale: true
    },
    description: 'Master data analysis tools like Python, Excel, SQL, and PowerBI. Learn to visualize and interpret complex datasets for business decision making.',
    duration: '4 Months',
    language: 'HINDI',
    isFree: false,
    category: 'Data Science',
    coverImage: '/data-analyst-mastery.png',
    sessions: [
      {
        id: 's1',
        title: 'Introduction to Data Analysis',
        order: 1,
        chapters: [
          { id: 'c1', title: 'What is Data Analysis?', order: 1, isFreePreview: true },
          { id: 'c2', title: 'Data Lifecycle', order: 2 }
        ]
      },
      {
        id: 's2',
        title: 'Excel for Analytics',
        order: 2,
        chapters: [
          { id: 'c3', title: 'Advanced Formulas', order: 1 },
          { id: 'c4', title: 'Pivot Tables', order: 2 }
        ]
      }
    ],
    benefits: [
      'Hands-on Projects',
      'Placement Assistance',
      'Industry Expert Mentors',
      'Certificate of Completion'
    ]
  },
  {
    id: 'course-2',
    title: 'Full Stack Data Science',
    slug: 'full-stack-data-science',
    price: 50000,
    salePrice: 42000,
    pricing: {
      effectivePrice: 42000,
      displayOriginalPrice: 50000,
      discountPercent: 16,
      hasFlashSale: false
    },
    description: 'A comprehensive program covering end-to-end data science. From data engineering and machine learning to deploying models in production.',
    duration: '6 Months',
    language: 'MIXED',
    isFree: false,
    category: 'Data Science',
    coverImage: '/full-stack data-science.png',
    sessions: [
      {
        id: 's1',
        title: 'Python for Data Science',
        order: 1,
        chapters: [
          { id: 'c1', title: 'Python Basics', order: 1, isFreePreview: true },
          { id: 'c2', title: 'Pandas & Numpy', order: 2 }
        ]
      },
      {
        id: 's2',
        title: 'Machine Learning Algorithms',
        order: 2,
        chapters: [
          { id: 'c3', title: 'Linear Regression', order: 1 },
          { id: 'c4', title: 'Random Forests', order: 2 }
        ]
      }
    ],
    benefits: [
      'End-to-End Model Deployment',
      '1:1 Mentorship',
      'Resume Workshop',
      'Live Backend Integration'
    ]
  },
  {
    id: 'course-3',
    title: 'Python Data Structures & Algorithms (DSA)',
    slug: 'python-dsa-mastery',
    price: 15000,
    salePrice: 12500,
    pricing: {
      effectivePrice: 12500,
      displayOriginalPrice: 15000,
      discountPercent: 17,
      hasFlashSale: false
    },
    description: 'The ultimate guide to cracking technical interviews. Learn all core DSA concepts using Python with 200+ solved problems.',
    duration: '3 Months',
    language: 'HINDI',
    isFree: false,
    category: 'Programming',
    coverImage: '/python-data-structures.png',
    sessions: [
      {
        id: 's1',
        title: 'Basic DSA Concepts',
        order: 1,
        chapters: [
          { id: 'c1', title: 'Big O Notation', order: 1, isFreePreview: true },
          { id: 'c2', title: 'Array and Lists', order: 2 }
        ]
      },
      {
        id: 's2',
        title: 'Advanced Recursion',
        order: 2,
        chapters: [
          { id: 'c3', title: 'Backtracking', order: 1 },
          { id: 'c4', title: 'Dynamic Programming Basics', order: 2 }
        ]
      }
    ],
    benefits: [
      'Interview Preparation',
      'Problem Solving Strategies',
      'Lifetime Access',
      'Code Walkthroughs'
    ]
  },
  {
    id: 'course-4',
    title: 'Agentic AI Engineering',
    slug: 'agentic-ai-engineering',
    price: 35000,
    salePrice: 29999,
    pricing: {
      effectivePrice: 29999,
      displayOriginalPrice: 35000,
      discountPercent: 14,
      hasFlashSale: true
    },
    description: 'Build futuristic autonomous agents. Learn to use frameworks like LangChain, AutoGPT, and CrewAI to create complex AI workflows.',
    duration: '4 Months',
    language: 'ENGLISH',
    isFree: false,
    category: 'Artificial Intelligence',
    coverImage: '/agentic-ai-engineering.png',
    sessions: [
      {
        id: 's1',
        title: 'Foundations of Agentic AI',
        order: 1,
        chapters: [
          { id: 'c1', title: 'What are AI Agents?', order: 1, isFreePreview: true },
          { id: 'c2', title: 'LLM Reasoning Chains', order: 2 }
        ]
      },
      {
        id: 's2',
        title: 'Building Multi-Agent Systems',
        order: 2,
        chapters: [
          { id: 'c3', title: 'CrewAI Framework', order: 1 },
          { id: 'c4', title: 'Tool Integration', order: 2 }
        ]
      }
    ],
    benefits: [
      'Advanced AI Projects',
      'Access to GPU Clusters',
      'Community Slack Access',
      'Early access to LLM papers'
    ]
  }
];
