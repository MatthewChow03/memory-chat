// Synthetic ChatGPT History Data Generator
class ChatGPTDataGenerator {
    constructor() {
        this.topics = {
            programming: {
                categories: ['JavaScript', 'Python', 'React', 'Node.js', 'Database', 'API', 'Algorithms', 'Web Development', 'Mobile Development', 'DevOps'],
                keywords: ['code', 'function', 'variable', 'loop', 'array', 'object', 'class', 'method', 'bug', 'debug', 'deploy', 'git', 'npm', 'package', 'framework', 'library', 'component', 'state', 'props', 'hook', 'async', 'promise', 'callback', 'database', 'query', 'schema', 'index', 'optimization', 'performance', 'security', 'authentication', 'authorization']
            },
            writing: {
                categories: ['Creative Writing', 'Academic Writing', 'Business Writing', 'Technical Writing', 'Poetry', 'Fiction', 'Non-fiction', 'Blog Writing', 'Copywriting', 'Editing'],
                keywords: ['story', 'character', 'plot', 'theme', 'narrative', 'dialogue', 'description', 'metaphor', 'simile', 'rhyme', 'meter', 'stanza', 'paragraph', 'sentence', 'grammar', 'punctuation', 'style', 'tone', 'voice', 'audience', 'purpose', 'structure', 'outline', 'draft', 'revise', 'edit', 'proofread', 'publish', 'format', 'citation', 'reference']
            },
            learning: {
                categories: ['Mathematics', 'Science', 'History', 'Literature', 'Philosophy', 'Psychology', 'Economics', 'Art', 'Music', 'Language Learning'],
                keywords: ['study', 'learn', 'understand', 'explain', 'concept', 'theory', 'principle', 'formula', 'equation', 'calculation', 'analysis', 'research', 'experiment', 'hypothesis', 'conclusion', 'evidence', 'argument', 'debate', 'discussion', 'question', 'answer', 'example', 'practice', 'exercise', 'quiz', 'test', 'exam', 'grade', 'score', 'progress']
            },
            productivity: {
                categories: ['Time Management', 'Goal Setting', 'Habit Building', 'Project Management', 'Task Organization', 'Focus Techniques', 'Workflow Optimization', 'Team Collaboration', 'Communication', 'Leadership'],
                keywords: ['plan', 'schedule', 'organize', 'prioritize', 'deadline', 'goal', 'objective', 'target', 'milestone', 'progress', 'track', 'measure', 'evaluate', 'improve', 'optimize', 'efficiency', 'productivity', 'workflow', 'process', 'system', 'routine', 'habit', 'discipline', 'motivation', 'focus', 'concentration', 'distraction', 'interruption', 'break', 'rest']
            },
            health: {
                categories: ['Fitness', 'Nutrition', 'Mental Health', 'Sleep', 'Stress Management', 'Exercise', 'Diet', 'Wellness', 'Medical', 'Lifestyle'],
                keywords: ['exercise', 'workout', 'fitness', 'strength', 'cardio', 'flexibility', 'balance', 'nutrition', 'diet', 'calories', 'protein', 'vitamins', 'minerals', 'supplements', 'hydration', 'sleep', 'rest', 'recovery', 'stress', 'anxiety', 'depression', 'mental', 'emotional', 'physical', 'health', 'wellness', 'lifestyle', 'habit', 'routine', 'goal', 'progress']
            },
            technology: {
                categories: ['AI/ML', 'Blockchain', 'Cloud Computing', 'Cybersecurity', 'IoT', 'VR/AR', 'Quantum Computing', 'Robotics', 'Automation', 'Data Science'],
                keywords: ['artificial', 'intelligence', 'machine', 'learning', 'neural', 'network', 'algorithm', 'model', 'training', 'prediction', 'classification', 'regression', 'clustering', 'deep', 'reinforcement', 'supervised', 'unsupervised', 'data', 'dataset', 'feature', 'label', 'accuracy', 'precision', 'recall', 'f1', 'score', 'validation', 'testing', 'deployment', 'inference']
            },
            business: {
                categories: ['Marketing', 'Finance', 'Strategy', 'Operations', 'Human Resources', 'Sales', 'Customer Service', 'Entrepreneurship', 'Management', 'Analytics'],
                keywords: ['business', 'company', 'organization', 'strategy', 'plan', 'goal', 'objective', 'target', 'market', 'customer', 'client', 'product', 'service', 'price', 'cost', 'revenue', 'profit', 'loss', 'budget', 'finance', 'investment', 'funding', 'capital', 'cash', 'flow', 'growth', 'scale', 'expand', 'develop', 'launch', 'promote']
            },
            personal: {
                categories: ['Relationships', 'Family', 'Friendship', 'Dating', 'Communication', 'Conflict Resolution', 'Personal Growth', 'Self-Improvement', 'Life Advice', 'Decision Making'],
                keywords: ['relationship', 'friend', 'family', 'partner', 'love', 'dating', 'marriage', 'communication', 'conversation', 'discussion', 'argument', 'conflict', 'resolution', 'compromise', 'understanding', 'empathy', 'support', 'care', 'trust', 'honesty', 'loyalty', 'commitment', 'growth', 'development', 'improvement', 'change', 'decision', 'choice', 'option', 'consequence', 'outcome']
            }
        };

        this.userNames = ['Alex', 'Jordan', 'Casey', 'Taylor', 'Morgan', 'Riley', 'Quinn', 'Avery', 'Blake', 'Drew'];
        this.currentUser = this.userNames[Math.floor(Math.random() * this.userNames.length)];
    }

