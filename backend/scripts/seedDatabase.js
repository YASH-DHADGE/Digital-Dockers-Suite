const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import Models
const User = require('../models/User');
const Project = require('../models/Project');
const Sprint = require('../models/Sprint');
const Task = require('../models/Task');
const Team = require('../models/Team');

// ============================================================================
// EMPLOYEES DATA
// ============================================================================
const employees = [
    {
        fullName: 'Admin User',
        email: 'admin@digitalDockers.com',
        password: 'admin123',
        role: 'admin',
        department: 'Administration',
        profileInfo: { skills: ['Leadership', 'Strategic Planning', 'Budget Management'] }
    },
    {
        fullName: 'Sarah Johnson',
        email: 'sarah.pm@digitalDockers.com',
        password: 'pm123',
        role: 'project_manager',
        department: 'Project Management',
        profileInfo: { skills: ['Agile', 'Scrum', 'JIRA', 'Risk Management'] }
    },
    {
        fullName: 'Michael Brown',
        email: 'michael.lead@digitalDockers.com',
        password: 'lead123',
        role: 'technical_lead',
        department: 'Engineering',
        profileInfo: { skills: ['React', 'Node.js', 'System Design', 'Code Review'] }
    },
    {
        fullName: 'Jessica Davis',
        email: 'jessica.mlead@digitalDockers.com',
        password: 'mlead123',
        role: 'marketing_lead',
        department: 'Marketing',
        profileInfo: { skills: ['Brand Strategy', 'Digital Marketing', 'Analytics'] }
    },
    {
        fullName: 'David Kumar',
        email: 'david.kumar@digitalDockers.com',
        password: 'tech123',
        role: 'technical_team',
        department: 'Engineering',
        profileInfo: { skills: ['React', 'Vue.js', 'TypeScript', 'Testing'] }
    },
    {
        fullName: 'Priya Sharma',
        email: 'priya.sharma@digitalDockers.com',
        password: 'tech123',
        role: 'technical_team',
        department: 'Engineering',
        profileInfo: { skills: ['Django', 'Python', 'PostgreSQL', 'Docker'] }
    },
    {
        fullName: 'Alex Rodriguez',
        email: 'alex.rodriguez@digitalDockers.com',
        password: 'tech123',
        role: 'technical_team',
        department: 'Engineering',
        profileInfo: { skills: ['Node.js', 'AWS', 'CI/CD', 'Microservices'] }
    },
    {
        fullName: 'Sophie Laurent',
        email: 'sophie.laurent@digitalDockers.com',
        password: 'tech123',
        role: 'technical_team',
        department: 'Engineering',
        profileInfo: { skills: ['Machine Learning', 'Python', 'TensorFlow', 'NLP'] }
    },
    {
        fullName: 'Jake Wilson',
        email: 'jake.wilson@digitalDockers.com',
        password: 'market123',
        role: 'marketing_team',
        department: 'Marketing',
        profileInfo: { skills: ['Google Ads', 'Facebook Ads', 'Analytics'] }
    },
    {
        fullName: 'Maya Patel',
        email: 'maya.patel@digitalDockers.com',
        password: 'market123',
        role: 'marketing_team',
        department: 'Marketing',
        profileInfo: { skills: ['Content Creation', 'Social Media', 'Copywriting'] }
    },
    {
        fullName: 'Chris Anderson',
        email: 'chris.anderson@digitalDockers.com',
        password: 'pm123',
        role: 'project_manager',
        department: 'Project Management',
        profileInfo: { skills: ['Kanban', 'Budget Planning', 'Communication'] }
    },
    {
        fullName: 'Olivia Green',
        email: 'olivia.green@digitalDockers.com',
        password: 'design123',
        role: 'marketing_team',
        department: 'Design',
        profileInfo: { skills: ['UI Design', 'Figma', 'UX Research', 'Prototyping'] }
    }
];

// ============================================================================
// PROJECTS DATA
// ============================================================================
const projectsData = [
    {
        name: 'Digital Dockers Platform',
        key: 'PLAT',
        description: 'Main AI-powered workspace platform development',
        projectType: 'scrum',
        icon: '🚀'
    },
    {
        name: 'Mobile App Development',
        key: 'MOBILE',
        description: 'iOS and Android mobile application for Digital Dockers',
        projectType: 'scrum',
        icon: '📱'
    },
    {
        name: 'Marketing Campaign Q1',
        key: 'MKT',
        description: 'Q1 2026 Marketing initiatives and brand awareness',
        projectType: 'kanban',
        icon: '📈'
    },
    {
        name: 'AI/ML Feature Development',
        key: 'AIML',
        description: 'Machine learning and AI feature integration',
        projectType: 'scrum',
        icon: '🤖'
    },
    {
        name: 'DevOps Infrastructure',
        key: 'DEVOPS',
        description: 'Cloud infrastructure and CI/CD pipelines',
        projectType: 'kanban',
        icon: '⚙️'
    }
];

