import { useState } from 'react';
import { Box, Typography, Button, Paper, Fade, Grow } from '@mui/material';
import { Celebration, ArrowForward, SentimentVerySatisfied, SentimentSatisfied, SentimentNeutral, SentimentDissatisfied } from '@mui/icons-material';

const MOOD_EMOJIS = [
    { value: 1, icon: SentimentDissatisfied, label: 'Still stressed', color: '#ef4444' },
    { value: 2, icon: SentimentNeutral, label: 'A bit better', color: '#f59e0b' },
    { value: 3, icon: SentimentSatisfied, label: 'Good!', color: '#3b82f6' },
    { value: 4, icon: SentimentVerySatisfied, label: 'Much better!', color: '#22c55e' }
];

const JourneyCompletion = ({ path, moodBefore, journeyData, onFinish }) => {
    const [moodAfter, setMoodAfter] = useState(3);

    const handleFinish = () => {
        onFinish({
            ...journeyData,
            moodBefore,
            moodAfter,
            completedAt: new Date().toISOString()
        });
    };

    return (
        <Fade in timeout={500}>
            <Box
                sx={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
                    py: 4,
                    px: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Box sx={{ maxWidth: 500, width: '100%', textAlign: 'center' }}>
                    {/* Celebration Icon */}
                    <Grow in timeout={800}>
                        <Box
                            sx={{
                                width: 100,
                                height: 100,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 4,
                                boxShadow: '0 20px 60px -10px rgba(34, 197, 94, 0.4)'
                            }}
                        >
                            <Celebration sx={{ fontSize: 48, color: 'white' }} />
                        </Box>
                    </Grow>

                    {/* Title */}
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 800,
                            background: 'linear-gradient(135deg, #22c55e 0%, #06b6d4 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 2
                        }}
                    >
                        Journey Complete! 🌟
                    </Typography>

                    <Typography
                        variant="h6"
                        sx={{ color: 'rgba(255,255,255,0.7)', mb: 4 }}
                    >
                        Great job taking care of yourself today
                    </Typography>

                    {/* Path Summary */}
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            background: 'rgba(255,255,255,0.05)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            mb: 4
                        }}
                    >
                        <Typography variant="body2" color="rgba(255,255,255,0.6)" gutterBottom>
                            You completed
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                            <Box
                                sx={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 2,
                                    background: path.gradient,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.5rem'
                                }}
                            >
                                {path.icon}
                            </Box>
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 700,
                                    background: path.gradient,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}
                            >
                                {path.title}
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="rgba(255,255,255,0.5)" sx={{ mt: 1 }}>
                            {path.activities.length} activities completed
                        </Typography>
                    </Paper>

                    {/* Mood Re-assessment */}
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            background: 'rgba(255,255,255,0.05)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            mb: 4
                        }}
                    >
                        <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                            How are you feeling now?
                        </Typography>

                        {/* Mood Selector */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 3 }}>
                            {MOOD_EMOJIS.map((mood) => {
                                const Icon = mood.icon;
                                const isSelected = moodAfter === mood.value;
                                return (
                                    <Box
                                        key={mood.value}
                                        onClick={() => setMoodAfter(mood.value)}
                                        sx={{
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            transition: 'transform 0.2s',
                                            transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                                            '&:hover': { transform: 'scale(1.1)' }
                                        }}
                                    >
                                        <Icon
                                            sx={{
                                                fontSize: 48,
                                                color: isSelected ? mood.color : 'rgba(255,255,255,0.3)',
                                                transition: 'color 0.2s'
                                            }}
                                        />
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                display: 'block',
                                                color: isSelected ? mood.color : 'rgba(255,255,255,0.5)',
                                                fontWeight: isSelected ? 600 : 400
                                            }}
                                        >
                                            {mood.label}
                                        </Typography>
                                    </Box>
                                );
                            })}
                        </Box>

                        {moodAfter >= 3 && (
                            <Typography variant="body2" color="#22c55e" sx={{ fontStyle: 'italic' }}>
                                That's wonderful! Keep up the great self-care 💚
                            </Typography>
                        )}
                    </Paper>

                    {/* Finish Button */}
                    <Button
                        variant="contained"
                        size="large"
                        endIcon={<ArrowForward />}
                        onClick={handleFinish}
                        sx={{
                            px: 5,
                            py: 1.5,
                            borderRadius: 3,
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                            boxShadow: '0 10px 30px -5px rgba(79, 70, 229, 0.4)',
                            textTransform: 'none',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 15px 40px -5px rgba(79, 70, 229, 0.5)'
                            }
                        }}
                    >
                        Return to Dashboard
                    </Button>
                </Box>
            </Box>
        </Fade>
    );
};

export default JourneyCompletion;