    generateMessage() {
        const topic = this.getRandomTopic();
        const category = this.getRandomCategory(topic);
        const keywords = this.topics[topic].keywords;
        
        const messageTypes = [
            this.generateQuestion.bind(this),
            this.generateRequest.bind(this),
            this.generateDiscussion.bind(this),
            this.generateProblem.bind(this),
            this.generateLearning.bind(this)
        ];

        const messageType = messageTypes[Math.floor(Math.random() * messageTypes.length)];
        const { input, output } = messageType(topic, category, keywords);

        return {
            id: this.generateId(),
            timestamp: this.generateTimestamp(),
            topic: topic,
            category: category,
            input: input,
            output: output,
            user: this.currentUser,
            tags: this.generateTags(topic, category, keywords),
            sentiment: this.generateSentiment(),
            complexity: this.generateComplexity()
        };
    }

    generateQuestion(topic, category, keywords) {
        const questions = [
            `Can you explain ${this.getRandomKeyword(keywords)} in the context of ${category.toLowerCase()}?`,
            `What are the best practices for ${this.getRandomKeyword(keywords)} when working with ${category.toLowerCase()}?`,
            `How do I implement ${this.getRandomKeyword(keywords)} in ${category.toLowerCase()}?`,
            `What's the difference between ${this.getRandomKeyword(keywords)} and ${this.getRandomKeyword(keywords)} in ${category.toLowerCase()}?`,
            `Could you help me understand ${this.getRandomKeyword(keywords)} for my ${category.toLowerCase()} project?`
        ];

        const responses = [
            `Great question! In ${category.toLowerCase()}, ${this.getRandomKeyword(keywords)} refers to... Here's a comprehensive explanation with examples...`,
            `When working with ${category.toLowerCase()}, ${this.getRandomKeyword(keywords)} is essential because... Let me break this down step by step...`,
            `To implement ${this.getRandomKeyword(keywords)} in ${category.toLowerCase()}, you'll need to consider... Here's a practical approach...`,
            `The key difference is that ${this.getRandomKeyword(keywords)} focuses on... while ${this.getRandomKeyword(keywords)} emphasizes... Let me illustrate this...`,
            `Understanding ${this.getRandomKeyword(keywords)} in ${category.toLowerCase()} involves... Here's how you can apply this concept...`
        ];

        return {
            input: questions[Math.floor(Math.random() * questions.length)],
            output: responses[Math.floor(Math.random() * responses.length)]
        };
    }