// ============================================================================
// TEAMS DATA
// ============================================================================
const teamsData = [
    {
        name: 'Platform Engineering',
        description: 'Core platform development team',
        color: '#0052CC'
    },
    {
        name: 'AI & ML Team',
        description: 'Machine learning and AI specialists',
        color: '#6554C0'
    },
    {
        name: 'Marketing & Growth',
        description: 'Marketing, branding, and growth initiatives',
        color: '#FF7A00'
    },
    {
        name: 'DevOps & Infrastructure',
        description: 'Cloud, deployment, and infrastructure',
        color: '#00875A'
    }
];

// ============================================================================
// TASKS TEMPLATE DATA
// ============================================================================
const getTasksForProject = (projectKey, users, sprint) => {
    const techLead = users.find(u => u.role === 'technical_lead');
    const techTeam = users.filter(u => u.role === 'technical_team');
    const marketingTeam = users.filter(u => u.role === 'marketing_team');
    const pm = users.find(u => u.role === 'project_manager');

    const commonTasks = {
        PLAT: [
            { title: 'Setup authentication system', status: 'done', priority: 'highest', storyPoints: 8, issueType: 'story', assignee: techTeam[0] },
            { title: 'Design database schema', status: 'done', priority: 'high', storyPoints: 5, issueType: 'task', assignee: techTeam[1] },
            { title: 'Implement dashboard UI', status: 'done', priority: 'high', storyPoints: 8, issueType: 'story', assignee: techTeam[0] },
            { title: 'Build REST API endpoints', status: 'in_progress', priority: 'high', storyPoints: 13, issueType: 'story', assignee: techTeam[2] },
            { title: 'Add real-time notifications', status: 'in_progress', priority: 'medium', storyPoints: 5, issueType: 'task', assignee: techTeam[0] },
            { title: 'Implement task board component', status: 'review', priority: 'high', storyPoints: 8, issueType: 'story', assignee: techTeam[1] },
            { title: 'Setup WebSocket for chat', status: 'todo', priority: 'medium', storyPoints: 5, issueType: 'task', assignee: techTeam[2] },
            { title: 'Create sprint management module', status: 'todo', priority: 'medium', storyPoints: 5, issueType: 'task', assignee: techLead },
            { title: 'Bug: Fix login redirect issue', status: 'in_progress', priority: 'highest', storyPoints: 2, issueType: 'bug', assignee: techTeam[0] },
            { title: 'Add dark mode support', status: 'todo', priority: 'low', storyPoints: 3, issueType: 'story', assignee: techTeam[1] }
        ],
        MOBILE: [
            { title: 'Setup React Native project', status: 'done', priority: 'highest', storyPoints: 5, issueType: 'task', assignee: techTeam[0] },
            { title: 'Design mobile navigation', status: 'done', priority: 'high', storyPoints: 3, issueType: 'story', assignee: techTeam[0] },
            { title: 'Implement push notifications', status: 'in_progress', priority: 'high', storyPoints: 8, issueType: 'story', assignee: techTeam[2] },
            { title: 'Build offline sync feature', status: 'todo', priority: 'medium', storyPoints: 13, issueType: 'story', assignee: techTeam[1] },
            { title: 'iOS App Store submission', status: 'todo', priority: 'high', storyPoints: 2, issueType: 'task', assignee: pm }
        ],
        MKT: [
            { title: 'Create brand guidelines document', status: 'done', priority: 'high', storyPoints: 5, issueType: 'task', assignee: marketingTeam[2] },
            { title: 'Design social media templates', status: 'done', priority: 'medium', storyPoints: 3, issueType: 'task', assignee: marketingTeam[2] },
            { title: 'Write blog posts for launch', status: 'in_progress', priority: 'high', storyPoints: 5, issueType: 'story', assignee: marketingTeam[1] },
            { title: 'Setup Google Ads campaign', status: 'in_progress', priority: 'high', storyPoints: 5, issueType: 'task', assignee: marketingTeam[0] },
            { title: 'Create product demo video', status: 'todo', priority: 'medium', storyPoints: 8, issueType: 'story', assignee: marketingTeam[1] },
            { title: 'Plan launch event', status: 'todo', priority: 'high', storyPoints: 5, issueType: 'task', assignee: pm }
        ],
        AIML: [
            { title: 'Research NLP models for chat', status: 'done', priority: 'high', storyPoints: 8, issueType: 'story', assignee: techTeam[3] },
            { title: 'Train document classification model', status: 'in_progress', priority: 'high', storyPoints: 13, issueType: 'story', assignee: techTeam[3] },
            { title: 'Implement AI email generator', status: 'done', priority: 'high', storyPoints: 8, issueType: 'story', assignee: techTeam[3] },
            { title: 'Build recommendation engine', status: 'todo', priority: 'medium', storyPoints: 13, issueType: 'story', assignee: techTeam[3] },
            { title: 'Integrate OpenAI API', status: 'review', priority: 'high', storyPoints: 5, issueType: 'task', assignee: techTeam[2] }
        ],
        DEVOPS: [
            { title: 'Setup AWS infrastructure', status: 'done', priority: 'highest', storyPoints: 8, issueType: 'task', assignee: techTeam[2] },
            { title: 'Configure CI/CD pipeline', status: 'done', priority: 'high', storyPoints: 5, issueType: 'task', assignee: techTeam[2] },
            { title: 'Setup monitoring with Grafana', status: 'in_progress', priority: 'medium', storyPoints: 5, issueType: 'task', assignee: techTeam[2] },
            { title: 'Implement auto-scaling', status: 'todo', priority: 'medium', storyPoints: 8, issueType: 'story', assignee: techTeam[2] },
            { title: 'Setup backup and recovery', status: 'todo', priority: 'high', storyPoints: 5, issueType: 'task', assignee: techLead }
        ]
    };

    return commonTasks[projectKey] || [];
};

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================
const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/digital-dockers');
        console.log('✅ MongoDB Connected\n');

        // ==================== SEED EMPLOYEES ====================
        console.log('📌 Seeding Employees...');
        const createdUsers = [];

        for (const emp of employees) {
            let user = await User.findOne({ email: emp.email });
            if (!user) {
                user = new User({
                    ...emp,
                    preferences: { notifications: true, theme: 'light' }
                });
                await user.save();
                console.log(`  ✅ Created: ${emp.fullName} (${emp.role})`);
            } else {
                console.log(`  ✓ Exists: ${emp.fullName}`);
            }
            createdUsers.push(user);
        }

        // Get user references
        const techLead = createdUsers.find(u => u.role === 'technical_lead');
        const marketingLead = createdUsers.find(u => u.role === 'marketing_lead');
        const projectManagers = createdUsers.filter(u => u.role === 'project_manager');
        const techTeam = createdUsers.filter(u => u.role === 'technical_team');
        const marketingTeam = createdUsers.filter(u => u.role === 'marketing_team');

        // ==================== SEED PROJECTS ====================
        console.log('\n📌 Seeding Projects...');
        const createdProjects = [];

        for (let i = 0; i < projectsData.length; i++) {
            const projData = projectsData[i];
            let project = await Project.findOne({ key: projData.key });

            if (!project) {
                const lead = i < 3 ? techLead._id : (i === 2 ? marketingLead._id : techLead._id);
                const members = i === 2
                    ? marketingTeam.map(u => u._id)
                    : techTeam.slice(0, 4).map(u => u._id);

                project = new Project({
                    ...projData,
                    lead: lead,
                    members: [...members, lead],
                    defaultAssignee: members[0]
                });
                await project.save();
                console.log(`  ✅ Created: ${projData.name} (${projData.key})`);
            } else {
                console.log(`  ✓ Exists: ${projData.name}`);
            }
            createdProjects.push(project);
        }

        // ==================== SEED SPRINTS ====================
        console.log('\n📌 Seeding Sprints...');
        const createdSprints = {};
        const now = new Date();

        for (const project of createdProjects) {
            if (project.projectType === 'scrum') {
                // Create 2 sprints per scrum project
                for (let i = 1; i <= 2; i++) {
                    const sprintName = `${project.key} Sprint ${i}`;
                    let sprint = await Sprint.findOne({ name: sprintName, project: project._id });

                    if (!sprint) {
                        const startDate = new Date(now);
                        startDate.setDate(startDate.getDate() + (i - 1) * 14);
                        const endDate = new Date(startDate);
                        endDate.setDate(endDate.getDate() + 14);

                        sprint = new Sprint({
                            name: sprintName,
                            goal: `Complete ${project.name} Sprint ${i} objectives`,
                            startDate: i === 1 ? now : startDate,
                            endDate: endDate,
                            status: i === 1 ? 'active' : 'future',
                            project: project._id,
                            committedPoints: 30 + (i * 5),
                            completedPoints: i === 1 ? 21 : 0
                        });
                        await sprint.save();
                        console.log(`  ✅ Created: ${sprintName}`);
                    } else {
                        console.log(`  ✓ Exists: ${sprintName}`);
                    }

                    if (i === 1) {
                        createdSprints[project.key] = sprint;
                    }
                }
            }
        }

        // ==================== SEED TEAMS ====================
        console.log('\n📌 Seeding Teams...');
        const createdTeams = [];

        for (let i = 0; i < teamsData.length; i++) {
            const teamData = teamsData[i];
            let team = await Team.findOne({ name: teamData.name });

            if (!team) {
                let members, lead, projects;

                if (i === 0) { // Platform Engineering
                    lead = techLead._id;
                    members = techTeam.slice(0, 3).map(u => u._id);
                    projects = [createdProjects[0]._id, createdProjects[1]._id];
                } else if (i === 1) { // AI Team
                    lead = techLead._id;
                    members = [techTeam[3]?._id].filter(Boolean);
                    projects = [createdProjects[3]._id];
                } else if (i === 2) { // Marketing
                    lead = marketingLead._id;
                    members = marketingTeam.map(u => u._id);
                    projects = [createdProjects[2]._id];
                } else { // DevOps
                    lead = techLead._id;
                    members = [techTeam[2]?._id].filter(Boolean);
                    projects = [createdProjects[4]._id];
                }

                team = new Team({
                    ...teamData,
                    lead,
                    members: [...members, lead],
                    projects
                });
                await team.save();
                console.log(`  ✅ Created: ${teamData.name}`);
            } else {
                console.log(`  ✓ Exists: ${teamData.name}`);
            }
            createdTeams.push(team);
        }

        // ==================== SEED TASKS ====================
        console.log('\n📌 Seeding Tasks...');
        let taskCount = 0;

        for (const project of createdProjects) {
            const existingTasks = await Task.countDocuments({ project: project._id });

            if (existingTasks < 3) { // Only seed if project has few tasks
                const tasks = getTasksForProject(project.key, createdUsers, createdSprints[project.key]);
                const sprint = createdSprints[project.key];

                // Ensure nextIssueNumber is defined
                const startingNumber = project.nextIssueNumber || 1;

                for (let i = 0; i < tasks.length; i++) {
                    const taskData = tasks[i];

                    // Skip if no assignee
                    if (!taskData.assignee) {
                        console.log(`  ⚠ Skipping task (no assignee): ${taskData.title}`);
                        continue;
                    }

                    const taskKey = `${project.key}-${startingNumber + i}`;

                    try {
                        const existingTask = await Task.findOne({ key: taskKey });
                        if (!existingTask) {
                            const task = new Task({
                                key: taskKey,
                                title: taskData.title,
                                description: `Task for ${project.name}: ${taskData.title}`,
                                status: taskData.status,
                                priority: taskData.priority,
                                storyPoints: taskData.storyPoints,
                                issueType: taskData.issueType,
                                project: project._id,
                                sprint: sprint?._id || null,
                                assignedTo: [taskData.assignee._id],
                                reporter: projectManagers[0]?._id || createdUsers[0]._id,
                                dueDate: new Date(now.getTime() + (7 + i) * 24 * 60 * 60 * 1000),
                                completedAt: taskData.status === 'done' ? new Date() : null,
                                completedPoints: taskData.status === 'done' ? taskData.storyPoints : 0
                            });
                            await task.save();
                            taskCount++;
                        }
                    } catch (taskError) {
                        console.log(`  ⚠ Error creating task ${taskKey}: ${taskError.message}`);
                    }
                }

                // Update project's nextIssueNumber
                project.nextIssueNumber = startingNumber + tasks.length;
                await project.save();
            }
        }
        console.log(`  ✅ Created ${taskCount} tasks\n`);

        // ==================== SUMMARY ====================
        console.log('═══════════════════════════════════════════════════════════');
        console.log('                    SEED COMPLETE SUMMARY');
        console.log('═══════════════════════════════════════════════════════════\n');

        console.log('👥 EMPLOYEES:');
        console.log(`   Total: ${createdUsers.length}`);
        console.log('   - Admin: admin@digitalDockers.com / admin123');
        console.log('   - PM: sarah.pm@digitalDockers.com / pm123');
        console.log('   - Tech Lead: michael.lead@digitalDockers.com / lead123');
        console.log('   - Marketing Lead: jessica.mlead@digitalDockers.com / mlead123\n');

        console.log('📁 PROJECTS:');
        createdProjects.forEach(p => console.log(`   - ${p.name} (${p.key})`));

        console.log('\n👥 TEAMS:');
        createdTeams.forEach(t => console.log(`   - ${t.name}`));

        console.log('\n🏃 SPRINTS:');
        Object.keys(createdSprints).forEach(key => {
            console.log(`   - ${createdSprints[key].name} (${createdSprints[key].status})`);
        });

        console.log('\n✅ DATABASE SEEDED SUCCESSFULLY!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
