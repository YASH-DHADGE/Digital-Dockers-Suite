import { useState, useRef, useEffect } from 'react';
import {
    Box, Typography, TextField, IconButton, Paper, Avatar, Chip, CircularProgress, useTheme
} from '@mui/material';
import { Send, Psychology } from '@mui/icons-material';
import api from '../../services/api';

const QUICK_RESPONSES = [
    { text: "I'm feeling stressed", icon: "😰" },
    { text: "I need motivation", icon: "💪" },
    { text: "Help me relax", icon: "🧘" },
    { text: "I'm overwhelmed", icon: "😔" }
];

const WellnessCounselor = ({ recentCheckin }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // Initial greeting based on recent check-in
    useEffect(() => {
        let greeting = "Hi there! 💚 I'm your wellness companion. I'm here to listen and support you. How are you feeling today?";

        if (recentCheckin) {
            if (recentCheckin.stressLevel >= 7) {
                greeting = "I noticed you've been feeling quite stressed lately. 💚 I'm here for you. Would you like to talk about what's on your mind, or would you prefer some relaxation techniques?";
            } else if (recentCheckin.mood === 'burnout') {
                greeting = "I see you've been experiencing burnout. 💚 That can be really tough. Remember, it's okay to take a step back. Would you like to share what's been weighing on you?";
            } else if (recentCheckin.mood === 'stressed') {
                greeting = "I noticed you're feeling stressed today. 💚 I'm here to help. Would you like to talk about it, or shall we try some calming exercises?";
            }
        }

        setMessages([{
            role: 'assistant',
            content: greeting,
            timestamp: new Date()
        }]);
    }, [recentCheckin]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (messageText = input) => {
        if (!messageText.trim() || loading) return;

        const userMessage = {
            role: 'user',
            content: messageText.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await api.post('/wellness/counselor', {
                message: messageText.trim(),
                context: {
                    recentCheckin,
                    conversationHistory: messages.slice(-5).map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                }
            });

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.data.message,
                timestamp: new Date()
            }]);
        } catch (error) {
            console.error('Counselor error:', error);
            // Fallback response
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I understand you're going through a lot. Remember, it's okay to feel this way. Take a deep breath, and know that I'm here to support you. Would you like to try a breathing exercise together? 🧘",
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '500px',
            maxWidth: 600,
            mx: 'auto',
            bgcolor: 'background.paper',
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider'
        }}>
            {/* Header */}
            <Box sx={{
                p: 2,
                background: isDark
                    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                    : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 2
            }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                    <Psychology />
                </Avatar>
                <Box>
                    <Typography fontWeight={600}>Wellness Companion</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Here to listen and support you
                    </Typography>
                </Box>
            </Box>

            {/* Messages */}
            <Box sx={{
                flex: 1,
                p: 2,
                overflowY: 'auto',
                bgcolor: isDark ? 'background.default' : 'grey.50'
            }}>
                {messages.map((msg, idx) => (
                    <Box
                        key={idx}
                        sx={{
                            display: 'flex',
                            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            mb: 2
                        }}
                    >
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                maxWidth: '80%',
                                borderRadius: 3,
                                ...(msg.role === 'user' ? {
                                    background: isDark
                                        ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                                        : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                    color: 'white'
                                } : {
                                    bgcolor: 'background.paper',
                                    color: 'text.primary',
                                    border: '1px solid',
                                    borderColor: 'divider'
                                })
                            }}
                        >
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                {msg.content}
                            </Typography>
                        </Paper>
                    </Box>
                ))}

                {loading && (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                        <CircularProgress size={16} color="primary" />
                        <Typography variant="body2" color="text.secondary">
                            Thinking...
                        </Typography>
                    </Box>
                )}

                <div ref={messagesEndRef} />
            </Box>

            {/* Quick Responses */}
            <Box sx={{ px: 2, pb: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {QUICK_RESPONSES.map((resp, idx) => (
                    <Chip
                        key={idx}
                        label={`${resp.icon} ${resp.text}`}
                        size="small"
                        onClick={() => handleSend(resp.text)}
                        disabled={loading}
                        sx={{
                            cursor: 'pointer',
                            bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                            color: 'text.primary',
                            '&:hover': {
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText'
                            }
                        }}
                    />
                ))}
            </Box>

            {/* Input */}
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    <TextField
                        fullWidth
                        multiline
                        maxRows={3}
                        placeholder="Share how you're feeling..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={loading}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'background.paper'
                            }
                        }}
                    />
                    <IconButton
                        color="primary"
                        onClick={() => handleSend()}
                        disabled={!input.trim() || loading}
                        sx={{
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            '&:hover': { bgcolor: 'primary.dark' },
                            '&.Mui-disabled': { bgcolor: 'action.disabledBackground' }
                        }}
                    >
                        <Send />
                    </IconButton>
                </Box>
            </Box>
        </Box>
    );
};

export default WellnessCounselor;
