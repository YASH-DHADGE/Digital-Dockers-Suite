// Journey path definitions for each mood state
export const JOURNEY_PATHS = {
    stressed: [
        {
            id: 'pause-reset',
            title: 'Pause & Reset',
            icon: '🌿',
            description: 'Quick relief through breathing and mindful pausing',
            gradient: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
            activities: [
                {
                    id: 'breathing',
                    type: 'breathing',
                    title: 'Guided Breathing',
                    description: 'Inhale calm, exhale stress',
                    duration: 300,
                    config: { pattern: '4-7-8', cycles: 4 }
                },
                {
                    id: 'task-prioritize',
                    type: 'journal',
                    title: 'Task Prioritization',
                    description: 'Write down 3 tasks, select 1 to focus on now',
                    prompt: 'List your top 3 tasks right now. Then circle the ONE that matters most.',
                    minLength: 20
                },
                {
                    id: 'physical-break',
                    type: 'prompt',
                    title: 'Physical Wellness',
                    description: 'Take a quick break',
                    text: 'Time for a micro-break! Stand up, drink some water, or do a quick stretch. Your body will thank you. 💧',
                    confirmText: 'I did it!'
                }
            ]
        },
        {
            id: 'organize-focus',
            title: 'Organize & Focus',
            icon: '📋',
            description: 'Clear your mind by organizing thoughts',
            gradient: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
            activities: [
                {
                    id: 'stressor-list',
                    type: 'journal',
                    title: 'Identify Stressors',
                    description: 'Name what\'s weighing on you',
                    prompt: 'What are the top 3 things causing you stress right now? Write them out.',
                    minLength: 30
                },
                {
                    id: 'task-breakdown',
                    type: 'taskBreakdown',
                    title: 'Break It Down',
                    description: 'Make big tasks manageable',
                    prompt: 'Enter one overwhelming task and break it into 2 smaller, actionable steps.'
                },
                {
                    id: 'control-focus',
                    type: 'journal',
                    title: 'Control Reflection',
                    description: 'Focus on what you can control',
                    prompt: 'Write ONE thing you can control right now, no matter how small.',
                    minLength: 10
                }
            ]
        },
        {
            id: 'relax-recharge',
            title: 'Relax & Recharge',
            icon: '🧘',
            description: 'Deep relaxation and positive thinking',
            gradient: 'linear-gradient(135deg, #06b6d4 0%, #22c55e 100%)',
            activities: [
                {
                    id: 'muscle-relaxation',
                    type: 'muscleRelaxation',
                    title: 'Progressive Muscle Relaxation',
                    description: 'Release tension from your body',
                    duration: 180
                },
                {
                    id: 'what-if',
                    type: 'aiChat',
                    title: 'Mindset Shift',
                    description: 'Fun "What If" to change perspective',
                    prompt: 'Let\'s play a fun game! What if you could have any superpower just for today - what would it be and why?'
                },
                {
                    id: 'gratitude',
                    type: 'gratitude',
                    title: 'Gratitude Practice',
                    description: 'Shift focus to positives',
                    prompt: 'List 3 things you\'re grateful for today, no matter how small.',
                    count: 3
                }
            ]
        }
    ],
    burnout: [
        {
            id: 'rest-recover',
            title: 'Rest & Recover',
            icon: '😴',
            description: 'Permission to pause and heal',
            gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            activities: [
                {
                    id: 'deep-breathing',
                    type: 'breathing',
                    title: 'Deep Breathing',
                    description: '1-minute calming session',
                    duration: 60,
                    config: { pattern: 'box', cycles: 3 }
                },
                {
                    id: 'self-compassion',
                    type: 'journal',
                    title: 'Self-Compassion',
                    description: 'Be kind to yourself',
                    prompt: 'What would you tell a close friend who was feeling exactly like you are right now?',
                    minLength: 30
                },
                {
                    id: 'energy-audit',
                    type: 'journal',
                    title: 'Energy Audit',
                    description: 'Identify what drains you',
                    prompt: 'What is ONE draining activity you could reduce or eliminate this week?',
                    minLength: 15
                }
            ]
        },
        {
            id: 'boundary-setting',
            title: 'Boundary Setting',
            icon: '🛡️',
            description: 'Protect your energy',
            gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
            activities: [
                {
                    id: 'yes-no',
                    type: 'journal',
                    title: 'Yes/No Reflection',
                    description: 'What needs to change?',
                    prompt: 'What are you saying "yes" to that should really be "no"?',
                    minLength: 20
                },
                {
                    id: 'ideal-balance',
                    type: 'journal',
                    title: 'Ideal Balance',
                    description: 'Envision your ideal day',
                    prompt: 'Describe your ideal work-life balance in a few sentences. What would a perfect day look like?',
                    minLength: 40
                },
                {
                    id: 'set-boundary',
                    type: 'prompt',
                    title: 'Set One Boundary',
                    description: 'Take action for tomorrow',
                    text: 'Based on your reflections, commit to setting ONE small boundary tomorrow. What will it be?',
                    inputRequired: true,
                    confirmText: 'I commit!'
                }
            ]
        },
        {
            id: 'reconnect-recharge',
            title: 'Reconnect & Recharge',
            icon: '🌟',
            description: 'Find your spark again',
            gradient: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
            activities: [
                {
                    id: 'soundscape',
                    type: 'soundscape',
                    title: 'Calming Sounds',
                    description: 'Immerse in peaceful audio',
                    duration: 120,
                    options: ['rain', 'ocean', 'forest']
                },
                {
                    id: 'energy-memory',
                    type: 'journal',
                    title: 'Energy Memory',
                    description: 'Remember feeling alive',
                    prompt: 'Recall a moment when you felt truly energized and fulfilled. Describe it.',
                    minLength: 30
                },
                {
                    id: 'joy-plan',
                    type: 'prompt',
                    title: 'Plan Joy',
                    description: 'Schedule something for you',
                    text: 'Plan 15 minutes today for something you genuinely enjoy. What will it be?',
                    inputRequired: true,
                    confirmText: 'Planned!'
                }
            ]
        }
    ],
    neutral: [
        {
            id: 'energize-activate',
            title: 'Energize & Activate',
            icon: '⚡',
            description: 'Boost your energy and motivation',
            gradient: 'linear-gradient(135deg, #22c55e 0%, #eab308 100%)',
            activities: [
                {
                    id: 'movement',
                    type: 'prompt',
                    title: 'Quick Movement',
                    description: '30-second body activation',
                    text: 'Time to move! Do 30 seconds of stretching, jumping jacks, or a quick dance. Get that blood flowing! 💪',
                    confirmText: 'Done moving!'
                },
                {
                    id: 'affirmation',
                    type: 'affirmation',
                    title: 'Motivation Boost',
                    description: 'AI-generated affirmation',
                    prompt: 'Generate a personalized affirmation'
                },
                {
                    id: 'small-win',
                    type: 'journal',
                    title: 'Plan a Win',
                    description: 'Set yourself up for success',
                    prompt: 'What is ONE small win you want to achieve today?',
                    minLength: 10
                }
            ]
        },
        {
            id: 'reflect-align',
            title: 'Reflect & Align',
            icon: '🎯',
            description: 'Check in with yourself',
            gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            activities: [
                {
                    id: 'mind-space',
                    type: 'journal',
                    title: 'Mind Space',
                    description: 'Clear mental clutter',
                    prompt: 'What\'s taking up the most space in your mind right now? Write it out.',
                    minLength: 20
                },
                {
                    id: 'satisfaction-check',
                    type: 'satisfaction',
                    title: 'Life Satisfaction',
                    description: 'Quick check-in',
                    areas: ['Work', 'Relationships', 'Health']
                },
                {
                    id: 'focus-suggestion',
                    type: 'aiChat',
                    title: 'Focus Insight',
                    description: 'AI suggests where to focus',
                    prompt: 'Based on your satisfaction ratings, here\'s a suggestion for where to focus your energy today.'
                }
            ]
        },
        {
            id: 'creative-spark',
            title: 'Creative Spark',
            icon: '✨',
            description: 'Ignite creativity and inspiration',
            gradient: 'linear-gradient(135deg, #f472b6 0%, #c084fc 100%)',
            activities: [
                {
                    id: 'what-if-fun',
                    type: 'aiChat',
                    title: 'Creative "What If"',
                    description: 'Fun scenario to spark imagination',
                    prompt: 'If you could wake up tomorrow with one new skill fully mastered, what would it be?'
                },
                {
                    id: 'free-write',
                    type: 'journal',
                    title: 'Free Expression',
                    description: 'Write or doodle freely',
                    prompt: 'Express your current thoughts in any way you like. Write, list, draw with words - no rules!',
                    minLength: 20
                },
                {
                    id: 'inspiration',
                    type: 'quote',
                    title: 'Inspiration',
                    description: 'A spark of wisdom'
                }
            ]
        }
    ]
};

// Get mood label for display
export const getMoodLabel = (mood) => {
    const labels = {
        stressed: 'Stressed',
        burnout: 'Burned Out',
        neutral: 'Neutral'
    };
    return labels[mood] || mood;
};

// Get mood emoji
export const getMoodEmoji = (mood) => {
    const emojis = {
        stressed: '😰',
        burnout: '😔',
        neutral: '😐'
    };
    return emojis[mood] || '🤔';
};

export default JOURNEY_PATHS;