    generateRequest(topic, category, keywords) {
        const requests = [
            `Please help me create a ${this.getRandomKeyword(keywords)} for my ${category.toLowerCase()} project.`,
            `I need assistance with ${this.getRandomKeyword(keywords)} in ${category.toLowerCase()}. Can you provide guidance?`,
            `Could you review my ${category.toLowerCase()} work and suggest improvements for ${this.getRandomKeyword(keywords)}?`,
            `I'm struggling with ${this.getRandomKeyword(keywords)} in ${category.toLowerCase()}. Can you help me troubleshoot?`,
            `Please explain ${this.getRandomKeyword(keywords)} concepts in ${category.toLowerCase()} in simple terms.`
        ];

        const responses = [
            `I'd be happy to help you with ${this.getRandomKeyword(keywords)} in ${category.toLowerCase()}! Here's a detailed approach...`,
            `Let me guide you through ${this.getRandomKeyword(keywords)} for ${category.toLowerCase()}. First, let's understand the basics...`,
            `After reviewing your ${category.toLowerCase()} work, here are my suggestions for improving ${this.getRandomKeyword(keywords)}...`,
            `Let's troubleshoot your ${category.toLowerCase()} issue with ${this.getRandomKeyword(keywords)}. Here's a systematic approach...`,
            `I'll explain ${this.getRandomKeyword(keywords)} in ${category.toLowerCase()} using simple, clear language...`
        ];

        return {
            input: requests[Math.floor(Math.random() * requests.length)],
            output: responses[Math.floor(Math.random() * responses.length)]
        };
    }

    generateDiscussion(topic, category, keywords) {
        const discussions = [
            `I've been thinking about ${this.getRandomKeyword(keywords)} in ${category.toLowerCase()}. What are your thoughts on this approach?`,
            `There's a debate about ${this.getRandomKeyword(keywords)} vs ${this.getRandomKeyword(keywords)} in ${category.toLowerCase()}. What's your perspective?`,
            `I'm curious about the future of ${this.getRandomKeyword(keywords)} in ${category.toLowerCase()}. Where do you see this heading?`,
            `What do you think about the current trends in ${this.getRandomKeyword(keywords)} for ${category.toLowerCase()}?`,
            `I've noticed some interesting developments in ${this.getRandomKeyword(keywords)} within ${category.toLowerCase()}. Have you seen similar patterns?`
        ];

        const responses = [
            `That's a fascinating perspective on ${this.getRandomKeyword(keywords)} in ${category.toLowerCase()}! I think... Here's my analysis...`,
            `The debate between ${this.getRandomKeyword(keywords)} and ${this.getRandomKeyword(keywords)} in ${category.toLowerCase()} is indeed complex. My view is...`,
            `Looking at the future of ${this.getRandomKeyword(keywords)} in ${category.toLowerCase()}, I believe we'll see... Here's why...`,
            `The current trends in ${this.getRandomKeyword(keywords)} for ${category.toLowerCase()} are quite interesting. I observe...`,
            `You're absolutely right about the developments in ${this.getRandomKeyword(keywords)} within ${category.toLowerCase()}. I've noticed...`
        ];

        return {
            input: discussions[Math.floor(Math.random() * discussions.length)],
            output: responses[Math.floor(Math.random() * responses.length)]
        };
    }

