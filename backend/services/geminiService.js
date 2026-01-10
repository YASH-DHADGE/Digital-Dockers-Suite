/**
 * Mistral AI Service for DockerBot (Main Application Chatbot)
 * Migrated from Gemini to Mistral AI
 */

// System context for the chatbot - DockerBot Assistant
const SYSTEM_CONTEXT = `You are DockerBot, an intelligent AI assistant for the Digital Dockers Suite - a workplace productivity platform similar to Jira/Asana.

## YOUR CORE RESPONSIBILITIES:
1. **Answer questions about the website features and navigation**
2. **Provide personalized information from the user's data** (tasks, meetings, projects)
3. **Be helpful, concise, and specific**

## PLATFORM FEATURES YOU SHOULD KNOW:

### Core Features:
- **Dashboard**: Overview with metrics, task statistics, burndown charts, and recent activity
- **Task Board**: Kanban-style board for active sprint (drag tasks between columns)
- **Backlog**: Manage and prioritize tasks not yet in a sprint
- **Roadmap**: Visual timeline of project milestones and epics
- **Sprints**: Time-boxed iterations (typically 2 weeks) to complete tasks
- **Reports**: Analytics, burndown charts, velocity tracking

### Apps & Tools:
- **AI Email Generator**: Write professional emails with AI assistance (sidebar → APPS → AI Email)
- **Meetings**: Upload recordings for AI-generated summaries, transcripts, and action items
- **Documents**: Upload and analyze compliance/contract documents
- **Organization Chart**: View team hierarchy and reporting structure
- **Wellness Check-in**: Track employee wellbeing and mood

### How to Navigate:
- **Create anything**: Click the "Create" button in the header
- **Switch projects**: Use the project dropdown in the sidebar  
- **View tasks**: Board (Kanban), Backlog (list view), or search
- **Check reports**: Navigate to Reports from sidebar

## HOW TO HANDLE USER QUERIES:

1. **"What are my tasks?" / "Show my tasks"**
   → List their pending tasks from the context with status and due date

2. **"When is my next meeting?"**
   → Check meetings context and give the soonest one with date and time

3. **"What tasks are remaining/pending?"**
   → Filter tasks that are not "done" from context

4. **"How do I [action]?"**
   → Give step-by-step instructions for the action

5. **"What should I work on?"**
   → Suggest based on priority + due date from their tasks

## RESPONSE GUIDELINES:
- Be **conversational but concise**
- Use **bullet points** for lists
- Include **specific details** (task names, dates, priorities)
- If you don't have data for something, say so clearly
- Use emojis sparingly for friendliness ✨

Remember: You have access to the user's REAL data. Use it to give PERSONALIZED answers!`;

/**
 * Format date nicely with relative time
 */
const formatDateTime = (date) => {
    if (!date) return 'No date set';
    const d = new Date(date);
    const now = new Date();
    const diffMs = d - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    if (diffDays === 0) return `Today at ${timeStr}`;
    if (diffDays === 1) return `Tomorrow at ${timeStr}`;
    if (diffDays < 7 && diffDays > 0) return `${dateStr} at ${timeStr} (in ${diffDays} days)`;
    if (diffDays < 0) return `${dateStr} at ${timeStr} (OVERDUE)`;
    return `${dateStr} at ${timeStr}`;
};

/**
 * Generate a response using Mistral AI
 * @param {string} userMessage - The user's message
 * @param {object} userContext - Context about the user's data
 * @returns {Promise<string>} - The AI response
 */
const generateResponse = async (userMessage, userContext = {}) => {
    try {
        const apiKey = process.env.MISTRAL_API_KEY;

        if (!apiKey) {
            console.log('No Mistral API key, using fallback responses');
            return getFallbackResponse(userMessage, userContext);
        }

        // Build comprehensive context from user data
        let contextContent = SYSTEM_CONTEXT;

        // User info
        if (userContext.user) {
            contextContent += `\n\n---\n## CURRENT USER DATA:\n`;
            contextContent += `**User:** ${userContext.user.fullName} (Role: ${userContext.user.role}, Email: ${userContext.user.email})\n`;
        }

        // Tasks - detailed info
        if (userContext.tasks && userContext.tasks.length > 0) {
            contextContent += `\n### Pending Tasks (${userContext.tasks.length} total):\n`;
            userContext.tasks.forEach((task, i) => {
                const projectInfo = task.project ? `[${task.project.key || task.project.name}]` : '';
                const dueInfo = task.dueDate ? `Due: ${formatDateTime(task.dueDate)}` : 'No due date';
                contextContent += `${i + 1}. ${projectInfo} **${task.title}**\n`;
                contextContent += `   - Status: ${task.status} | Priority: ${task.priority || 'medium'} | ${dueInfo}\n`;
            });
        } else {
            contextContent += `\n### Tasks: No pending tasks found.\n`;
        }

        // Meetings - detailed info with time
        if (userContext.meetings && userContext.meetings.length > 0) {
            contextContent += `\n### Upcoming Meetings (${userContext.meetings.length} total):\n`;
            userContext.meetings.forEach((meeting, i) => {
                const meetingTime = formatDateTime(meeting.scheduledAt || meeting.createdAt);
                contextContent += `${i + 1}. **${meeting.title}** - ${meetingTime}\n`;
                if (meeting.description) {
                    contextContent += `   - ${meeting.description.substring(0, 100)}...\n`;
                }
            });
        } else {
            contextContent += `\n### Meetings: No upcoming meetings scheduled.\n`;
        }

        // Projects
        if (userContext.projects && userContext.projects.length > 0) {
            contextContent += `\n### User's Projects: ${userContext.projects.map(p => `${p.name} (${p.key})`).join(', ')}\n`;
        }

        contextContent += `\n---\nNow answer the user's question using the above data:\n`;

        // Build messages for Mistral
        const messages = [
            { role: 'system', content: contextContent },
            { role: 'user', content: userMessage }
        ];

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
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Mistral API Error:', errorText);
            throw new Error('Mistral API request failed');
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || getFallbackResponse(userMessage, userContext);

    } catch (error) {
        console.error('Mistral AI Error:', error);
        return getFallbackResponse(userMessage, userContext);
    }
};

