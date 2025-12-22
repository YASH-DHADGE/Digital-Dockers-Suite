const asyncHandler = require('express-async-handler');
const Email = require('../models/Email');
const { generateEmailContent } = require('../services/openaiService');

const { sendGmail, listGmailMessages } = require('../services/gmailService');

// @desc    Generate Email
// @route   POST /api/emails/generate
// @access  Private
const generateEmail = asyncHandler(async (req, res) => {
    // ... same as before ...
    const { bulletPoints, context, tone, recipients } = req.body;

    const generated = await generateEmailContent(bulletPoints, context, tone);

    const email = await Email.create({
        userId: req.user._id,
        input: { bulletPoints, context, tone },
        generatedContent: generated,
        recipients,
        status: 'draft'
    });

    res.status(201).json(email);
});

// @desc    Send Email via Gmail
// @route   POST /api/emails/send
// @access  Private
const sendEmail = asyncHandler(async (req, res) => {
    const { to, subject, body } = req.body;

    if (!req.user.googleAccessToken) {
        res.status(400);
        throw new Error('Google account not connected');
    }

    try {
        await sendGmail(req.user.googleAccessToken, { to, subject, body });

        // Optionally save as sent email in DB
        await Email.create({
            userId: req.user._id,
            recipients: to,
            generatedContent: body,
            status: 'sent',
            sentAt: new Date()
        });

        res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
        res.status(500);
        throw new Error('Failed to send email via Google');
    }
});

// @desc    Get Inbox
// @route   GET /api/emails/inbox
// @access  Private
const getInbox = asyncHandler(async (req, res) => {
    if (!req.user.googleAccessToken) {
        res.status(400);
        throw new Error('Google account not connected');
    }

    try {
        const messages = await listGmailMessages(req.user.googleAccessToken);
        res.status(200).json(messages);
    } catch (error) {
        res.status(500);
        throw new Error('Failed to fetch inbox');
    }
});

// @desc    Get generated emails (history)
// @route   GET /api/emails
// @access  Private
const getEmails = asyncHandler(async (req, res) => {
    const emails = await Email.find({ userId: req.user._id }).sort('-createdAt');
    res.status(200).json(emails);
});

module.exports = {
    generateEmail,
    getEmails,
    sendEmail,
    getInbox
};
