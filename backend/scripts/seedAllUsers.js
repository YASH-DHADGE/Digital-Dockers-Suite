const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

const users = [
    {
        fullName: 'Admin User',
        email: 'admin@digitalDockers.com',
        password: 'admin123',
        role: 'admin',
        department: 'Administration',
        profileInfo: {
            skills: ['Leadership', 'Strategic Planning', 'Budget Management', 'Team Management']
        }
    },
    {
        fullName: 'Sarah Johnson',
        email: 'sarah.pm@digitalDockers.com',
        password: 'pm123',
        role: 'project_manager',
        department: 'Project Management',
        profileInfo: {
            skills: ['Agile', 'Scrum', 'JIRA', 'Risk Management', 'Stakeholder Management']
        }
    },
    {
        fullName: 'Yash Dhadge',
        email: 'yash.dhadge_comp23@pccoer.in',
        password: '123',
        role: 'technical_team',
        department: 'Engineering',
        profileInfo: {
            skills: ['React', 'Node.js', 'MongoDB', 'JavaScript', 'REST APIs']
        }
    },
    {
        fullName: 'Emily Chen',
        email: 'emily.marketing@digitalDockers.com',
        password: 'marketing123',
        role: 'marketing_team',
        department: 'Marketing',
        profileInfo: {
            skills: ['Content Marketing', 'Social Media', 'SEO', 'Email Marketing', 'Analytics']
        }
    },
    {
        fullName: 'Michael Brown',
        email: 'michael.lead@digitalDockers.com',
        password: 'lead123',
        role: 'technical_lead',
        department: 'Engineering',
        profileInfo: {
            skills: ['React', 'Django', 'Python', 'System Design', 'Code Review', 'Mentoring']
        }
    },
    {
        fullName: 'Jessica Davis',
        email: 'jessica.mlead@digitalDockers.com',
        password: 'mlead123',
        role: 'marketing_lead',
        department: 'Marketing',
        profileInfo: {
            skills: ['Brand Strategy', 'Campaign Management', 'Digital Marketing', 'Team Leadership', 'Market Analysis']
        }
    },
    // ========== 10 NEW TEAM MEMBERS ==========
    {
        fullName: 'David Kumar',
        email: 'david.kumar@digitalDockers.com',
        password: 'tech123',
        role: 'technical_team',
        department: 'Engineering',
        profileInfo: {
            skills: ['React', 'Vue.js', 'TypeScript', 'Webpack', 'CSS', 'Testing']
        }
    },
    {
        fullName: 'Priya Sharma',
        email: 'priya.sharma@digitalDockers.com',
        password: 'tech123',
        role: 'technical_team',
        department: 'Engineering',
        profileInfo: {
            skills: ['Django', 'Flask', 'Python', 'PostgreSQL', 'REST APIs', 'Docker']
        }
    },
    {
        fullName: 'Alex Rodriguez',
        email: 'alex.rodriguez@digitalDockers.com',
        password: 'tech123',
        role: 'technical_team',
        department: 'Engineering',
        profileInfo: {
            skills: ['React', 'Node.js', 'AWS', 'Docker', 'CI/CD', 'Microservices']
        }
    },
    {
        fullName: 'Sophie Laurent',
        email: 'sophie.laurent@digitalDockers.com',
        password: 'tech123',
        role: 'technical_team',
        department: 'Engineering',
        profileInfo: {
            skills: ['LLM', 'Python', 'TensorFlow', 'NLP', 'Machine Learning', 'GenAI']
        }
    },
    {
        fullName: 'Jake Wilson',
        email: 'jake.wilson@digitalDockers.com',
        password: 'market123',
        role: 'marketing_team',
        department: 'Marketing',
        profileInfo: {
            skills: ['Paid Advertising', 'Google Ads', 'Facebook Ads', 'Conversion Rate Optimization', 'Analytics']
        }
    },
    {
        fullName: 'Maya Patel',
        email: 'maya.patel@digitalDockers.com',
        password: 'market123',
        role: 'marketing_team',
        department: 'Marketing',
        profileInfo: {
            skills: ['Content Creation', 'Copywriting', 'Social Media Strategy', 'Influencer Marketing', 'Branding']
        }
    },
    {
        fullName: 'Chris Anderson',
        email: 'chris.anderson@digitalDockers.com',
        password: 'pm123',
        role: 'project_manager',
        department: 'Project Management',
        profileInfo: {
            skills: ['Agile', 'Kanban', 'Budget Planning', 'Communication', 'Conflict Resolution']
        }
    },
    {
        fullName: 'Lisa Wong',
        email: 'lisa.wong@digitalDockers.com',
        password: 'pm123',
        role: 'project_manager',
        department: 'Project Management',
        profileInfo: {
            skills: ['Scrum', 'Requirements Gathering', 'Process Improvement', 'Documentation', 'Team Coordination']
        }
    },
    {
        fullName: 'Marcus Thompson',
        email: 'marcus.thompson@digitalDockers.com',
        password: 'tech123',
        role: 'technical_team',
        department: 'Engineering',
        profileInfo: {
            skills: ['LLM', 'Langchain', 'OpenAI', 'Prompt Engineering', 'Machine Learning', 'Python']
        }
    },
    {
        fullName: 'Olivia Green',
        email: 'olivia.green@digitalDockers.com',
        password: 'design123',
        role: 'marketing_team',
        department: 'Design',
        profileInfo: {
            skills: ['UI Design', 'UX Research', 'Figma', 'Prototyping', 'User Testing', 'Web Design']
        }
    },
];