/**
 * Enhanced fallback responses when API is not available
 */
const getFallbackResponse = (message, userContext = {}) => {
    const lowerMsg = message.toLowerCase();

    // Handle task queries with real data
    if (lowerMsg.includes('task') || lowerMsg.includes('what should i') || lowerMsg.includes('remaining') || lowerMsg.includes('pending')) {
        if (userContext.tasks && userContext.tasks.length > 0) {
            let response = `📋 Here are your pending tasks:\n\n`;
            userContext.tasks.slice(0, 5).forEach((task, i) => {
                const dueInfo = task.dueDate ? ` (Due: ${formatDateTime(task.dueDate)})` : '';
                response += `${i + 1}. **${task.title}** - ${task.status}${dueInfo}\n`;
            });
            if (userContext.tasks.length > 5) {
                response += `\n...and ${userContext.tasks.length - 5} more tasks.`;
            }
            return response;
        }
        return "You don't have any pending tasks right now! 🎉";
    }

    // Handle meeting queries with real data
    if (lowerMsg.includes('meeting') || lowerMsg.includes('next meet')) {
        if (userContext.meetings && userContext.meetings.length > 0) {
            const nextMeeting = userContext.meetings[0];
            const meetingTime = formatDateTime(nextMeeting.scheduledAt || nextMeeting.createdAt);
            return `📅 Your next meeting is **"${nextMeeting.title}"** - ${meetingTime}`;
        }
        return "You don't have any upcoming meetings scheduled.";
    }

    // General responses
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
        const name = userContext.user?.fullName?.split(' ')[0] || 'there';
        return `Hello ${name}! 👋 I'm DockerBot, your assistant. I can help you with:\n\n• Finding your tasks and meetings\n• Navigating the Digital Dockers platform\n• Understanding features like Board, Backlog, Reports\n\nWhat would you like to know?`;
    }

    if (lowerMsg.includes('create') && lowerMsg.includes('task')) {
        return "To create a new task:\n\n1. Click the **Create** button in the header, or\n2. Go to **Backlog** and click **Create Issue**\n\nYou can set title, assignees, priority, and due date for each task.";
    }

    if (lowerMsg.includes('sprint')) {
        return "**Sprints** help organize your work into time-boxed iterations:\n\n1. Go to **Backlog**\n2. Click **Create Sprint**\n3. Drag tasks into the sprint\n4. Click **Start Sprint** when ready\n\nTrack progress on the **Board** and **Reports** pages.";
    }

    if (lowerMsg.includes('email') || lowerMsg.includes('ai email')) {
        return "To use the **AI Email Generator**:\n\n1. Go to sidebar → **APPS** → **AI Email**\n2. Fill in the recipient, subject, and describe what you want to say\n3. Select the tone (Professional, Friendly, Persuasive)\n4. Click **Generate & Send**\n\nYour sent emails are saved in the history below the form!";
    }

    if (lowerMsg.includes('document')) {
        return "The **Documents** feature lets you:\n\n1. Upload contracts, compliance docs, or any files\n2. Get AI-powered analysis and summaries\n3. Organize and search through documents\n\nNavigate to **Documents** from the sidebar.";
    }

    if (lowerMsg.includes('help') || lowerMsg.includes('what can you do')) {
        return "I'm DockerBot! Here's how I can help:\n\n📋 **Tasks & Work**: 'What are my tasks?', 'What should I work on?'\n📅 **Meetings**: 'When is my next meeting?'\n🚀 **Navigation**: 'How do I create a sprint?', 'Where is the roadmap?'\n📧 **Features**: 'How to use AI Email?', 'How do meetings work?'\n\nJust ask me anything!";
    }

    return "I'm here to help! You can ask me about:\n\n• Your tasks and todos\n• Upcoming meetings\n• How to use any feature (Board, Backlog, Sprints, etc.)\n• General navigation help\n\nTry asking: 'What are my tasks?' or 'How do I create a sprint?'";
};

module.exports = {
    generateResponse
};
