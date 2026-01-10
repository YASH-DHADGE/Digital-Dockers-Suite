/**
 * Seed script to create default teams (Marketing and Technical)
 * Run with: node scripts/seedTeams.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Team = require('../models/Team');
const User = require('../models/User');
const Project = require('../models/Project');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const seedTeams = async () => {
    try {
        await connectDB();

        // Check if teams already exist
        const existingTeams = await Team.find({ name: { $in: ['Marketing', 'Technical'] } });

        if (existingTeams.length >= 2) {
            console.log('Teams already exist:');
            existingTeams.forEach(t => console.log(`  - ${t.name} (${t._id})`));
            process.exit(0);
        }

        // Get users by role to assign to teams
        const technicalLead = await User.findOne({ role: 'technical_lead' });
        const marketingLead = await User.findOne({ role: 'marketing_lead' });
        const technicalMembers = await User.find({ role: 'technical_team' }).limit(5);
        const marketingMembers = await User.find({ role: 'marketing_team' }).limit(5);
        const admin = await User.findOne({ role: 'admin' });

        // Get all projects
        const projects = await Project.find({});

        // Create Technical team
        const technicalTeam = await Team.findOneAndUpdate(
            { name: 'Technical' },
            {
                name: 'Technical',
                description: 'Development and Engineering team',
                lead: technicalLead?._id || admin?._id,
                members: [
                    technicalLead?._id,
                    ...technicalMembers.map(m => m._id)
                ].filter(Boolean),
                projects: projects.slice(0, Math.ceil(projects.length / 2)).map(p => p._id),
                color: '#0052CC',
                isActive: true
            },
            { upsert: true, new: true }
        );
        console.log(`✓ Created/Updated Technical team: ${technicalTeam._id}`);

        // Create Marketing team
        const marketingTeam = await Team.findOneAndUpdate(
            { name: 'Marketing' },
            {
                name: 'Marketing',
                description: 'Marketing and Growth team',
                lead: marketingLead?._id || admin?._id,
                members: [
                    marketingLead?._id,
                    ...marketingMembers.map(m => m._id)
                ].filter(Boolean),
                projects: projects.slice(Math.ceil(projects.length / 2)).map(p => p._id),
                color: '#6554C0',
                isActive: true
            },
            { upsert: true, new: true }
        );
        console.log(`✓ Created/Updated Marketing team: ${marketingTeam._id}`);

        console.log('\n✅ Teams seeded successfully!');
        console.log(`   Technical: ${technicalTeam.members?.length || 0} members, ${technicalTeam.projects?.length || 0} projects`);
        console.log(`   Marketing: ${marketingTeam.members?.length || 0} members, ${marketingTeam.projects?.length || 0} projects`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding teams:', error);
        process.exit(1);
    }
};

seedTeams();