const seedAllUsers = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/digital-dockers');
        console.log('MongoDB Connected');

        // Clear existing users (optional - comment out if you want to keep existing users)
        // await User.deleteMany({});
        // console.log('Cleared existing users');

        // Create users
        for (const userData of users) {
            const existingUser = await User.findOne({ email: userData.email });

            if (existingUser) {
                console.log(`✓ User already exists: ${userData.email}`);
                continue;
            }

            const user = new User({
                ...userData,
                preferences: {
                    notifications: true,
                    theme: 'light'
                }
            });

            await user.save();
            console.log(`✅ Created user: ${userData.email} (${userData.role})`);
        }

        console.log('\n=== LOGIN CREDENTIALS ===\n');
        console.log('Admin Dashboard:');
        console.log('  Email: admin@digitalDockers.com');
        console.log('  Password: admin123\n');

        console.log('Project Manager Dashboard:');
        console.log('  Email: sarah.pm@digitalDockers.com');
        console.log('  Password: pm123\n');

        console.log('Technical Team Dashboard:');
        console.log('  Email: yash.dhadge_comp23@pccoer.in');
        console.log('  Password: 123\n');

        console.log('Marketing Team Dashboard:');
        console.log('  Email: emily.marketing@digitalDockers.com');
        console.log('  Password: marketing123\n');

        console.log('Technical Lead Dashboard:');
        console.log('  Email: michael.lead@digitalDockers.com');
        console.log('  Password: lead123\n');

        console.log('Marketing Lead Dashboard:');
        console.log('  Email: jessica.mlead@digitalDockers.com');
        console.log('  Password: mlead123\n');

        console.log('\n=== NEW TEAM MEMBERS (10 ADDED) ===\n');
        
        console.log('Technical Team Members:');
        console.log('  1. Email: david.kumar@digitalDockers.com | Password: tech123 | Skills: React, Vue.js, TypeScript, Webpack, CSS, Testing');
        console.log('  2. Email: priya.sharma@digitalDockers.com | Password: tech123 | Skills: Django, Flask, Python, PostgreSQL, REST APIs, Docker');
        console.log('  3. Email: alex.rodriguez@digitalDockers.com | Password: tech123 | Skills: React, Node.js, AWS, Docker, CI/CD, Microservices');
        console.log('  4. Email: sophie.laurent@digitalDockers.com | Password: tech123 | Skills: LLM, Python, TensorFlow, NLP, Machine Learning, GenAI');
        console.log('  5. Email: marcus.thompson@digitalDockers.com | Password: tech123 | Skills: LLM, Langchain, OpenAI, Prompt Engineering, Machine Learning, Python\n');

        console.log('Marketing Team Members:');
        console.log('  1. Email: jake.wilson@digitalDockers.com | Password: market123 | Skills: Paid Advertising, Google Ads, Facebook Ads, CRO, Analytics');
        console.log('  2. Email: maya.patel@digitalDockers.com | Password: market123 | Skills: Content Creation, Copywriting, Social Media Strategy, Influencer Marketing, Branding');
        console.log('  3. Email: olivia.green@digitalDockers.com | Password: design123 | Skills: UI Design, UX Research, Figma, Prototyping, User Testing, Web Design\n');

        console.log('Project Manager Team Members:');
        console.log('  1. Email: chris.anderson@digitalDockers.com | Password: pm123 | Skills: Agile, Kanban, Budget Planning, Communication, Conflict Resolution');
        console.log('  2. Email: lisa.wong@digitalDockers.com | Password: pm123 | Skills: Scrum, Requirements Gathering, Process Improvement, Documentation, Team Coordination\n');

        console.log('=== SKILLS SUMMARY ===');
        console.log('React Developers: Yash Dhadge, Michael Brown (Lead), David Kumar, Alex Rodriguez');
        console.log('Flask/Django Developers: Michael Brown (Lead), Priya Sharma');
        console.log('LLM Specialists: Sophie Laurent, Marcus Thompson');
        console.log('Marketing Experts: Emily Chen, Jessica Davis (Lead), Jake Wilson, Maya Patel\n');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
};

seedAllUsers();
