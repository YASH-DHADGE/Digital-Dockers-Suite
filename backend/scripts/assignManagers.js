const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const assignManagers = async () => {
    await connectDB();

    try {
        const users = await User.find({});

        // Find Admin (CEO/Root)
        const admin = users.find(u => u.role === 'admin');
        const pms = users.filter(u => u.role === 'project_manager');
        const leads = users.filter(u => u.role === 'technical_lead' || u.role === 'marketing_lead');
        const team = users.filter(u => u.role === 'technical_team' || u.role === 'marketing_team');

        if (!admin) {
            console.log("No Admin found");
            process.exit();
        }

        // PMs report to Admin
        for (const pm of pms) {
            pm.reportsTo = admin._id;
            await pm.save();
        }

        // Leads report to random PM
        for (const lead of leads) {
            if (pms.length > 0) {
                const randomPM = pms[Math.floor(Math.random() * pms.length)];
                lead.reportsTo = randomPM._id;
                await lead.save();
            } else {
                lead.reportsTo = admin._id;
                await lead.save();
            }
        }

        // Team members report to random Lead (if available) or PM
        for (const member of team) {
            if (leads.length > 0) {
                const randomLead = leads[Math.floor(Math.random() * leads.length)];
                member.reportsTo = randomLead._id;
                await member.save();
            } else if (pms.length > 0) {
                const randomPM = pms[Math.floor(Math.random() * pms.length)];
                member.reportsTo = randomPM._id;
                await member.save();
            } else {
                member.reportsTo = admin._id;
                await member.save();
            }
        }

        console.log('Managers Assigned Successfully');
        process.exit();

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

assignManagers();
