// Mock job data for the Job Scanner feature
// TODO: Replace with real API/scraping data when integrating external job sources

export const mockJobs = [
    {
        id: 'job-1',
        title: 'Frontend Developer',
        company: 'TechCorp',
        location: 'Remote',
        type: 'Full-time',
        experience: 'Mid-level',
        shortDescription: 'Build and maintain responsive web interfaces using React, TypeScript, and modern CSS frameworks.',
        fullDescription: 'We are looking for a skilled Frontend Developer to join our product team. You will work closely with designers and backend engineers to build performant, accessible, and visually polished web applications.\n\nResponsibilities:\n• Develop new user-facing features using React and TypeScript\n• Build reusable components and front-end libraries for future use\n• Optimize components for maximum performance across devices\n• Collaborate with UX/UI designers to translate wireframes into high-quality code\n• Participate in code reviews and contribute to engineering best practices\n\nRequirements:\n• 3+ years of experience with React and modern JavaScript\n• Strong proficiency in HTML, CSS, and responsive design\n• Experience with state management (Redux, Zustand, or Context API)\n• Familiarity with RESTful APIs and GraphQL\n• Excellent problem-solving and communication skills',
        salary: '$90,000 – $120,000',
        tags: ['react', 'typescript', 'frontend', 'web', 'javascript', 'css', 'remote'],
        gradient: 'bg-gradient-to-br from-blue-400 to-cyan-600',
        postedDate: '2 days ago',
        urlPlaceholder: 'https://example.com/jobs/frontend-developer'
    },
    {
        id: 'job-2',
        title: 'UX/UI Designer',
        company: 'DesignHub',
        location: 'New York, NY',
        type: 'Full-time',
        experience: 'Senior',
        shortDescription: 'Lead product design for a fast-growing SaaS platform, from wireframes to high-fidelity prototypes.',
        fullDescription: 'DesignHub is seeking a Senior UX/UI Designer to own the end-to-end design process for our flagship product. You will shape how thousands of users interact with our platform daily.\n\nResponsibilities:\n• Lead the design of new features from concept to launch\n• Conduct user research, usability testing, and competitive analysis\n• Create wireframes, prototypes, and high-fidelity mockups in Figma\n• Establish and maintain a scalable design system\n• Collaborate with product managers and engineers to deliver seamless experiences\n\nRequirements:\n• 5+ years of UX/UI design experience for digital products\n• Expert proficiency in Figma and prototyping tools\n• Strong portfolio demonstrating user-centered design thinking\n• Experience with design systems and component libraries\n• Ability to articulate design decisions with data and user insights',
        salary: '$110,000 – $145,000',
        tags: ['design', 'ux', 'ui', 'figma', 'product', 'saas'],
        gradient: 'bg-gradient-to-br from-purple-400 to-pink-500',
        postedDate: '1 day ago',
        urlPlaceholder: 'https://example.com/jobs/ux-ui-designer'
    },
    {
        id: 'job-3',
        title: 'Backend Engineer',
        company: 'CloudScale',
        location: 'San Francisco, CA',
        type: 'Full-time',
        experience: 'Senior',
        shortDescription: 'Design and scale distributed backend services handling millions of requests per day.',
        fullDescription: 'CloudScale is building the next generation of cloud infrastructure. We need a Backend Engineer who thrives on solving complex distributed systems challenges.\n\nResponsibilities:\n• Design, build, and maintain scalable microservices in Node.js and Go\n• Optimize database performance across PostgreSQL and Redis\n• Implement robust APIs with authentication, rate limiting, and monitoring\n• Drive architecture decisions for high-availability systems\n• Mentor junior engineers and lead technical design reviews\n\nRequirements:\n• 5+ years of backend development experience\n• Proficiency in Node.js, Python, or Go\n• Deep understanding of databases, caching, and message queues\n• Experience with AWS/GCP cloud services and containerization\n• Track record of building systems at scale',
        salary: '$140,000 – $180,000',
        tags: ['backend', 'node', 'go', 'distributed', 'cloud', 'api', 'microservices'],
        gradient: 'bg-gradient-to-br from-green-400 to-emerald-600',
        postedDate: '3 days ago',
        urlPlaceholder: 'https://example.com/jobs/backend-engineer'
    },
    {
        id: 'job-4',
        title: 'Product Manager',
        company: 'InnovateLabs',
        location: 'London, UK',
        type: 'Full-time',
        experience: 'Mid-level',
        shortDescription: 'Drive product strategy and roadmap for an AI-powered analytics platform serving enterprise clients.',
        fullDescription: 'InnovateLabs is looking for a Product Manager to lead our core analytics product. You will define the product vision, work closely with engineering, and ensure we are building what matters most for our customers.\n\nResponsibilities:\n• Define and prioritise the product roadmap based on user research and business goals\n• Write clear product requirements and user stories\n• Analyse product metrics and make data-driven decisions\n• Coordinate cross-functional teams across engineering, design, and marketing\n• Engage directly with enterprise customers to gather feedback\n\nRequirements:\n• 3+ years of product management experience in B2B SaaS\n• Strong analytical skills and familiarity with product analytics tools\n• Excellent written and verbal communication\n• Experience working with technical teams and understanding of APIs\n• Background in AI/ML products is a plus',
        salary: '£75,000 – £95,000',
        tags: ['product', 'manager', 'analytics', 'ai', 'saas', 'enterprise', 'strategy'],
        gradient: 'bg-gradient-to-br from-amber-400 to-orange-600',
        postedDate: '5 days ago',
        urlPlaceholder: 'https://example.com/jobs/product-manager'
    },
    {
        id: 'job-5',
        title: 'Data Scientist',
        company: 'DataVault',
        location: 'Remote',
        type: 'Full-time',
        experience: 'Mid-level',
        shortDescription: 'Develop machine learning models and data pipelines to power intelligent product features.',
        fullDescription: 'DataVault is hiring a Data Scientist to turn complex datasets into actionable intelligence. You will be embedded in the product team and directly influence feature decisions.\n\nResponsibilities:\n• Build and deploy ML models for classification, recommendation, and NLP tasks\n• Design and maintain data pipelines using Python and SQL\n• Perform exploratory data analysis and communicate findings to stakeholders\n• A/B test product features and measure impact\n• Stay current with research and propose new approaches\n\nRequirements:\n• 3+ years of experience in data science or machine learning\n• Strong proficiency in Python, pandas, scikit-learn, and SQL\n• Experience with deep learning frameworks (PyTorch or TensorFlow)\n• Solid understanding of statistics and experimental design\n• MS or PhD in a quantitative field preferred',
        salary: '$115,000 – $150,000',
        tags: ['data', 'science', 'machine-learning', 'python', 'ml', 'ai', 'remote'],
        gradient: 'bg-gradient-to-br from-indigo-400 to-violet-600',
        postedDate: '1 week ago',
        urlPlaceholder: 'https://example.com/jobs/data-scientist'
    },
    {
        id: 'job-6',
        title: 'Mobile Developer',
        company: 'AppWorks',
        location: 'Berlin, Germany',
        type: 'Full-time',
        experience: 'Mid-level',
        shortDescription: 'Build cross-platform mobile applications using React Native for a fintech startup.',
        fullDescription: 'AppWorks is a fintech startup building the future of personal finance. We are looking for a Mobile Developer to help ship a beautiful, reliable mobile app to millions of users.\n\nResponsibilities:\n• Develop and ship new features for iOS and Android using React Native\n• Collaborate with backend engineers on API integration\n• Implement smooth animations and native-feeling interactions\n• Write unit and integration tests to ensure app reliability\n• Participate in app store submission and release management\n\nRequirements:\n• 3+ years of mobile development experience (React Native preferred)\n• Familiarity with native iOS/Android development concepts\n• Experience with state management in mobile apps\n• Understanding of mobile UX patterns and accessibility\n• Interest in fintech and personal finance',
        salary: '€65,000 – €85,000',
        tags: ['mobile', 'react-native', 'ios', 'android', 'fintech', 'app'],
        gradient: 'bg-gradient-to-br from-teal-400 to-cyan-600',
        postedDate: '4 days ago',
        urlPlaceholder: 'https://example.com/jobs/mobile-developer'
    },
    {
        id: 'job-7',
        title: 'DevOps Engineer',
        company: 'ServerPro',
        location: 'Austin, TX',
        type: 'Full-time',
        experience: 'Senior',
        shortDescription: 'Architect and manage CI/CD pipelines, Kubernetes clusters, and cloud infrastructure at scale.',
        fullDescription: 'ServerPro provides managed infrastructure to hundreds of companies. We need a DevOps Engineer who can build and maintain reliable, automated deployment systems.\n\nResponsibilities:\n• Design and maintain CI/CD pipelines for multiple services\n• Manage Kubernetes clusters and container orchestration\n• Automate infrastructure provisioning with Terraform and Ansible\n• Implement monitoring, alerting, and incident response procedures\n• Ensure security best practices across all environments\n\nRequirements:\n• 5+ years of DevOps or SRE experience\n• Expert-level knowledge of Kubernetes, Docker, and Helm\n• Proficiency with Terraform, CI/CD tools (GitHub Actions, Jenkins, GitLab)\n• Experience with AWS, GCP, or Azure at production scale\n• Strong scripting skills in Bash and Python',
        salary: '$130,000 – $165,000',
        tags: ['devops', 'kubernetes', 'docker', 'ci/cd', 'cloud', 'infrastructure', 'terraform'],
        gradient: 'bg-gradient-to-br from-red-400 to-rose-600',
        postedDate: '6 days ago',
        urlPlaceholder: 'https://example.com/jobs/devops-engineer'
    },
    {
        id: 'job-8',
        title: 'Full Stack Developer',
        company: 'WebFlow',
        location: 'Toronto, Canada',
        type: 'Contract',
        experience: 'Mid-level',
        shortDescription: 'Join a lean team building a no-code website builder with React, Node.js, and PostgreSQL.',
        fullDescription: 'WebFlow is creating a powerful yet simple website builder for small businesses. We are looking for a Full Stack Developer to help us ship new capabilities quickly.\n\nResponsibilities:\n• Build full-stack features spanning the React frontend and Node.js backend\n• Design and implement database schemas in PostgreSQL\n• Integrate third-party services (payments, email, analytics)\n• Write clean, well-tested code with high coverage\n• Contribute to architecture and technical decision-making\n\nRequirements:\n• 3+ years of full-stack development experience\n• Proficiency in React, Node.js, and PostgreSQL\n• Experience building and consuming RESTful APIs\n• Familiarity with cloud deployment (Vercel, AWS, or similar)\n• Strong attention to detail and product thinking',
        salary: 'CAD $85/hr',
        tags: ['fullstack', 'react', 'node', 'postgresql', 'web', 'contract', 'developer'],
        gradient: 'bg-gradient-to-br from-sky-400 to-blue-600',
        postedDate: '2 days ago',
        urlPlaceholder: 'https://example.com/jobs/full-stack-developer'
    },
    {
        id: 'job-9',
        title: 'Marketing Manager',
        company: 'GrowthHQ',
        location: 'Remote',
        type: 'Full-time',
        experience: 'Mid-level',
        shortDescription: 'Lead growth marketing campaigns and user acquisition strategies for a B2C SaaS product.',
        fullDescription: 'GrowthHQ helps companies scale their marketing. We are looking for a Marketing Manager to own our user acquisition funnel and drive measurable growth.\n\nResponsibilities:\n• Plan and execute multi-channel marketing campaigns (paid, organic, email)\n• Manage marketing budgets and optimise spend for ROI\n• Analyse campaign performance using analytics tools\n• Collaborate with content, design, and product teams\n• Develop and test creative strategies for user engagement and retention\n\nRequirements:\n• 3+ years of growth or digital marketing experience\n• Experience with Google Ads, Meta Ads, and marketing automation tools\n• Strong analytical skills and familiarity with GA4 or Mixpanel\n• Excellent copywriting and communication abilities\n• Data-driven mindset with a bias for experimentation',
        salary: '$80,000 – $105,000',
        tags: ['marketing', 'growth', 'manager', 'digital', 'campaigns', 'remote', 'saas'],
        gradient: 'bg-gradient-to-br from-lime-400 to-green-600',
        postedDate: '3 days ago',
        urlPlaceholder: 'https://example.com/jobs/marketing-manager'
    },
    {
        id: 'job-10',
        title: 'AI/ML Engineer',
        company: 'NeuralNet',
        location: 'Singapore',
        type: 'Full-time',
        experience: 'Senior',
        shortDescription: 'Research and deploy large language models and computer vision systems for production applications.',
        fullDescription: 'NeuralNet is an AI-first company building cutting-edge intelligent systems. We need an AI/ML Engineer who can bridge the gap between research and production.\n\nResponsibilities:\n• Develop and fine-tune large language models for domain-specific tasks\n• Build production ML pipelines with monitoring and versioning\n• Conduct experiments, evaluate model performance, and iterate rapidly\n• Optimise model inference for latency and cost\n• Collaborate with product and engineering on AI feature development\n\nRequirements:\n• 5+ years of ML engineering experience\n• Expertise in PyTorch, Hugging Face Transformers, and model fine-tuning\n• Experience deploying models at scale (MLflow, SageMaker, or similar)\n• Strong foundation in NLP, computer vision, or generative AI\n• Published research or open-source contributions are a plus',
        salary: 'SGD $140,000 – $200,000',
        tags: ['ai', 'ml', 'machine-learning', 'llm', 'deep-learning', 'python', 'engineer'],
        gradient: 'bg-gradient-to-br from-fuchsia-400 to-purple-700',
        postedDate: '1 day ago',
        urlPlaceholder: 'https://example.com/jobs/ai-ml-engineer'
    }
]

/**
 * Simulates a job search with keyword filtering and artificial delay.
 * TODO: Replace with real API call to job search backend or AI-powered scraping service
 */
export const searchJobs = (query) => {
    return new Promise((resolve) => {
        const delay = 800 + Math.random() * 700
        setTimeout(() => {
            if (!query || !query.trim()) {
                resolve([])
                return
            }

            const normalizedQuery = query.toLowerCase().trim()
            const results = mockJobs.filter((job) => {
                const searchableText = [
                    job.title,
                    job.company,
                    job.location,
                    job.shortDescription,
                    job.type,
                    job.experience,
                    ...job.tags
                ]
                    .join(' ')
                    .toLowerCase()

                return normalizedQuery.split(/\s+/).every((word) => searchableText.includes(word))
            })

            resolve(results)
        }, delay)
    })
}

/**
 * Retrieves a single job by ID from mock data.
 * TODO: Replace with real API call when backend is ready
 */
export const getJobById = (id) => {
    return mockJobs.find((job) => job.id === id) || null
}
