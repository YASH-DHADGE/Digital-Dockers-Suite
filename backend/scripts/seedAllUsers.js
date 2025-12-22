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
    },
    {
        fullName: 'Sarah Johnson',
        email: 'sarah.pm@digitalDockers.com',
        password: 'pm123',
        role: 'project_manager',
        department: 'Project Management',
    },
    {
        fullName: 'Yash Dhadge',
        email: 'yash.dhadge_comp23@pccoer.in',
        password: '123',
        role: 'technical_team',
        department: 'Engineering',
    },
    {
        fullName: 'Emily Chen',
        email: 'emily.marketing@digitalDockers.com',
        password: 'marketing123',
        role: 'marketing_team',
        department: 'Marketing',
    },
    {
        fullName: 'Michael Brown',
        email: 'michael.lead@digitalDockers.com',
        password: 'lead123',
        role: 'technical_lead',
        department: 'Engineering',
    },
    {
        fullName: 'Jessica Davis',
        email: 'jessica.mlead@digitalDockers.com',
        password: 'mlead123',
        role: 'marketing_lead',
        department: 'Marketing',
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

        process.exit(0);
    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
};

seedAllUsers();
