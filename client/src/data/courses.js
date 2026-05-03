export const STATIC_COURSES = [
  // ─────────────────────────────────────────────
  // C1 — DATA ANALYST COURSE
  // ─────────────────────────────────────────────
  {
    id: 'c1',
    title: 'Data Analyst Course',
    slug: 'data-analyst-course',
    price: 25000,
    salePrice: 25000,
    pricing: {
      effectivePrice: 25000,
      displayOriginalPrice: 25000,
      discountPercent: 0,
      hasFlashSale: false,
    },
    description:
      'Excel se lekar Power BI tak, MySQL se lekar Python tak — yeh course aapko ek complete Data Analyst banata hai. 10+ real-world data analytics projects ke saath aap industry-ready skills seekhenge jo aapko job dilwane mein madad karenge.',
    shortDescription:
      'Microsoft Excel, MySQL, Power BI, aur Python se Data Analytics seekhein — ek hi course mein sab kuch.',
    duration: '3 Months',
    language: 'Hindi',
    isFree: false,
    category: 'Data Analytics',
    coverImage: '/data-analyst-mastery.png',
    badge: 'BESTSELLER',
    rating: 4.8,
    ratingCount: 1240,
    learnerCount: 4800,
    instructor: {
      name: 'Rishabh Mishra',
      title: 'Senior Data Analyst | Ex-MNC',
      avatar: '/instructors/rishabh.png',
    },
    highlights: [
      'Live + Recorded Classes',
      '10+ Real-World Projects',
      'Lifetime Access',
      'Job Assistance',
      'Certificate of Completion',
    ],
    prerequisites: [
      'Koi bhi prior experience zaroori nahi',
      'Basic computer knowledge (MS Office)',
      'Seekhne ki jigyasa!',
    ],
    benefits: [
      'Microsoft Excel — Basics se Advanced',
      'MySQL — Database Queries & Analytics',
      'Power BI — Interactive Dashboards',
      'Python — Pandas, NumPy, Matplotlib',
      'ChatGPT & AI for Data Analysts',
      '10+ Industry-Grade Projects',
    ],
    skillsGained: [
      'Data Cleaning',
      'Dashboard Design',
      'SQL Analytics',
      'Python EDA',
      'Business Reporting',
      'KPI Tracking',
    ],
    curriculumText: `
<div class="space-y-6">
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">📊 Module 1 — Microsoft Excel (Basics to Advanced)</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Excel Interface, Shortcuts, Formatting, Cell References</li>
      <li>Functions: SUM, AVERAGE, IF, COUNTIF, SUMIFS, VLOOKUP, HLOOKUP, INDEX-MATCH</li>
      <li>Text Functions: LEFT, RIGHT, MID, TRIM, CONCATENATE</li>
      <li>Date & Time Functions, Logical Functions</li>
      <li>Pivot Tables, Pivot Charts, Slicers, Power Query</li>
      <li>Dynamic Dashboards, Conditional Formatting, Data Validation</li>
      <li>What-If Analysis, Goal Seek, Solver</li>
      <li>Project: Sales Dashboard, HR Analytics Report</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🗄️ Module 2 — MySQL for Data Analysis</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>SQL Basics: SELECT, WHERE, ORDER BY, GROUP BY, HAVING</li>
      <li>Joins: INNER, LEFT, RIGHT, FULL OUTER, SELF JOIN</li>
      <li>Subqueries, Nested Queries, CTEs (WITH clause)</li>
      <li>Window Functions: RANK, DENSE_RANK, ROW_NUMBER, LAG, LEAD</li>
      <li>Stored Procedures, Views, Indexes, Query Optimization</li>
      <li>Project: E-Commerce Analytics, Employee DB Analysis</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">📈 Module 3 — Power BI</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Power BI Desktop Introduction, Data Import, Power Query Editor</li>
      <li>Data Modeling: Relationships, Star Schema, Snowflake Schema</li>
      <li>DAX: Calculated Columns, Measures, CALCULATE, FILTER, ALL</li>
      <li>Time Intelligence: TOTALYTD, SAMEPERIODLASTYEAR, DATEADD</li>
      <li>Custom Visuals, Report Themes, Drill-through, Bookmarks</li>
      <li>Publish to Power BI Service, Scheduled Refresh, Row-Level Security</li>
      <li>Project: Financial Dashboard, Retail Sales Report</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🐍 Module 4 — Python for Data Analysis</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Python Basics: Variables, Data Types, Loops, Functions</li>
      <li>NumPy: Arrays, Broadcasting, Mathematical Operations</li>
      <li>Pandas: DataFrame, Series, Groupby, Merge, Pivot Tables</li>
      <li>Matplotlib & Seaborn: Bar, Line, Scatter, Heatmap, Pairplot</li>
      <li>EDA: Missing Values, Outlier Detection, Feature Understanding</li>
      <li>Project: IPL Analysis, COVID Dashboard, Sales Insights</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🤖 Module 5 — ChatGPT & AI for Data Analysts</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Prompt Engineering for Data Analysis tasks</li>
      <li>Using ChatGPT to write SQL queries & Excel formulas</li>
      <li>AI-powered Data Storytelling & Report Generation</li>
      <li>Tools: Copilot in Excel, AI in Power BI</li>
    </ul>
  </div>
</div>`,
  },

  // ─────────────────────────────────────────────
  // C2 — FULL STACK DATA SCIENCE + AGENTIC AI
  // ─────────────────────────────────────────────
  {
    id: 'c2',
    title: 'Full Stack Data Science with Agentic AI & Generative AI',
    slug: 'full-stack-data-science-agentic-generative-ai',
    price: 50000,
    salePrice: 50000,
    pricing: {
      effectivePrice: 50000,
      displayOriginalPrice: 50000,
      discountPercent: 0,
      hasFlashSale: false,
    },
    description:
      'Yeh sabse comprehensive Data Science course hai jo Python se shuru hokar Advanced Agentic AI tak jaata hai. Machine Learning, Deep Learning, NLP, Generative AI (LLMs, RAG), aur Multi-Agent Systems — sab kuch ek saath seekhein real-world projects ke saath. Placement assistance bhi included hai.',
    shortDescription:
      'Python se Agentic AI tak — end-to-end Data Science lifecycle with placement support.',
    duration: '6 Months',
    language: 'Mixed (Hindi + English)',
    isFree: false,
    category: 'Data Science',
    coverImage: '/full-stack data-science.png',
    badge: 'FEATURED',
    rating: 4.9,
    ratingCount: 870,
    learnerCount: 3200,
    instructor: {
      name: 'Rishabh Mishra',
      title: 'AI/ML Engineer | Data Science Lead',
      avatar: '/instructors/rishabh.png',
    },
    highlights: [
      'Live Mentorship Sessions',
      '20+ End-to-End Projects',
      'Interview Preparation',
      'Placement Assistance',
      'Industry Certifications',
    ],
    prerequisites: [
      'Basic Python knowledge helpful (but not required)',
      'Class 12 level Mathematics',
      'Laptop with minimum 8GB RAM',
    ],
    benefits: [
      'Python — Advanced to Mastery',
      'Statistics & Probability for ML',
      'Machine Learning (Supervised + Unsupervised)',
      'Deep Learning: ANN, CNN, RNN, LSTM, Transformers',
      'Natural Language Processing (NLP)',
      'Generative AI: LLMs, Prompt Engineering, RAG',
      'Agentic AI: LangGraph, CrewAI, n8n',
      'MLOps: Docker, MLflow, AWS',
      'Placement Assistance',
    ],
    skillsGained: [
      'Machine Learning',
      'Deep Learning',
      'NLP',
      'LLM Fine-tuning',
      'RAG Systems',
      'Agent Design',
      'Model Deployment',
    ],
    curriculumText: `
<div class="space-y-6">
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🐍 Module 1 — Python & Statistics Foundation</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Python: OOPs, File I/O, Error Handling, Generators, Decorators</li>
      <li>NumPy, Pandas, Matplotlib, Seaborn for Data Analysis</li>
      <li>Statistics: Descriptive Stats, Probability, Distributions</li>
      <li>Hypothesis Testing, A/B Testing, Confidence Intervals</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🧠 Module 2 — Machine Learning</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Supervised: Linear Regression, Logistic Regression, Decision Trees, Random Forest, XGBoost</li>
      <li>Unsupervised: K-Means, DBSCAN, PCA, Hierarchical Clustering</li>
      <li>Model Evaluation: Bias-Variance, Cross-Validation, GridSearchCV</li>
      <li>Feature Engineering, Data Preprocessing Pipelines (sklearn)</li>
      <li>Projects: House Price Prediction, Customer Churn, Credit Risk</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🔬 Module 3 — Deep Learning & NLP</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>ANN: Forward/Backward Propagation, Activation Functions, Optimizers</li>
      <li>CNN: Convolutions, Pooling, Transfer Learning (VGG, ResNet, EfficientNet)</li>
      <li>RNN, LSTM, GRU: Sequence Models, Time-Series Forecasting</li>
      <li>NLP: Tokenization, Word2Vec, BERT, Text Classification, Sentiment Analysis</li>
      <li>Projects: Image Classifier, Stock Forecast, Movie Review Sentiment</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🤖 Module 4 — Generative AI & LLMs</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Transformer Architecture, Attention Mechanism, GPT/BERT internals</li>
      <li>Prompt Engineering: Zero-shot, Few-shot, CoT, ReAct patterns</li>
      <li>Fine-tuning: LoRA, QLoRA, PEFT, RLHF techniques</li>
      <li>RAG Systems: ChromaDB, Pinecone, FAISS, Weaviate vector stores</li>
      <li>OpenAI, Gemini, Mistral, Llama APIs — practical usage</li>
      <li>Projects: PDF Chatbot, Code Generator, Resume Analyzer</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">⚡ Module 5 — Agentic AI Frameworks</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>LangChain: Chains, Memory, Tools, Callbacks, Output Parsers</li>
      <li>LangGraph: State Management, Conditional Edges, Agent Loops</li>
      <li>CrewAI: Role-based Agents, Task Delegation, Multi-Agent Systems</li>
      <li>n8n: No-code AI Workflow Automation & Enterprise Pipelines</li>
      <li>Projects: AI Research Agent, Multi-Agent Hiring System</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🚀 Module 6 — MLOps & Deployment</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Docker: Containerization, Docker Compose for ML apps</li>
      <li>MLflow: Experiment Tracking, Model Registry, Versioning</li>
      <li>FastAPI: REST APIs for ML models</li>
      <li>AWS: EC2, S3, SageMaker Basics, Lambda for serverless inference</li>
      <li>CI/CD for ML: GitHub Actions, Automated Testing</li>
    </ul>
  </div>
</div>`,
  },

  // ─────────────────────────────────────────────
  // C3 — PYTHON + DATA STRUCTURE TRACK
  // ─────────────────────────────────────────────
  {
    id: 'c3',
    title: 'Python and Data Structure Track Course',
    slug: 'python-data-structure-track',
    price: 15000,
    salePrice: 15000,
    pricing: {
      effectivePrice: 15000,
      displayOriginalPrice: 15000,
      discountPercent: 0,
      hasFlashSale: false,
    },
    description:
      'Zero se Python seekhein — Control Flow, Functions, OOPs, Exception Handling se lekar NumPy, Pandas tak. Saath mein Data Structures & Algorithms bhi cover hote hain jo coding interviews ke liye zaroori hain. 10+ industry projects ke saath hands-on experience milta hai.',
    shortDescription:
      'Python programming + Data Structures & Algorithms — beginners ke liye perfect starting point.',
    duration: '45 Days',
    language: 'Hindi',
    isFree: false,
    category: 'Programming',
    coverImage: '/python-data-structures.png',
    rating: 4.7,
    ratingCount: 960,
    learnerCount: 6100,
    instructor: {
      name: 'Rishabh Mishra',
      title: 'Python Developer | Data Engineer',
      avatar: '/instructors/rishabh.png',
    },
    highlights: [
      'Beginner Friendly',
      'Daily Practice Problems',
      '10+ Hands-on Projects',
      'Lifetime Access',
      'Doubt Sessions',
    ],
    prerequisites: [
      'Koi programming experience zaroori nahi',
      'Basic computer usage knowledge',
    ],
    benefits: [
      'Python Fundamentals — Variables to Modules',
      'Object-Oriented Programming (OOPs)',
      'Exception Handling & File I/O',
      'Functional Python — Lambda, Map, Filter, Generators',
      'NumPy & Pandas for Data Analysis',
      'Data Structures — Arrays, Linked Lists, Trees, Graphs',
      'Algorithms — Sorting, Searching, Recursion',
      '10+ Industry-level Projects',
    ],
    skillsGained: [
      'Python Programming',
      'OOPs Design',
      'Algorithm Thinking',
      'Data Manipulation',
      'Problem Solving',
    ],
    curriculumText: `
<div class="space-y-6">
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🐍 Module 1 — Python Fundamentals</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Python Setup, Variables, Data Types (int, float, str, bool, None)</li>
      <li>Operators, Input/Output, Type Casting</li>
      <li>Control Flow: if-elif-else, for, while, break, continue, pass</li>
      <li>Functions: Arguments, *args, **kwargs, Default Values, Scope</li>
      <li>Built-in Data Structures: List, Tuple, Dict, Set with all methods</li>
      <li>String Manipulation, F-strings, String Formatting</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🔧 Module 2 — Advanced Python Concepts</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>OOPs: Classes, Objects, Inheritance, Polymorphism, Encapsulation, Abstraction</li>
      <li>Magic/Dunder Methods: __init__, __str__, __repr__, __len__</li>
      <li>Exception Handling: try-except-finally, Custom Exceptions</li>
      <li>File I/O: Read, Write, Append, JSON, CSV handling</li>
      <li>Functional Programming: Lambda, Map, Filter, Reduce, List Comprehensions</li>
      <li>Iterators, Generators, Decorators, Context Managers</li>
      <li>Modules & Packages, pip, Virtual Environments</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">📊 Module 3 — NumPy & Pandas</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>NumPy: Array Creation, Indexing, Slicing, Broadcasting, Math Ops</li>
      <li>Pandas: Series & DataFrame, loc/iloc, Filtering, Sorting</li>
      <li>Data Cleaning: Null Values, Duplicates, Type Conversion</li>
      <li>Groupby, Aggregation, Merge, Join, Pivot Table</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🏗️ Module 4 — Data Structures & Algorithms</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Arrays, Strings, 2D Matrix problems</li>
      <li>Linked Lists: Singly, Doubly, Circular — Insertion, Deletion, Reversal</li>
      <li>Stack & Queue: Implementation, Applications (Balanced Brackets, LRU Cache)</li>
      <li>Trees: Binary Tree, BST, AVL — Traversals (Inorder, Preorder, Postorder)</li>
      <li>Graphs: BFS, DFS, Shortest Path (Dijkstra), Cycle Detection</li>
      <li>Sorting: Bubble, Selection, Insertion, Merge, Quick Sort</li>
      <li>Searching: Binary Search, Linear Search</li>
      <li>Recursion & Backtracking: N-Queens, Sudoku Solver</li>
      <li>Big-O Analysis: Time & Space Complexity for every topic</li>
    </ul>
  </div>
</div>`,
  },

  // ─────────────────────────────────────────────
  // C4 — FULL STACK AGENTIC AI ENGINEERING
  // ─────────────────────────────────────────────
  {
    id: 'c4',
    title: 'Full Stack Agentic AI Engineering Course',
    slug: 'full-stack-agentic-ai-engineering',
    price: 35000,
    salePrice: 35000,
    pricing: {
      effectivePrice: 35000,
      displayOriginalPrice: 35000,
      discountPercent: 0,
      hasFlashSale: false,
    },
    description:
      'AI Agents banana ab sirf theory nahi — yeh specialized course hai jo aapko production-ready Agentic AI systems banana sikhata hai. LangGraph, GraphRAG (Neo4j), MCP Tool Contracts, aur no-code n8n workflows ke saath aap enterprise-grade AI pipelines deploy kar paoge.',
    shortDescription:
      'LangGraph, GraphRAG, MCP, aur Multi-Agent Systems se production AI engineers banein.',
    duration: '2.5 Months',
    language: 'English',
    isFree: false,
    category: 'Artificial Intelligence',
    coverImage: '/agentic-ai-engineering.png',
    badge: 'FEATURED',
    rating: 4.9,
    ratingCount: 420,
    learnerCount: 1800,
    instructor: {
      name: 'Rishabh Mishra',
      title: 'AI Architect | Agentic Systems Expert',
      avatar: '/instructors/rishabh.png',
    },
    highlights: [
      'Industry-first Agentic AI Curriculum',
      'GraphRAG with Neo4j (Exclusive)',
      'MCP Protocol Deep Dive',
      '8+ Production-grade Projects',
      'Live Code Reviews',
    ],
    prerequisites: [
      'Python programming (intermediate level)',
      'Basic understanding of LLMs & APIs',
      'LangChain/LangGraph basics (helpful)',
    ],
    benefits: [
      'LangGraph — State, Reducers, Branching, Checkpointing',
      'GraphRAG — Knowledge Graphs with Neo4j',
      'Multi-Agent Orchestration (CrewAI, AutoGen)',
      'MCP Tool Contracts & Protocols',
      'Agentic RAG Pipelines',
      'n8n No-Code AI Workflows',
      'Production Deployment on AWS',
    ],
    skillsGained: [
      'Agent Architecture',
      'Graph Databases',
      'RAG Engineering',
      'MCP Protocols',
      'Workflow Automation',
      'Multi-Agent Systems',
    ],
    curriculumText: `
<div class="space-y-6">
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">⚡ Module 1 — LangGraph Deep Dive</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>LangGraph Architecture: StateGraph, Nodes, Edges, Reducers</li>
      <li>Conditional Branching, Parallel Execution, Agent Loops</li>
      <li>Memory: In-memory, Persistent Checkpointing (SQLite, Redis)</li>
      <li>Human-in-the-Loop: Interrupt, Review, Approve workflows</li>
      <li>Subgraphs, Streaming, Error Recovery & Retry Logic</li>
      <li>Project: LangGraph-based Research Agent with memory</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🏗️ Module 2 — Advanced RAG & GraphRAG</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Standard RAG Pipeline review: Chunking, Embedding, Retrieval, Generation</li>
      <li>Advanced Retrieval: Hybrid Search, Re-ranking, HyDE, Contextual Compression</li>
      <li>Agentic RAG: Self-querying, Corrective RAG, Adaptive Retrieval</li>
      <li>GraphRAG: Knowledge Graph construction with Neo4j, Cypher queries</li>
      <li>Entity Extraction, Graph Traversal for multi-hop reasoning</li>
      <li>Microsoft GraphRAG framework — local vs global search</li>
      <li>Project: Enterprise Knowledge Base with GraphRAG</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🤖 Module 3 — Multi-Agent Systems</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>CrewAI: Agents, Tasks, Crews, Tools, Process types (sequential, hierarchical)</li>
      <li>AutoGen: Conversable Agents, GroupChat, Code Execution</li>
      <li>Phidata: Agent Teams, Storage, Memory, Toolkits</li>
      <li>Agent Communication Patterns: Supervisor, Peer-to-peer, Blackboard</li>
      <li>Project: AI Hiring Pipeline — JD Writer + Screener + Interviewer</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🔌 Module 4 — MCP (Model Context Protocol)</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>MCP Architecture: Servers, Clients, Tool Schemas, Resources</li>
      <li>Building custom MCP servers in Python</li>
      <li>Tool Contracts: Input/Output schema design, Validation</li>
      <li>Integrating MCP tools with LangGraph agents</li>
      <li>MCP in Claude, Cursor, and other AI assistants</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">⚙️ Module 5 — n8n Workflow Automation</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>n8n Setup: Cloud vs Self-hosted, Interface overview</li>
      <li>Nodes: HTTP, Webhook, Email, Database, AI Model integrations</li>
      <li>Building AI-powered automation: Lead Gen, Content Pipeline, Support Bot</li>
      <li>Error Handling, Retry Logic, Scheduling</li>
      <li>Enterprise Workflow: Multi-step approval processes with AI decision nodes</li>
    </ul>
  </div>
</div>`,
  },

  // ─────────────────────────────────────────────
  // C5 — GENERATIVE AI & AGENTIC AI WITH PYTHON
  // ─────────────────────────────────────────────
  {
    id: 'c5',
    title: 'Generative AI & Agentic AI with Python',
    slug: 'generative-ai-agentic-ai-python',
    price: 35000,
    salePrice: 35000,
    pricing: {
      effectivePrice: 35000,
      displayOriginalPrice: 35000,
      discountPercent: 0,
      hasFlashSale: false,
    },
    description:
      'ChatGPT use karna alag baat hai, lekin asli AI engineer woh hota hai jo LLMs ke andar jhank sake, unhe fine-tune kar sake, aur production AI apps build kar sake. Yeh course aapko exactly wahi sikhata hai — Transformers, RAG, LangChain, LangGraph, aur Multi-Agent Systems ke through 10+ AI projects ke saath.',
    shortDescription:
      'LLMs, RAG, LangChain se aage jakar production-ready AI apps build karna seekhein.',
    duration: '4 Months',
    language: 'Mixed (Hindi + English)',
    isFree: false,
    category: 'Artificial Intelligence',
    coverImage: '/c-genai-agentic.png',
    badge: 'FEATURED',
    rating: 4.8,
    ratingCount: 680,
    learnerCount: 2900,
    instructor: {
      name: 'Rishabh Mishra',
      title: 'Generative AI Engineer | LLM Specialist',
      avatar: '/instructors/rishabh.png',
    },
    highlights: [
      '10+ AI Application Projects',
      'LLM Fine-tuning Lab',
      'Live API Integration Sessions',
      'Deployment on Cloud',
      'Certificate of Completion',
    ],
    prerequisites: [
      'Python programming (intermediate)',
      'Basic understanding of Machine Learning concepts',
    ],
    benefits: [
      'LLM Fundamentals — Transformer Architecture',
      'Prompt Engineering — CoT, ReAct, ToT',
      'LLM Fine-tuning — LoRA, QLoRA, PEFT',
      'RAG with ChromaDB, Pinecone, FAISS',
      'LangChain — Chains, Agents, Memory, Tools',
      'LangGraph — Stateful Agentic Workflows',
      'CrewAI — Multi-Agent Orchestration',
      '10+ Real AI Application Projects',
    ],
    skillsGained: [
      'Prompt Engineering',
      'LLM Fine-tuning',
      'RAG Pipeline',
      'LangChain',
      'LangGraph',
      'AI App Development',
    ],
    curriculumText: `
<div class="space-y-6">
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">💡 Module 1 — Foundations of Generative AI</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>History of AI: From RNNs to Transformers</li>
      <li>Transformer Architecture: Self-Attention, Multi-Head Attention, Positional Encoding</li>
      <li>BERT: Masked Language Modeling, NSP, Sentence Embeddings</li>
      <li>GPT Series: Autoregressive Generation, GPT-2, GPT-3, GPT-4 internals</li>
      <li>T5, LLaMA, Mistral, Gemma, Phi — comparative study</li>
      <li>Tokenization: BPE, WordPiece, SentencePiece</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🎯 Module 2 — Prompt Engineering Mastery</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Zero-shot, One-shot, Few-shot Prompting</li>
      <li>Chain-of-Thought (CoT), Tree-of-Thought (ToT)</li>
      <li>ReAct Pattern: Reasoning + Acting for AI agents</li>
      <li>Self-consistency, Generated Knowledge Prompting</li>
      <li>System Prompts, Role Prompting, Persona Design</li>
      <li>Output Formatting: JSON mode, Structured Outputs, Guardrails</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🔧 Module 3 — LLM Fine-tuning</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>When to Fine-tune vs RAG vs Prompt Engineering</li>
      <li>Dataset Preparation: JSONL format, Instruction tuning datasets</li>
      <li>LoRA (Low-Rank Adaptation): Math, Configuration, Training</li>
      <li>QLoRA: 4-bit Quantization + LoRA on consumer GPUs</li>
      <li>PEFT Library: Training with HuggingFace Transformers</li>
      <li>RLHF: Reward Modeling, PPO, DPO (Direct Preference Optimization)</li>
      <li>Model Evaluation: ROUGE, BLEU, BERTScore, LLM-as-Judge</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">📚 Module 4 — RAG Systems</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>RAG Architecture: Indexing, Retrieval, Augmentation, Generation</li>
      <li>Embedding Models: OpenAI, Cohere, HuggingFace sentence transformers</li>
      <li>Vector Databases: ChromaDB (local), Pinecone (cloud), FAISS</li>
      <li>Chunking Strategies: Fixed, Recursive, Semantic, Parent-Child</li>
      <li>Advanced Retrieval: Hybrid BM25+Dense, Cross-encoder re-ranking</li>
      <li>Evaluation: Faithfulness, Relevance, Context Recall (RAGAs)</li>
      <li>Projects: PDF Q&A Bot, YouTube Video Chatbot, Legal Document Analyzer</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">⚙️ Module 5 — LangChain & LangGraph</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>LangChain: LLMs, PromptTemplates, Chains, Memory, OutputParsers</li>
      <li>LangChain Tools: Tavily Search, Wikipedia, Calculator, Custom Tools</li>
      <li>LCEL (LangChain Expression Language): Pipe operator, Runnables</li>
      <li>LangGraph: StateGraph, Nodes, Edges, Checkpointing, Streaming</li>
      <li>Agent Patterns: ReAct Agent, Reflection, Corrective Loops</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🤖 Module 6 — Multi-Agent Systems & Deployment</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>CrewAI: Agents, Tasks, Roles, Backstory, Tools, Crew execution</li>
      <li>Multi-Agent Coordination: Task delegation, Agent communication</li>
      <li>FastAPI: Building REST APIs for AI applications</li>
      <li>Streamlit & Gradio: Rapid AI app UIs</li>
      <li>Docker + AWS EC2: Deploying AI apps to production</li>
    </ul>
  </div>
</div>`,
  },

  // ─────────────────────────────────────────────
  // C6 — DATA ANALYTICS & BUSINESS ANALYTICS
  // ─────────────────────────────────────────────
  {
    id: 'c6',
    title: 'Data Analytics and Business Analytics',
    slug: 'data-analytics-business-analytics',
    price: 30000,
    salePrice: 30000,
    pricing: {
      effectivePrice: 30000,
      displayOriginalPrice: 30000,
      discountPercent: 0,
      hasFlashSale: false,
    },
    description:
      'Data dekhna alag baat hai, ussse business decisions lena alag. Yeh course aapko sirf tools nahi sikhata — aap business ke andar data kaise kaam karta hai woh samajhte hain. Excel, Power BI, SQL, aur Business KPIs — sab milake aapko ek confident Business Analyst banata hai.',
    shortDescription:
      'Excel se Power BI tak, SQL se Business KPIs tak — ek data-driven professional banein.',
    duration: '4 Months',
    language: 'Hindi',
    isFree: false,
    category: 'Data Analytics',
    coverImage: '/c-data-business-analytics.png',
    badge: 'BESTSELLER',
    rating: 4.8,
    ratingCount: 1100,
    learnerCount: 5200,
    instructor: {
      name: 'Rishabh Mishra',
      title: 'Business Analytics Expert | 7+ Years Industry',
      avatar: '/instructors/rishabh.png',
    },
    highlights: [
      'Perfect for Working Professionals',
      'Business Case Studies',
      '10+ Industry Projects',
      'Placement Support',
      'Weekend Batches Available',
    ],
    prerequisites: [
      'Basic Excel knowledge (helpful but not required)',
      'Freshers & working professionals dono ke liye suitable',
    ],
    benefits: [
      'Microsoft Excel — Advanced Level',
      'Power BI — Professional Dashboards',
      'MySQL — Analytical Queries',
      'Business KPIs & Metric Design',
      'A/B Testing & Cohort Analysis',
      'Storytelling with Data',
      '10+ Industry-Specific Projects',
    ],
    skillsGained: [
      'Data Visualization',
      'Business Intelligence',
      'SQL Analytics',
      'Dashboard Design',
      'KPI Measurement',
      'Data Storytelling',
    ],
    curriculumText: `
<div class="space-y-6">
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">📊 Module 1 — Advanced Microsoft Excel</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Excel Formulas: VLOOKUP, XLOOKUP, INDEX-MATCH, SUMPRODUCT</li>
      <li>Array Formulas, Dynamic Arrays, LAMBDA functions</li>
      <li>Pivot Tables: Grouping, Calculated Fields, Slicers, Timelines</li>
      <li>Power Query: Data Import, Transformation, Merge & Append</li>
      <li>Dynamic Dashboards with Charts, Sparklines, Form Controls</li>
      <li>Data Validation, Conditional Formatting, Audit Tools</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">📈 Module 2 — Power BI for Business</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Power BI Desktop: Data Import from Excel, SQL, Web, APIs</li>
      <li>Data Modeling: Star Schema, Relationships, Cardinality</li>
      <li>DAX: SUMX, CALCULATETABLE, Time Intelligence Functions</li>
      <li>Custom Visuals, Drill-through, Tooltips, Bookmarks</li>
      <li>Power BI Service: Workspace, Dashboards, Sharing, Row-Level Security</li>
      <li>Projects: Executive Sales Dashboard, Financial P&L Report, HR Analytics</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🗄️ Module 3 — MySQL for Business Analytics</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>SQL Basics to Advanced: Joins, Subqueries, CTEs</li>
      <li>Window Functions: RANK, ROW_NUMBER, NTILE, Running Totals</li>
      <li>Business Queries: Cohort Analysis, Retention, Funnel Analysis</li>
      <li>Stored Procedures & Views for reusable analytics</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">📈 Module 4 — Business Analytics & Strategy</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Business Metrics: Revenue, ARPU, LTV, CAC, Churn Rate, NPS</li>
      <li>KPI Framework Design: OKRs, North Star Metrics</li>
      <li>A/B Testing: Hypothesis Setup, Statistical Significance, Interpretation</li>
      <li>Cohort Analysis, Customer Segmentation (RFM Analysis)</li>
      <li>Funnel Analysis: Conversion Rate Optimization</li>
      <li>Data Storytelling: Executive Presentations, Narrative Design</li>
      <li>Projects: E-Commerce Analytics, Telecom Churn Analysis, Fintech Dashboard</li>
    </ul>
  </div>
</div>`,
  },

  // ─────────────────────────────────────────────
  // C7 — FULL STACK PHP, DART, MYSQL
  // ─────────────────────────────────────────────
  {
    id: 'c7',
    title: 'Full Stack Development — PHP, Dart, MySQL',
    slug: 'full-stack-php-dart-mysql',
    price: 30000,
    salePrice: 30000,
    pricing: {
      effectivePrice: 30000,
      displayOriginalPrice: 30000,
      discountPercent: 0,
      hasFlashSale: false,
    },
    description:
      'HTML se lekar MySQL-powered backend tak — yeh course aapko complete web development foundation deta hai. PHP ke saath robust backends banana, Dart se frontend logic banana, aur MySQL se data manage karna — sab ek hi course mein. 3 mahine mein job-ready skills.',
    shortDescription:
      'HTML/CSS/JS + PHP Backend + MySQL Database + Dart — complete web development package.',
    duration: '3 Months',
    language: 'Hindi',
    isFree: false,
    category: 'Web Development',
    coverImage: '/c-fullstack-php-dart.png',
    rating: 4.6,
    ratingCount: 380,
    learnerCount: 1500,
    instructor: {
      name: 'Rishabh Mishra',
      title: 'Full Stack Developer | 5+ Years',
      avatar: '/instructors/rishabh.png',
    },
    highlights: [
      '3 Real-World Web App Projects',
      'REST API Development',
      'Database Design from Scratch',
      'Deployment on Shared Hosting',
      'Source Code Included',
    ],
    prerequisites: [
      'Basic computer knowledge',
      'HTML/CSS basics (helpful but will be covered)',
    ],
    benefits: [
      'HTML5, CSS3, JavaScript — Frontend Fundamentals',
      'PHP — Backend Development with OOPs',
      'MySQL — Database Design & Optimization',
      'Dart — Client-side Logic Programming',
      'REST API Design & Consumption',
      'Sessions, Authentication, Security',
      '3+ Complete Web Application Projects',
    ],
    skillsGained: [
      'HTML/CSS/JS',
      'PHP Backend',
      'MySQL Design',
      'REST APIs',
      'Dart Programming',
      'Web Security',
    ],
    curriculumText: `
<div class="space-y-6">
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🌐 Module 1 — Frontend (HTML, CSS, JavaScript)</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>HTML5: Semantic Tags, Forms, Tables, Media Elements</li>
      <li>CSS3: Box Model, Flexbox, Grid, Animations, Transitions</li>
      <li>Responsive Design: Media Queries, Mobile-first approach</li>
      <li>Bootstrap 5: Grid System, Components, Utilities</li>
      <li>JavaScript: DOM, Events, AJAX, Fetch API, JSON</li>
      <li>jQuery Basics: Selectors, Events, AJAX Calls</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">⚙️ Module 2 — PHP Backend Development</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>PHP Basics: Variables, Arrays, Functions, String Manipulation</li>
      <li>OOPs in PHP: Classes, Inheritance, Traits, Interfaces, Namespaces</li>
      <li>Form Handling: $_GET, $_POST, $_FILES, Input Validation</li>
      <li>Sessions & Cookies: Authentication System, Remember Me</li>
      <li>File Handling: Upload, Read, Write, CSV Export</li>
      <li>MVC Pattern: Model-View-Controller in pure PHP</li>
      <li>Laravel Basics: Routing, Blade Templates, Eloquent ORM</li>
      <li>Security: SQL Injection prevention, XSS, CSRF Protection</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🗄️ Module 3 — MySQL Database</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Database Design: ER Diagrams, Normalization (1NF, 2NF, 3NF)</li>
      <li>DDL: CREATE, ALTER, DROP — Schema Management</li>
      <li>DML: INSERT, UPDATE, DELETE, Transactions (ACID)</li>
      <li>Joins, Subqueries, Stored Procedures, Triggers, Views</li>
      <li>Indexing & Query Optimization, EXPLAIN plan</li>
      <li>PHP-MySQL Integration: PDO, Prepared Statements</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🎯 Module 4 — Dart & REST APIs</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Dart Fundamentals: Variables, OOPs, Null Safety, Async/Await</li>
      <li>REST API Design: Endpoints, HTTP Methods, Status Codes</li>
      <li>JSON API building with PHP: Authentication via JWT tokens</li>
      <li>Consuming APIs from Dart: http package, Error Handling</li>
      <li>Projects: Student Management System, Blog CMS, E-Commerce Backend</li>
    </ul>
  </div>
</div>`,
  },

  // ─────────────────────────────────────────────
  // C8 — MERN STACK
  // ─────────────────────────────────────────────
  {
    id: 'c8',
    title: 'MERN Stack — React JS, Node JS, MongoDB, Express JS',
    slug: 'mern-stack-react-node-mongodb-express',
    price: 30000,
    salePrice: 30000,
    pricing: {
      effectivePrice: 30000,
      displayOriginalPrice: 30000,
      discountPercent: 0,
      hasFlashSale: false,
    },
    description:
      'MERN Stack aaj industry ka sabse popular web development combination hai. React se beautiful UIs, Node.js + Express se powerful APIs, aur MongoDB se scalable database — ek saath seekhein. JWT authentication, Redux Toolkit, aur AWS deployment ke saath aap complete full-stack developer banenge.',
    shortDescription:
      'MongoDB, Express, React, Node.js — India ke sabse in-demand web development stack ka mastery course.',
    duration: '3 Months',
    language: 'Hindi',
    isFree: false,
    category: 'Web Development',
    coverImage: '/c-mern-stack.png',
    badge: 'BESTSELLER',
    rating: 4.9,
    ratingCount: 1450,
    learnerCount: 7200,
    instructor: {
      name: 'Rishabh Mishra',
      title: 'MERN Stack Developer | Startup Founder',
      avatar: '/instructors/rishabh.png',
    },
    highlights: [
      'Most In-demand Web Stack',
      '5+ Full-Stack Projects',
      'JWT Auth + Role-based Access',
      'AWS/Vercel Deployment',
      'Interview Preparation',
    ],
    prerequisites: [
      'HTML, CSS, JavaScript basics',
      'Basic programming concepts',
    ],
    benefits: [
      'React JS — Hooks, Redux Toolkit, React Router',
      'Node.js — Event Loop, Streams, Modules',
      'Express JS — REST APIs, Middleware',
      'MongoDB — Aggregation, Mongoose ORM',
      'JWT Authentication & Security',
      'Socket.io — Real-time Features',
      'AWS/Vercel Deployment',
      '5+ Complete MERN Projects',
    ],
    skillsGained: [
      'React Development',
      'Node.js APIs',
      'MongoDB',
      'Authentication',
      'State Management',
      'Cloud Deployment',
    ],
    curriculumText: `
<div class="space-y-6">
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">⚛️ Module 1 — React JS</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>React Basics: JSX, Components, Props, State, Event Handling</li>
      <li>Hooks: useState, useEffect, useRef, useContext, useMemo, useCallback</li>
      <li>Custom Hooks, Higher-Order Components, Render Props</li>
      <li>React Router v6: Routes, Nested Routes, Protected Routes, useNavigate</li>
      <li>Redux Toolkit: createSlice, createAsyncThunk, RTK Query</li>
      <li>React Query: Data Fetching, Caching, Mutations</li>
      <li>Performance: React.memo, Lazy Loading, Code Splitting</li>
      <li>Forms: React Hook Form, Yup Validation</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🖥️ Module 2 — Node.js & Express</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Node.js: Event Loop, Non-blocking I/O, Module System (CJS & ESM)</li>
      <li>npm Ecosystem, Package Management, Scripts</li>
      <li>Express: Routing, Middleware, Error Handling, Static Files</li>
      <li>REST API Best Practices: Versioning, Status Codes, Pagination</li>
      <li>Authentication: JWT, Refresh Tokens, bcrypt Password Hashing</li>
      <li>Role-Based Access Control (RBAC)</li>
      <li>File Uploads: Multer, Cloudinary Integration</li>
      <li>Email: Nodemailer, Sendgrid for OTP & Notifications</li>
      <li>API Security: Rate Limiting, Helmet, CORS, Input Sanitization</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🍃 Module 3 — MongoDB & Mongoose</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>MongoDB Basics: Collections, Documents, CRUD Operations</li>
      <li>Mongoose: Schema, Model, Validators, Middleware (Pre/Post hooks)</li>
      <li>Relationships: Populate, Embedded vs Referenced documents</li>
      <li>Aggregation Pipeline: $match, $group, $lookup, $project, $sort</li>
      <li>Indexes: Single, Compound, Text Search, TTL Indexes</li>
      <li>MongoDB Atlas: Cloud Setup, Connection, Monitoring</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🚀 Module 4 — Advanced Features & Deployment</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Socket.io: Real-time Chat Application, Notifications</li>
      <li>Payment Integration: Razorpay / Stripe Checkout</li>
      <li>Testing: Jest, Supertest for API testing</li>
      <li>Docker: Containerizing MERN application</li>
      <li>Deployment: AWS EC2, S3 for Media, Vercel for React, PM2 Process Manager</li>
      <li>CI/CD: GitHub Actions for automated deployment</li>
      <li>Projects: Full E-Commerce Platform, Social Media App, Project Management Tool</li>
    </ul>
  </div>
</div>`,
  },

  // ─────────────────────────────────────────────
  // C9 — DATA ANALYTICS WITH PYTHON
  // ─────────────────────────────────────────────
  {
    id: 'c9',
    title: 'Data Analytics with Python',
    slug: 'data-analytics-python',
    price: 25000,
    salePrice: 25000,
    pricing: {
      effectivePrice: 25000,
      displayOriginalPrice: 25000,
      discountPercent: 0,
      hasFlashSale: false,
    },
    description:
      'Python aaj data analytics ka sabse powerful tool hai. Yeh course aapko NumPy, Pandas, Matplotlib, Seaborn, aur Plotly ke saath real datasets par kaam karna sikhata hai. Data cleaning se EDA tak, aur visualization se business insights tak — har step practically cover hota hai.',
    shortDescription:
      'NumPy, Pandas, Matplotlib, Seaborn ke saath Python se professional Data Analytics seekhein.',
    duration: '4 Months',
    language: 'Hindi',
    isFree: false,
    category: 'Data Analytics',
    coverImage: '/c-data-analytics-python.png',
    rating: 4.7,
    ratingCount: 720,
    learnerCount: 3400,
    instructor: {
      name: 'Rishabh Mishra',
      title: 'Data Analytics Engineer | Python Expert',
      avatar: '/instructors/rishabh.png',
    },
    highlights: [
      '10+ Real Dataset Projects',
      'Kaggle Competition Walkthrough',
      'Business Insight Reporting',
      'Interactive Plotly Dashboards',
      'Certificate Included',
    ],
    prerequisites: [
      'Python basics (will be revised at start)',
      'Class 10 level mathematics',
    ],
    benefits: [
      'NumPy — Array Computing Mastery',
      'Pandas — Advanced Data Manipulation',
      'Matplotlib & Seaborn — Static Visualizations',
      'Plotly — Interactive Charts & Dashboards',
      'Data Cleaning & Preprocessing',
      'Exploratory Data Analysis (EDA)',
      'Statistical Analysis with Python',
      'Business Insight Reporting',
    ],
    skillsGained: [
      'Pandas',
      'NumPy',
      'Data Visualization',
      'EDA',
      'Statistical Analysis',
      'Business Reporting',
    ],
    curriculumText: `
<div class="space-y-6">
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🐍 Module 1 — Python for Analytics (Quick Revision)</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Python revision: Data Types, Lists, Dicts, Functions, OOPs basics</li>
      <li>List Comprehensions, Lambda, Map, Filter</li>
      <li>Working with CSV, JSON, Excel files natively</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🔢 Module 2 — NumPy Mastery</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Array Creation: arange, linspace, zeros, ones, random</li>
      <li>Indexing, Slicing, Boolean Masking, Fancy Indexing</li>
      <li>Broadcasting: Shape rules, Operations on different-shaped arrays</li>
      <li>Mathematical Operations: dot product, matrix operations, linear algebra</li>
      <li>Aggregations: sum, mean, std, percentile along axes</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🐼 Module 3 — Pandas Deep Dive</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Series & DataFrame creation, attributes, methods</li>
      <li>Data Access: loc, iloc, at, iat, Boolean filtering</li>
      <li>Data Cleaning: isnull, fillna, dropna, duplicated, replace</li>
      <li>Type Conversion, String Operations (str accessor), Regex in Pandas</li>
      <li>GroupBy: Split-Apply-Combine, agg, transform, apply</li>
      <li>Merge, Join, Concat, Append operations</li>
      <li>Pivot Table, Crosstab, Melt, Stack, Unstack</li>
      <li>Time Series: datetime, resample, rolling, shift</li>
      <li>Performance: Vectorization vs loops, Categorical dtype, chunking large files</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">📊 Module 4 — Data Visualization</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Matplotlib: Figure, Axes, Subplots, Line, Bar, Scatter, Pie, Histogram</li>
      <li>Matplotlib customization: Colors, Markers, Annotations, Legends</li>
      <li>Seaborn: Distributions, Categorical Plots, Regression, Heatmap, Pairplot</li>
      <li>Plotly Express & Graph Objects: Interactive Bar, Scatter, Funnel, Sunburst</li>
      <li>Plotly Dash: Basic interactive dashboard building</li>
      <li>Visualization Best Practices: Chart selection, Color theory, Storytelling</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🔍 Module 5 — EDA & Business Insights</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>EDA Framework: Understand → Clean → Explore → Conclude</li>
      <li>Univariate, Bivariate, Multivariate Analysis</li>
      <li>Outlier Detection: IQR Method, Z-score, Visual Methods</li>
      <li>Correlation Analysis: Pearson, Spearman, Cramer's V</li>
      <li>Feature Distribution: Skewness, Kurtosis, Normality Tests</li>
      <li>Business Insight Report: Executive Summary, Key Findings, Recommendations</li>
      <li>Projects: IPL Analysis, Zomato Dataset, Global COVID-19 Data, Netflix EDA</li>
    </ul>
  </div>
</div>`,
  },

  // ─────────────────────────────────────────────
  // C10 — DEVOPS & MLOPS
  // ─────────────────────────────────────────────
  {
    id: 'c10',
    title: 'DevOps & MLOps',
    slug: 'devops-mlops',
    price: 25000,
    salePrice: 25000,
    pricing: {
      effectivePrice: 25000,
      displayOriginalPrice: 25000,
      discountPercent: 0,
      hasFlashSale: false,
    },
    description:
      'Model banana kafi nahi — model deploy karna, monitor karna, aur automate karna sikho. Yeh course DevOps aur MLOps ka best combination hai — Docker, Kubernetes, CI/CD, GitHub Actions, MLflow, DVC, aur AWS. AI Engineers aur Software Developers dono ke liye perfect course.',
    shortDescription:
      'Docker, Kubernetes, MLflow, GitHub Actions, AWS — modern software & ML delivery pipeline mastery.',
    duration: '2 Months',
    language: 'Mixed (Hindi + English)',
    isFree: false,
    category: 'DevOps',
    coverImage: '/c-devops-mlops.png',
    rating: 4.7,
    ratingCount: 310,
    learnerCount: 1200,
    instructor: {
      name: 'Rishabh Mishra',
      title: 'DevOps Engineer | MLOps Specialist',
      avatar: '/instructors/rishabh.png',
    },
    highlights: [
      'Industry DevOps Practices',
      'Full CI/CD Pipeline Project',
      'ML Model Deployment End-to-End',
      'AWS Hands-on Labs',
      'Infrastructure as Code',
    ],
    prerequisites: [
      'Python programming (intermediate)',
      'Basic Linux/Terminal commands',
      'Git & GitHub basics',
    ],
    benefits: [
      'Docker — Containerization & Compose',
      'Kubernetes — Orchestration & Helm',
      'GitHub Actions — CI/CD Pipelines',
      'MLflow — Experiment Tracking & Model Registry',
      'DVC — Data & Model Version Control',
      'AWS — EC2, S3, SageMaker, Lambda',
      'Infrastructure as Code (Terraform basics)',
      'Model Drift Monitoring',
    ],
    skillsGained: [
      'Docker & K8s',
      'CI/CD',
      'MLflow',
      'AWS Deployment',
      'Model Monitoring',
      'IaC',
    ],
    curriculumText: `
<div class="space-y-6">
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🐳 Module 1 — Docker</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Docker Architecture: Engine, Images, Containers, Registry</li>
      <li>Dockerfile: Writing, Building, Optimizing (multi-stage builds)</li>
      <li>Docker Commands: run, exec, ps, logs, inspect, volumes, networks</li>
      <li>Docker Compose: Multi-container apps (Flask + Redis + Postgres)</li>
      <li>Docker Hub: Push, Pull, Private Registries (ECR, GCR)</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">☸️ Module 2 — Kubernetes</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>K8s Architecture: Master Node, Worker Nodes, etcd, API Server</li>
      <li>Objects: Pods, Deployments, Services, ConfigMaps, Secrets, Ingress</li>
      <li>kubectl: Applying manifests, Rollouts, Rollbacks, Port-forwarding</li>
      <li>Helm: Chart creation, Values overriding, Deploying apps</li>
      <li>Horizontal Pod Autoscaling, Resource Limits, Liveness/Readiness probes</li>
      <li>EKS/GKE: Managed Kubernetes basics</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">⚙️ Module 3 — CI/CD Pipelines</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Git Workflows: Branching strategies, PR reviews, Protected branches</li>
      <li>GitHub Actions: Triggers, Jobs, Steps, Marketplace Actions</li>
      <li>CI Pipeline: Lint → Test → Build → Dockerize → Push</li>
      <li>CD Pipeline: Pull → Deploy to EC2/K8s → Health Check → Notify</li>
      <li>Jenkins: Pipeline as Code (Jenkinsfile), Blue-Green Deployments</li>
      <li>Secrets Management: GitHub Secrets, HashiCorp Vault basics</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🤖 Module 4 — MLOps</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>MLflow: Tracking Experiments, Logging Metrics/Params/Artifacts</li>
      <li>MLflow Model Registry: Staging → Production promotion workflow</li>
      <li>DVC: Data Versioning, Pipeline stages, Remote Storage (S3)</li>
      <li>FastAPI: Wrapping ML models as REST APIs</li>
      <li>Model Drift Monitoring: Data drift, Concept drift, Evidently AI</li>
      <li>AWS SageMaker: Training Jobs, Endpoints, Model Monitor</li>
      <li>MLflow + GitHub Actions: Automated retraining pipelines</li>
      <li>Project: End-to-end MLOps Pipeline (Train → Track → Deploy → Monitor)</li>
    </ul>
  </div>
</div>`,
  },

  // ─────────────────────────────────────────────
  // C11 — DIGITAL MARKETING
  // ─────────────────────────────────────────────
  {
    id: 'c11',
    title: 'Digital Marketing',
    slug: 'digital-marketing',
    price: 25000,
    salePrice: 25000,
    pricing: {
      effectivePrice: 25000,
      displayOriginalPrice: 25000,
      discountPercent: 0,
      hasFlashSale: false,
    },
    description:
      'Aaj ke daur mein business online hain — aur unhe Digital Marketers ki zarurat hai. Yeh course aapko SEO, Google Ads, Meta Ads, Email Marketing, Content Strategy, aur Google Analytics 4 sikhata hai. Freshers ke liye job, business owners ke liye growth, aur professionals ke liye freelancing — sabke liye perfect.',
    shortDescription:
      'SEO, Google Ads, Social Media, Email Marketing — digital marketing ka complete package.',
    duration: '2 Months',
    language: 'Hindi',
    isFree: false,
    category: 'Digital Marketing',
    coverImage: '/c-digital-marketing.png',
    rating: 4.6,
    ratingCount: 540,
    learnerCount: 2800,
    instructor: {
      name: 'Rishabh Mishra',
      title: 'Digital Marketing Strategist | Growth Hacker',
      avatar: '/instructors/rishabh.png',
    },
    highlights: [
      'Live Campaign Walkthroughs',
      'Google & Meta Ads Credit Lab',
      'Freelancing Guide Included',
      'Certificate of Completion',
      'Job & Internship Assistance',
    ],
    prerequisites: [
      'Basic internet usage knowledge',
      'Koi marketing experience zaroori nahi',
    ],
    benefits: [
      'SEO — On-page, Off-page, Technical',
      'Google Ads — Search, Display, Shopping',
      'Meta Ads — Facebook & Instagram',
      'Social Media Marketing & Growth',
      'Email Marketing & Automation',
      'Content Marketing Strategy',
      'Google Analytics 4 & GA4 Events',
      'Freelancing on Fiverr & Upwork',
    ],
    skillsGained: [
      'SEO',
      'Google Ads',
      'Meta Ads',
      'Email Marketing',
      'Analytics',
      'Content Strategy',
      'Freelancing',
    ],
    curriculumText: `
<div class="space-y-6">
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🔍 Module 1 — SEO (Search Engine Optimization)</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>How Search Engines Work: Crawling, Indexing, Ranking</li>
      <li>Keyword Research: Google Keyword Planner, Ahrefs, SEMrush</li>
      <li>On-Page SEO: Title Tags, Meta Descriptions, Headings, URL Structure</li>
      <li>Content Optimization: Semantic SEO, LSI Keywords, E-E-A-T</li>
      <li>Technical SEO: Site Speed, Core Web Vitals, Sitemap, Robots.txt, Schema Markup</li>
      <li>Off-Page SEO: Link Building Strategies, Guest Posting, HARO</li>
      <li>Local SEO: Google Business Profile, NAP Consistency</li>
      <li>Tools: Google Search Console, Ahrefs, Screaming Frog</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">📱 Module 2 — Paid Advertising</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Google Ads: Account setup, Campaign Types (Search, Display, Shopping, YouTube)</li>
      <li>Keyword Match Types, Bidding Strategies, Quality Score</li>
      <li>Ad Copywriting, Ad Extensions, Landing Page Optimization</li>
      <li>Meta Ads Manager: Objectives, Audience Targeting (Custom, Lookalike)</li>
      <li>Facebook & Instagram Ad Formats: Image, Video, Carousel, Collection</li>
      <li>Retargeting: Pixel setup, Custom Audiences, Dynamic Ads</li>
      <li>Budget Management, A/B Testing, ROAS Optimization</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">📲 Module 3 — Social Media & Content Marketing</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Platform Strategy: Instagram, LinkedIn, YouTube, Twitter/X</li>
      <li>Content Calendar Creation, Posting Frequency, Hashtag Strategy</li>
      <li>Reels & Shorts Strategy: Hooks, Editing Tips, Viral Patterns</li>
      <li>Influencer Marketing: Finding, Outreach, Collaboration Types</li>
      <li>Content Marketing: Blogging, YouTube SEO, Podcast Strategy</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">📧 Module 4 — Email Marketing & Analytics</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Email Marketing: Mailchimp, Brevo setup, List Building strategies</li>
      <li>Email Sequences: Welcome, Nurture, Abandoned Cart, Re-engagement</li>
      <li>Automation: Drip Campaigns, Trigger-based Emails</li>
      <li>Google Analytics 4: Events, Conversions, Audiences, Funnels</li>
      <li>GA4 Reports: Acquisition, Engagement, Monetization, Retention</li>
      <li>UTM Parameters, Conversion Tracking, Attribution Models</li>
      <li>Marketing Dashboard: Data Studio (Looker Studio) Reports</li>
    </ul>
  </div>
</div>`,
  },

  // ─────────────────────────────────────────────
  // C12 — DATA STRUCTURE WITH ADVANCED PYTHON
  // ─────────────────────────────────────────────
  {
    id: 'c12',
    title: 'Data Structure with Advanced Python',
    slug: 'data-structure-advanced-python',
    price: 20000,
    salePrice: 20000,
    pricing: {
      effectivePrice: 20000,
      displayOriginalPrice: 20000,
      discountPercent: 0,
      hasFlashSale: false,
    },
    description:
      'FAANG-level interviews crack karne ke liye DSA aur Advanced Python dono zaroori hain. Yeh course Arrays se Graphs tak har data structure, aur Generators se AsyncIO tak advanced Python patterns cover karta hai — sabke saath Time & Space Complexity analysis. Mock interviews aur practice problems included.',
    shortDescription:
      'DSA + Advanced Python — FAANG/product company interviews ke liye complete preparation.',
    duration: '3 Months',
    language: 'Hindi',
    isFree: false,
    category: 'Programming',
    coverImage: '/c-data-structure-python.png',
    rating: 4.8,
    ratingCount: 490,
    learnerCount: 2100,
    instructor: {
      name: 'Rishabh Mishra',
      title: 'Ex-FAANG Interviewer | Algorithm Expert',
      avatar: '/instructors/rishabh.png',
    },
    highlights: [
      '200+ Practice Problems',
      'Mock Interview Sessions',
      'FAANG Problem Patterns',
      'Daily Coding Challenges',
      'Interview Strategy Guide',
    ],
    prerequisites: [
      'Python basics (variables, loops, functions)',
      'Basic OOPs understanding',
    ],
    benefits: [
      'All Major Data Structures with implementations',
      'Sorting & Searching Algorithms',
      'Dynamic Programming (Memoization + Tabulation)',
      'Graph Algorithms — BFS, DFS, Dijkstra',
      'Big-O Analysis for every topic',
      'Advanced Python — AsyncIO, Threading, Design Patterns',
      '200+ Curated Practice Problems',
      'Mock Interview Preparation',
    ],
    skillsGained: [
      'DSA',
      'Algorithm Design',
      'Big-O Analysis',
      'Advanced Python',
      'Problem Solving',
      'Interview Preparation',
    ],
    curriculumText: `
<div class="space-y-6">
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🏗️ Module 1 — Linear Data Structures</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Arrays & Strings: Two Pointers, Sliding Window, Prefix Sum patterns</li>
      <li>2D Arrays: Matrix Rotation, Spiral Order, Diagonal Traversal</li>
      <li>Linked Lists: Singly, Doubly, Circular — all operations + LeetCode top problems</li>
      <li>Stack: Implementation, Applications (Balanced Brackets, Next Greater Element, Stock Span)</li>
      <li>Queue & Deque: BFS, Sliding Window Maximum, Implementation using Stack</li>
      <li>Hashing: HashMap, HashSet — Frequency Count, Anagram, Subarray Sum problems</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🌳 Module 2 — Trees & Heaps</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Binary Tree: Traversals (Inorder, Preorder, Postorder, Level Order)</li>
      <li>BST: Insert, Delete, Search, Validate BST, LCA</li>
      <li>Tree Problems: Height, Diameter, Path Sum, Zigzag Traversal, Mirror</li>
      <li>AVL Trees & Rotations (concept), Red-Black Tree (concept)</li>
      <li>Heaps: Min-Heap, Max-Heap, heapq in Python, Heap Sort</li>
      <li>Priority Queue Applications: K Largest Elements, Median in Stream, Merge K Lists</li>
      <li>Tries: Insert, Search, StartsWith — Autocomplete, Word Search</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🕸️ Module 3 — Graphs & Dynamic Programming</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Graph Representation: Adjacency Matrix & List</li>
      <li>BFS: Shortest Path (unweighted), Level-wise traversal</li>
      <li>DFS: Cycle Detection, Topological Sort, Islands problem</li>
      <li>Shortest Path: Dijkstra, Bellman-Ford, Floyd-Warshall</li>
      <li>Minimum Spanning Tree: Kruskal's, Prim's Algorithm</li>
      <li>Union-Find / Disjoint Set Union (DSU)</li>
      <li>Dynamic Programming: Memoization vs Tabulation</li>
      <li>DP Patterns: 0/1 Knapsack, LCS, LIS, Coin Change, Matrix Chain Multiplication</li>
      <li>DP on Trees, DP on Graphs, Bitmask DP</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🐍 Module 4 — Advanced Python</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Generators & Iterators: yield, send, throw, Generator expressions</li>
      <li>Decorators: Function decorators, Class decorators, functools.wraps, @cache</li>
      <li>Context Managers: with statement, __enter__/__exit__, contextlib</li>
      <li>Concurrency: Threading, Multiprocessing, GIL understanding</li>
      <li>AsyncIO: async/await, Event Loop, Coroutines, Tasks, aiohttp</li>
      <li>Design Patterns: Singleton, Factory, Observer, Strategy, Builder</li>
      <li>Python internals: Memory Management, Garbage Collection, CPython basics</li>
      <li>Performance: Profiling (cProfile, line_profiler), Optimization techniques</li>
    </ul>
  </div>
</div>`,
  },

  // ─────────────────────────────────────────────
  // C13 — ANDROID DEVELOPMENT
  // ─────────────────────────────────────────────
  {
    id: 'c13',
    title: 'Android Development',
    slug: 'android-development',
    price: 20000,
    salePrice: 20000,
    pricing: {
      effectivePrice: 20000,
      displayOriginalPrice: 20000,
      discountPercent: 0,
      hasFlashSale: false,
    },
    description:
      'India mein 600 million+ Android users hain — aur apps ki demand kabhi khatam nahi hoti. Kotlin aur Jetpack Compose ke saath modern Android apps banana seekhein — MVVM architecture, Firebase integration, REST APIs, Room DB, aur Google Play Store publishing. 2 mahine mein industry-ready developer banein.',
    shortDescription:
      'Kotlin + Jetpack Compose se professional Android apps banayein aur Play Store par publish karein.',
    duration: '2 Months',
    language: 'Hindi',
    isFree: false,
    category: 'Mobile Development',
    coverImage: '/c-android-dev.png',
    rating: 4.7,
    ratingCount: 360,
    learnerCount: 1700,
    instructor: {
      name: 'Rishabh Mishra',
      title: 'Android Developer | 50+ Apps Published',
      avatar: '/instructors/rishabh.png',
    },
    highlights: [
      '3 Complete Android App Projects',
      'Real Device Testing',
      'Play Store Publishing Walkthrough',
      'Firebase Integration Lab',
      'Source Code Provided',
    ],
    prerequisites: [
      'Basic programming knowledge (any language)',
      'Laptop with Android Studio installed',
    ],
    benefits: [
      'Kotlin — Modern Android Language',
      'Jetpack Compose — Declarative UI',
      'MVVM Architecture Pattern',
      'Room Database — Local Storage',
      'Retrofit — REST API Integration',
      'Firebase — Auth, Firestore, FCM',
      'Google Maps & Location APIs',
      'Google Play Store Publishing',
    ],
    skillsGained: [
      'Kotlin',
      'Jetpack Compose',
      'MVVM',
      'Firebase',
      'REST APIs',
      'Android Architecture',
    ],
    curriculumText: `
<div class="space-y-6">
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">📱 Module 1 — Kotlin & Android Fundamentals</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Kotlin Basics: Variables, Null Safety, Data Classes, Sealed Classes, Enums</li>
      <li>Kotlin OOPs: Inheritance, Interfaces, Object declarations, Companion Objects</li>
      <li>Kotlin Functional: Higher-order functions, Lambdas, Extension Functions</li>
      <li>Coroutines: suspend functions, launch, async, Dispatchers, Flow</li>
      <li>Android Studio: Project Structure, Gradle, Logcat, Layout Editor</li>
      <li>Jetpack Compose Basics: Composables, Preview, State, Recomposition</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🎨 Module 2 — Jetpack Compose UI</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Compose Layouts: Column, Row, Box, LazyColumn, LazyRow, Grid</li>
      <li>Material3 Components: TopBar, BottomBar, NavigationDrawer, FAB, Dialog</li>
      <li>State Management: remember, rememberSaveable, State Hoisting</li>
      <li>Navigation Component: NavHost, NavController, Passing arguments</li>
      <li>Animations: AnimatedVisibility, animateContentSize, Shared Element Transition</li>
      <li>Custom Composables, Theming, Dark Mode support</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🏛️ Module 3 — Architecture & Data</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>MVVM Architecture: ViewModel, LiveData, StateFlow, UiState pattern</li>
      <li>Repository Pattern, Dependency Injection with Hilt</li>
      <li>Room Database: Entity, DAO, Database, TypeConverters, Migrations</li>
      <li>DataStore: Preferences DataStore for user settings</li>
      <li>Retrofit: API calls, Gson/Moshi parsing, Interceptors, Error handling</li>
      <li>OkHttp: Logging Interceptor, Caching, Authentication headers</li>
      <li>Coil: Image loading, Caching, Placeholder handling</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🔥 Module 4 — Firebase & Publishing</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Firebase Authentication: Email/Password, Google Sign-In, Phone OTP</li>
      <li>Cloud Firestore: CRUD, Real-time listeners, Queries, Security Rules</li>
      <li>Firebase Storage: File upload/download, Image storage</li>
      <li>Firebase Cloud Messaging (FCM): Push notifications, Topics, Data messages</li>
      <li>Google Maps SDK: Marker, Polyline, Current Location, Directions API</li>
      <li>Google Play Store: App signing, Release tracks, Store listing optimization</li>
      <li>Projects: News App, Chat App with Firebase, Recipe App with REST API</li>
    </ul>
  </div>
</div>`,
  },

  // ─────────────────────────────────────────────
  // C14 — FLUTTER APPLICATION DEVELOPMENT
  // ─────────────────────────────────────────────
  {
    id: 'c14',
    title: 'Flutter Application Development',
    slug: 'flutter-application-development',
    price: 20000,
    salePrice: 20000,
    pricing: {
      effectivePrice: 20000,
      displayOriginalPrice: 20000,
      discountPercent: 0,
      hasFlashSale: false,
    },
    description:
      'Ek codebase, teen platforms — Android, iOS, aur Web. Flutter aaj cross-platform development ka future hai. Dart programming se shuru hokar, beautiful widget-based UIs, advanced state management (BLoC, Riverpod), aur Firebase backend ke saath aap production-ready apps banayenge. 2 mahine mein cross-platform developer banein.',
    shortDescription:
      'Flutter + Dart se Android, iOS, aur Web apps ek saath banayein — cross-platform developer banein.',
    duration: '2 Months',
    language: 'Hindi',
    isFree: false,
    category: 'Mobile Development',
    coverImage: '/c-flutter-dev.png',
    rating: 4.8,
    ratingCount: 410,
    learnerCount: 1900,
    instructor: {
      name: 'Rishabh Mishra',
      title: 'Flutter Developer | Cross-Platform Expert',
      avatar: '/instructors/rishabh.png',
    },
    highlights: [
      'Android + iOS + Web from One Codebase',
      '4 Complete Flutter App Projects',
      'BLoC & Riverpod State Management',
      'App Store + Play Store Publishing',
      'Firebase Integration Included',
    ],
    prerequisites: [
      'Basic programming concepts',
      'OOPs understanding (any language)',
    ],
    benefits: [
      'Dart Programming — Complete Language',
      'Flutter Widget System — Stateless & Stateful',
      'Custom Animations & Transitions',
      'State Management — Provider, Riverpod, BLoC',
      'Firebase — Auth, Firestore, Storage',
      'REST API Integration with Dio',
      'Local Storage — Hive, SharedPreferences',
      'Android + iOS + Web Deployment',
    ],
    skillsGained: [
      'Dart',
      'Flutter UI',
      'BLoC Pattern',
      'Riverpod',
      'Firebase',
      'Cross-platform Dev',
    ],
    curriculumText: `
<div class="space-y-6">
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🎯 Module 1 — Dart Programming</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Dart Basics: Variables, Data Types, Null Safety (?? and ! operators)</li>
      <li>Control Flow, Functions, Named & Optional Parameters</li>
      <li>OOPs: Classes, Constructors, Inheritance, Mixins, Abstract Classes</li>
      <li>Collections: List, Map, Set with generics</li>
      <li>Async Programming: Future, async/await, Stream, StreamController</li>
      <li>Error Handling: try-catch-finally, Custom Exceptions</li>
      <li>Functional Dart: Higher-order functions, Closures, Cascade notation (..)</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🐦 Module 2 — Flutter UI Fundamentals</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Flutter Architecture: Widget tree, Element tree, Render tree</li>
      <li>Stateless vs Stateful Widgets, setState, Widget lifecycle</li>
      <li>Layout Widgets: Container, Row, Column, Stack, Expanded, Flexible</li>
      <li>Scrollable Widgets: ListView, GridView, CustomScrollView, Slivers</li>
      <li>Material & Cupertino Design: AppBar, Drawer, BottomSheet, Dialog, SnackBar</li>
      <li>Forms & Validation: TextFormField, FormKey, Custom validators</li>
      <li>Custom Widgets, InheritedWidget, ThemeData, Dark Mode</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🎬 Module 3 — Navigation & Animations</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Navigation: Navigator 1.0, GoRouter (Navigator 2.0), Deep Links</li>
      <li>Passing data between screens, Named routes, Route Guards</li>
      <li>Implicit Animations: AnimatedContainer, AnimatedOpacity, TweenAnimationBuilder</li>
      <li>Explicit Animations: AnimationController, Tween, CurvedAnimation</li>
      <li>Hero Animations, Page Transitions, Lottie Animations</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">⚙️ Module 4 — State Management</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Provider: ChangeNotifier, Consumer, MultiProvider — basic state management</li>
      <li>Riverpod: StateProvider, FutureProvider, StreamProvider, StateNotifierProvider</li>
      <li>BLoC Pattern: Events, States, Bloc class, BlocBuilder, BlocListener, BlocConsumer</li>
      <li>Cubit: Simplified BLoC for straightforward state logic</li>
      <li>Choosing the right state management for your app architecture</li>
    </ul>
  </div>
  <div>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">🚀 Module 5 — Backend, APIs & Deployment</h3>
    <ul class="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
      <li>Dio: HTTP requests, Interceptors, Cancel tokens, Base Options</li>
      <li>JSON Parsing: jsonDecode, json_serializable, freezed package</li>
      <li>Firebase Auth: Email, Google, Phone Sign-in</li>
      <li>Cloud Firestore: CRUD, Real-time updates, Pagination, Offline support</li>
      <li>Firebase Storage: File upload with progress, Download URLs</li>
      <li>Local Storage: Hive (NoSQL), SharedPreferences, SQLite with sqflite</li>
      <li>Push Notifications: firebase_messaging, Local Notifications</li>
      <li>Build & Deploy: Android APK/AAB, iOS IPA (on Mac), Flutter Web build</li>
      <li>Projects: E-Commerce App, Chat App, News App, Expense Tracker</li>
    </ul>
  </div>
</div>`,
  },
];