    generateProblem(topic, category, keywords) {
        const problems = [
            `I'm having trouble with ${this.getRandomKeyword(keywords)} in my ${category.toLowerCase()} project. The issue is...`,
            `My ${category.toLowerCase()} code isn't working properly with ${this.getRandomKeyword(keywords)}. Here's what's happening...`,
            `I can't seem to understand ${this.getRandomKeyword(keywords)} in the context of ${category.toLowerCase()}. Can you help clarify?`,
            `There's an error in my ${category.toLowerCase()} implementation of ${this.getRandomKeyword(keywords)}. Here's the problem...`,
            `I'm stuck on ${this.getRandomKeyword(keywords)} for my ${category.toLowerCase()} assignment. Any suggestions?`
        ];

        const responses = [
            `I can help you troubleshoot the ${this.getRandomKeyword(keywords)} issue in your ${category.toLowerCase()} project. Let's analyze the problem...`,
            `The issue with ${this.getRandomKeyword(keywords)} in your ${category.toLowerCase()} code is likely due to... Here's how to fix it...`,
            `Let me clarify ${this.getRandomKeyword(keywords)} in the context of ${category.toLowerCase()}. The key concept is...`,
            `I can see the problem with your ${category.toLowerCase()} implementation of ${this.getRandomKeyword(keywords)}. The issue is...`,
            `Don't worry about being stuck on ${this.getRandomKeyword(keywords)} for your ${category.toLowerCase()} assignment. Let's work through this...`
        ];

        return {
            input: problems[Math.floor(Math.random() * problems.length)],
            output: responses[Math.floor(Math.random() * responses.length)]
        };
    }

    generateLearning(topic, category, keywords) {
        const learning = [
            `I want to learn more about ${this.getRandomKeyword(keywords)} in ${category.toLowerCase()}. Where should I start?`,
            `What are the fundamental concepts of ${this.getRandomKeyword(keywords)} that I should understand for ${category.toLowerCase()}?`,
            `I'm a beginner in ${category.toLowerCase()}. How do I approach learning ${this.getRandomKeyword(keywords)}?`,
            `Can you recommend resources for mastering ${this.getRandomKeyword(keywords)} in ${category.toLowerCase()}?`,
            `What's the learning path for becoming proficient in ${this.getRandomKeyword(keywords)} within ${category.toLowerCase()}?`
        ];

        const responses = [
            `Great choice to learn about ${this.getRandomKeyword(keywords)} in ${category.toLowerCase()}! Here's a structured learning path...`,
            `The fundamental concepts of ${this.getRandomKeyword(keywords)} for ${category.toLowerCase()} include... Let me break these down...`,
            `As a beginner in ${category.toLowerCase()}, I recommend starting with ${this.getRandomKeyword(keywords)} by... Here's a step-by-step approach...`,
            `For mastering ${this.getRandomKeyword(keywords)} in ${category.toLowerCase()}, I recommend these resources... Here's why each is valuable...`,
            `The learning path for ${this.getRandomKeyword(keywords)} in ${category.toLowerCase()} involves several stages... Let me outline this journey...`
        ];

        return {
            input: learning[Math.floor(Math.random() * learning.length)],
            output: responses[Math.floor(Math.random() * responses.length)]
        };
    }

    generateChat() {
        const chatId = this.generateId();
        const topic = this.getRandomTopic();
        const category = this.getRandomCategory(topic);
        const messageCount = Math.floor(Math.random() * 8) + 3; // 3-10 messages per chat
        const messages = [];

        for (let i = 0; i < messageCount; i++) {
            messages.push(this.generateMessage());
        }

        return {
            id: chatId,
            title: this.generateChatTitle(topic, category),
            topic: topic,
            category: category,
            messages: messages,
            timestamp: messages[0].timestamp,
            messageCount: messages.length,
            tags: this.generateChatTags(topic, category)
        };
    }

