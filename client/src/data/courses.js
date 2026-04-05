export const STATIC_COURSES = [
  {
    id: 'course-1',
    title: 'Data Analyst Course',
    slug: 'data-analyst-course',
    price: 25000,
    salePrice: 25000,
    pricing: {
      effectivePrice: 25000,
      displayOriginalPrice: 25000,
      discountPercent: 0,
      hasFlashSale: false
    },
    description: 'Master Microsoft Excel (Basics to Advanced), MySQL, Power BI, Python for Data Analysis, and ChatGPT & AI Basics. Includes 10+ Data Analytics Projects.',
    duration: '3 Months',
    language: 'HINDI',
    isFree: false,
    category: 'Data Analytics',
    coverImage: '/data-analyst-mastery.png',
    benefits: [
      '10+ Real Industry Projects',
      'Hands-on training with AI tools',
      'From Basics to Advanced concepts',
      'Expert mentorship & support'
    ],
    curriculumText: `
      <div class="space-y-6">
        <div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">📊 Microsoft Excel (Basics to Advanced)</h3>
          <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 list-disc pl-5 text-gray-600 dark:text-gray-400">
            <li><b>Foundations:</b> Interface, shortcuts, formatting</li>
            <li><b>Functions:</b> SUMIFS, VLOOKUP, INDEX-MATCH</li>
            <li><b>Logic:</b> IF/AND/OR, Nested IFS, IFERROR</li>
            <li><b>Analysis:</b> Pivot tables, calculated fields</li>
            <li><b>Data Handling:</b> Cleaning, Power Query, Merge/Append</li>
            <li><b>Dashboards:</b> Slicers, Timeline, Dynamic Charts</li>
          </ul>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🗄️ MySQL Database Management</h3>
          <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 list-disc pl-5 text-gray-600 dark:text-gray-400">
            <li><b>Basics:</b> RDBMS, Normalization, SQL commands</li>
            <li><b>Advanced:</b> Inner/Left/Right/Cross Joins</li>
            <li><b>Control:</b> Stored Procedures, Views, Triggers</li>
            <li><b>Analytics:</b> RANK, DENSE_RANK, Window functions</li>
          </ul>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">📈 Power BI Visualization</h3>
          <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 list-disc pl-5 text-gray-600 dark:text-gray-400">
            <li><b>ETL:</b> Loading data from multiple sources</li>
            <li><b>Modeling:</b> Relationships, Calculated Columns</li>
            <li><b>DAX:</b> Time Intelligence, Custom Measures</li>
            <li><b>Reporting:</b> AI visuals, publish to Power BI Service</li>
          </ul>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🐍 Python for Data Analysis</h3>
          <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 list-disc pl-5 text-gray-600 dark:text-gray-400">
            <li><b>Pandas:</b> Dataframes, merging, grouping, cleaning</li>
            <li><b>NumPy:</b> Arrays, mathematical operations</li>
            <li><b>Viz:</b> Matplotlib & Seaborn visualizations</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: 'course-2',
    title: 'Full Stack Data Science with Agentic AI and Generative AI',
    slug: 'full-stack-data-science-agentic-ai',
    price: 50000,
    salePrice: 50000,
    pricing: {
      effectivePrice: 50000,
      displayOriginalPrice: 50000,
      discountPercent: 0,
      hasFlashSale: false
    },
    description: 'Master Python, Statistics, Machine Learning, Deep Learning, NLP, Generative AI (LLMs, RAG), and Advanced Agentic AI Frameworks.',
    duration: '6 Months',
    language: 'MIXED',
    isFree: false,
    category: 'Data Science',
    coverImage: '/full-stack data-science.png',
    benefits: [
      'End-to-End Data Science Life Cycle',
      'Advanced Agentic AI Frameworks (LangGraph, CrewAI)',
      'Large Language Models & RAG Systems',
      'Real-world Industry Case Studies'
    ],
    curriculumText: `
      <div class="space-y-6">
        <div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧠 Machine Learning & Statistics</h3>
          <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 list-disc pl-5 text-gray-600 dark:text-gray-400">
            <li><b>Stats:</b> Descriptive & inferential statistics</li>
            <li><b>Models:</b> Linear/Logistic regression, Random Forest</li>
            <li><b>Ops:</b> CI/CD for ML, MLflow, Model Monitoring</li>
            <li><b>Big Data:</b> PySpark SQL, Spark processing</li>
          </ul>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🤖 Generative AI & Prompting</h3>
          <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 list-disc pl-5 text-gray-600 dark:text-gray-400">
            <li><b>Transformers:</b> BERT, GPT, T5 architectural deep-dive</li>
            <li><b>Prompting:</b> Chain-of-thought, Self-consistency</li>
            <li><b>RAG Systems:</b> ChromaDB, Pinecone, Hybrid Search</li>
            <li><b>LLM APIs:</b> OpenAI, Anthropic, Gemini integration</li>
          </ul>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚡ Agentic AI Engineering</h3>
          <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 list-disc pl-5 text-gray-600 dark:text-gray-400">
            <li><b>LangGraph:</b> State management & human-in-the-loop</li>
            <li><b>Orchestration:</b> CrewAI, AutoGen, Phidata agents</li>
            <li><b>No-Code:</b> Automating with n8n & low-code tools</li>
            <li><b>Evaluation:</b> Langfuse tracing & AgentOps performance</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: 'course-3',
    title: 'Python and Data Structure Track Course',
    slug: 'python-data-structure-track',
    price: 15000,
    salePrice: 15000,
    pricing: {
      effectivePrice: 15000,
      displayOriginalPrice: 15000,
      discountPercent: 0,
      hasFlashSale: false
    },
    description: 'Learn Python programming from scratch including Control Flow, OOPs, Exception Handling, Data Analytics (NumPy, Pandas), and 10+ industry projects.',
    duration: '45 Days',
    language: 'HINDI',
    isFree: false,
    category: 'Programming',
    coverImage: '/python-data-structures.png',
    benefits: [
      '10+ Real industry Projects',
      'Comprehensive Python Fundamentals',
      'Data Structures & Algorithms concepts',
      'Hands-on Excel & Data integration'
    ],
    curriculumText: `
      <div class="space-y-6">
        <div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🚀 Python Programming Fundamentals</h3>
          <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 list-disc pl-5 text-gray-600 dark:text-gray-400">
            <li><b>Tokens:</b> Identifiers, literals, operators</li>
            <li><b>Control Flow:</b> if-else, match-case, loops</li>
            <li><b>Functions:</b> Recursion, Lambda, Scope rules</li>
            <li><b>OOPs:</b> Classes, Encapsulation, Polymorphism</li>
          </ul>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">📁 Advanced Python & Handling</h3>
          <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 list-disc pl-5 text-gray-600 dark:text-gray-400">
            <li><b>File Ops:</b> Reading/Writing Excel, PDF, CSV</li>
            <li><b>RegEx:</b> Pattern matching, sub, search</li>
            <li><b>GUI:</b> Building interfaces with Tkinter</li>
            <li><b>Data Analytics:</b> Pandas, NumPy integration</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: 'course-4',
    title: 'Full Stack Agentic AI Engineering Course',
    slug: 'full-stack-agentic-ai-engineering',
    price: 35000,
    salePrice: 35000,
    pricing: {
      effectivePrice: 35000,
      displayOriginalPrice: 35000,
      discountPercent: 0,
      hasFlashSale: false
    },
    description: 'Specialized course on building AI Agents, Agentic RAG, GraphRAG (Neo4j), MCP, and No-Code/Low-Code Agentic workflows with LangChain and LangGraph.',
    duration: '2 Months 15 Days',
    language: 'ENGLISH',
    isFree: false,
    category: 'Artificial Intelligence',
    coverImage: '/agentic-ai-engineering.png',
    benefits: [
      '10+ Real Industry Projects',
      'LangGraph State + Memory Management',
      'Enterprise GraphRAG with Neo4j',
      'Human-in-the-loop AI Workflows'
    ],
    curriculumText: `
      <div class="space-y-6">
        <div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🛡️ Enterprise Agentic AI</h3>
          <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 list-disc pl-5 text-gray-600 dark:text-gray-400">
            <li><b>LCEL:</b> Production pipelines, runnables, fallbacks</li>
            <li><b>LangGraph:</b> Schema, reducers, branching, state</li>
            <li><b>Safety:</b> Prompt injection, output validation</li>
            <li><b>Observability:</b> Tracing spans & experiment versioning</li>
          </ul>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🏗️ Advanced Retrieval Architectures</h3>
          <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 list-disc pl-5 text-gray-600 dark:text-gray-400">
            <li><b>GraphRAG:</b> Neo4j modeling & traversal retrieval</li>
            <li><b>Agentic RAG:</b> Adaptive retrieval & query rewriting</li>
            <li><b>MCP:</b> Tool contracts & secure protocol access</li>
            <li><b>Low-Code:</b> Enterprise workflows with n8n triggers</li>
          </ul>
        </div>
      </div>
    `
  }
];
