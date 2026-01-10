const asyncHandler = require('express-async-handler');
const Wellness = require('../models/Wellness');

// Therapist System Prompt for Mistral AI
const THERAPIST_SYSTEM_PROMPT = `You are an empathetic, professional wellness therapist and mental health support companion. Your purpose is to provide compassionate emotional support to employees dealing with workplace stress, burnout, and emotional challenges.

## Your Therapeutic Approach:
1. **Active Listening** - Reflect back what you hear to show understanding
2. **Validation** - Acknowledge and normalize feelings without judgment  
3. **Empathy First** - Lead with emotional connection before solutions
4. **Gentle Guidance** - Offer coping strategies when appropriate
5. **Safe Space** - Create a non-judgmental, supportive environment

## Response Guidelines:
- Start responses with empathetic acknowledgment (e.g., "I hear you", "That sounds really challenging")
- Use warm, supportive language with occasional emoji (💚, 🌱, 🧘)
- Keep responses concise (3-5 sentences) but meaningful
- Ask open-ended follow-up questions to encourage expression
- Suggest practical techniques: breathing exercises, grounding, mindfulness
- Gently encourage professional help when noticing concerning patterns
- NEVER diagnose, prescribe, or give medical advice
- If someone mentions self-harm or crisis, provide crisis resources

## Your Personality:
- Warm and nurturing, like a caring mentor
- Patient and never rushed
- Hopeful but realistic
- Uses calming, gentle language

Remember: You are a supportive wellness companion. Your goal is to help people feel heard, validated, and equipped with practical coping tools.`;

// @desc    Submit Check-in
// @route   POST /api/wellness/checkin
// @access  Private
const submitCheckin = asyncHandler(async (req, res) => {
    const { responses, checkInType } = req.body;

    // AI Analysis Stub
    // Detect burnout if stress > 8 or mood < neutral
    let alertLevel = 'none';
    if (responses.stressLevel >= 8) alertLevel = 'urgent';
    else if (responses.stressLevel >= 6) alertLevel = 'caution';

    const wellness = await Wellness.create({
        userId: req.user._id,
        checkInType: checkInType || 'daily',
        responses,
        aiAnalysis: {
            overallScore: 10 - responses.stressLevel, // Simple calculation
            concerns: responses.stressLevel > 5 ? ["High Stress"] : [],
            recommendations: responses.stressLevel >= 7
                ? ["Try a breathing exercise", "Take a short walk", "Talk to someone you trust"]
                : ["Keep up the good work!", "Stay hydrated"],
            alertLevel
        }
    });

    res.status(201).json(wellness);
});

// @desc    Get history
// @route   GET /api/wellness/history
// @access  Private
const getWellnessHistory = asyncHandler(async (req, res) => {
    const history = await Wellness.find({ userId: req.user._id }).sort('-createdAt').limit(10);
    res.status(200).json(history);
});

// @desc    AI Counselor Chat using Mistral AI
// @route   POST /api/wellness/counselor
// @access  Private
const counselorChat = asyncHandler(async (req, res) => {
    const { message, context } = req.body;

    if (!message || message.trim().length === 0) {
        res.status(400);
        throw new Error('Message is required');
    }

    try {
        const apiKey = process.env.MISTRAL_API_KEY;

        if (!apiKey) {
            // Fallback response without API
            console.log('No Mistral API key found, using fallback');
            return res.json({
                success: true,
                message: getWellnessFallbackResponse(message, context)
            });
        }

        // Build messages for Mistral
        const messages = [
            { role: 'system', content: THERAPIST_SYSTEM_PROMPT }
        ];

        // Add context about recent check-in if available
        if (context?.recentCheckin) {
            messages.push({
                role: 'system',
                content: `Context: The user recently checked in with stress level ${context.recentCheckin.stressLevel}/10 and mood "${context.recentCheckin.mood}". Be especially attentive to their current state.`
            });
        }

        // Add conversation history
        if (context?.conversationHistory && context.conversationHistory.length > 0) {
            context.conversationHistory.forEach(msg => {
                messages.push({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content
                });
            });
        }

        // Add current message
        messages.push({ role: 'user', content: message });

        // Call Mistral API
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'mistral-small-latest',
                messages: messages,
                temperature: 0.7,
                max_tokens: 300
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Mistral API Error:', errorText);
            throw new Error('Mistral API request failed');
        }

        const data = await response.json();
        const aiResponse = data.choices[0]?.message?.content || getWellnessFallbackResponse(message, context);

        res.json({
            success: true,
            message: aiResponse
        });

    } catch (error) {
        console.error('Counselor AI Error:', error);
        res.json({
            success: true,
            message: getWellnessFallbackResponse(message, context)
        });
    }
});

// Fallback responses for wellness counselor
const getWellnessFallbackResponse = (message, context) => {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('stress') || lowerMsg.includes('overwhelm')) {
        return "I hear that you're feeling overwhelmed. That's completely valid. 💚 Would you like to try a breathing exercise together? It can help calm your nervous system. Take a slow breath in for 4 counts, hold for 4, and release for 4.";
    }

    if (lowerMsg.includes('motiv') || lowerMsg.includes('tired') || lowerMsg.includes('exhaust')) {
        return "It sounds like you're running low on energy. 💚 That's okay - we all have those moments. Sometimes the best thing we can do is be gentle with ourselves. What's one small thing you could do right now to take care of yourself?";
    }

    if (lowerMsg.includes('anxious') || lowerMsg.includes('worry') || lowerMsg.includes('nervous')) {
        return "Anxiety can feel really heavy. 💚 I want you to know that what you're feeling is valid. Let's try grounding ourselves - can you name 5 things you can see right now? This simple exercise can help bring you back to the present moment.";
    }

    if (lowerMsg.includes('sad') || lowerMsg.includes('down') || lowerMsg.includes('depress')) {
        return "I'm sorry you're feeling this way. 💚 It takes courage to acknowledge these feelings. Remember, it's okay to not be okay sometimes. Is there something specific on your mind, or would you prefer some calming suggestions?";
    }

    if (lowerMsg.includes('relax') || lowerMsg.includes('calm')) {
        return "Let's create a moment of calm together. 💚 Try the 4-7-8 breathing technique: breathe in for 4 seconds, hold for 7, and exhale slowly for 8. This activates your body's natural relaxation response. Would you like to try it?";
    }

    // Default supportive response
    return "Thank you for sharing with me. 💚 I'm here to listen and support you. Whatever you're going through, remember that your feelings are valid. Would you like to talk more about what's on your mind, or would you prefer to try a relaxation exercise?";
};

// @desc    Complete a wellness journey
// @route   POST /api/wellness/journey/complete
// @access  Private
const completeJourney = asyncHandler(async (req, res) => {
    const { pathId, completedActivities, moodBefore, moodAfter, results } = req.body;

    // Store journey data in wellness record
    const journeyData = {
        userId: req.user._id,
        checkInType: 'journey',
        responses: {
            pathId,
            completedActivities,
            moodBefore,
            moodAfter,
            journeyResults: results
        },
        aiAnalysis: {
            overallScore: moodAfter || 3,
            concerns: [],
            recommendations: ['Great job completing your wellness journey!'],
            alertLevel: 'none'
        }
    };

    const wellness = await Wellness.create(journeyData);

    res.status(201).json({
        success: true,
        message: 'Journey completed successfully!',
        data: wellness
    });
});

module.exports = {
    submitCheckin,
    getWellnessHistory,
    counselorChat,
    completeJourney
};