    generateChatTitle(topic, category) {
        const titles = {
            programming: [
                `${category} Development Help`,
                `${category} Code Review`,
                `${category} Best Practices`,
                `${category} Implementation Guide`,
                `${category} Troubleshooting`
            ],
            writing: [
                `${category} Writing Tips`,
                `${category} Content Creation`,
                `${category} Writing Workshop`,
                `${category} Style Guide`,
                `${category} Writing Process`
            ],
            learning: [
                `${category} Study Session`,
                `${category} Concept Explanation`,
                `${category} Learning Resources`,
                `${category} Academic Help`,
                `${category} Knowledge Building`
            ],
            productivity: [
                `${category} Strategy Session`,
                `${category} Workflow Optimization`,
                `${category} Goal Setting`,
                `${category} Time Management`,
                `${category} Productivity Tips`
            ],
            health: [
                `${category} Wellness Plan`,
                `${category} Health Goals`,
                `${category} Fitness Advice`,
                `${category} Nutrition Guidance`,
                `${category} Mental Health Support`
            ],
            technology: [
                `${category} Technology Discussion`,
                `${category} Innovation Talk`,
                `${category} Tech Trends`,
                `${category} Implementation Guide`,
                `${category} Future Outlook`
            ],
            business: [
                `${category} Business Strategy`,
                `${category} Market Analysis`,
                `${category} Growth Planning`,
                `${category} Operations Discussion`,
                `${category} Business Development`
            ],
            personal: [
                `${category} Personal Growth`,
                `${category} Life Advice`,
                `${category} Relationship Discussion`,
                `${category} Self-Improvement`,
                `${category} Decision Making`
            ]
        };

        const topicTitles = titles[topic] || titles.programming;
        return topicTitles[Math.floor(Math.random() * topicTitles.length)];
    }

    generateChatTags(topic, category) {
        const baseTags = [topic, category];
        const keywords = this.topics[topic].keywords;
        const additionalTags = [];
        
        for (let i = 0; i < 3; i++) {
            additionalTags.push(this.getRandomKeyword(keywords));
        }
        
        return [...baseTags, ...additionalTags];
    }

    generateTags(topic, category, keywords) {
        const tags = [topic, category];
        const keywordCount = Math.floor(Math.random() * 4) + 2; // 2-5 keywords
        
        for (let i = 0; i < keywordCount; i++) {
            tags.push(this.getRandomKeyword(keywords));
        }
        
        return [...new Set(tags)]; // Remove duplicates
    }

    getRandomTopic() {
        const topics = Object.keys(this.topics);
        return topics[Math.floor(Math.random() * topics.length)];
    }

    getRandomCategory(topic) {
        const categories = this.topics[topic].categories;
        return categories[Math.floor(Math.random() * categories.length)];
    }

    getRandomKeyword(keywords) {
        return keywords[Math.floor(Math.random() * keywords.length)];
    }

    generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9);
    }

    generateTimestamp() {
        const now = new Date();
        const daysAgo = Math.floor(Math.random() * 365); // Random day in the last year
        const hoursAgo = Math.floor(Math.random() * 24);
        const minutesAgo = Math.floor(Math.random() * 60);
        
        const timestamp = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000) - (minutesAgo * 60 * 1000));
        return timestamp.toISOString();
    }

    generateSentiment() {
        const sentiments = ['positive', 'neutral', 'negative', 'curious', 'frustrated', 'excited'];
        return sentiments[Math.floor(Math.random() * sentiments.length)];
    }

    generateComplexity() {
        const complexities = ['beginner', 'intermediate', 'advanced', 'expert'];
        return complexities[Math.floor(Math.random() * complexities.length)];
    }

    generateFullDataset() {
        const chats = [];
        const allMessages = [];
        
        // Generate approximately 50-60 chats to get around 500 messages
        const targetChats = 55;
        
        for (let i = 0; i < targetChats; i++) {
            const chat = this.generateChat();
            chats.push(chat);
            allMessages.push(...chat.messages);
        }
        
        // Ensure we have exactly 500 messages
        while (allMessages.length < 500) {
            const extraChat = this.generateChat();
            chats.push(extraChat);
            allMessages.push(...extraChat.messages);
        }
        
        // Trim to exactly 500 messages
        const trimmedMessages = allMessages.slice(0, 500);
        
        return {
            user: this.currentUser,
            chats: chats,
            messages: trimmedMessages,
            totalChats: chats.length,
            totalMessages: trimmedMessages.length,
            generatedAt: new Date().toISOString()
        };
    }
}

// Export for use in other files
window.ChatGPTDataGenerator = ChatGPTDataGenerator; 