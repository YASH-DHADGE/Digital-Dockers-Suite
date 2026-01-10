import { useState } from 'react';
import { Box, Typography, Paper, Button, Fade, Grow, Chip } from '@mui/material';
import { ArrowForward, Check } from '@mui/icons-material';
import { JOURNEY_PATHS, getMoodLabel, getMoodEmoji } from './journeyData';

const MoodJourneySelector = ({ mood, onSelectPath, onSkip }) => {
    const [hoveredPath, setHoveredPath] = useState(null);
    const paths = JOURNEY_PATHS[mood] || [];

    if (!paths.length) {
        return null;
    }

    return (
        <Fade in timeout={500}>
            <Box
                sx={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
                    py: 4,
                    px: 2
                }}
            >
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 5 }}>
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 800,
                            fontSize: { xs: '2rem', md: '3rem' },
                            background: 'linear-gradient(135deg, #f472b6 0%, #c084fc 50%, #60a5fa 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 2
                        }}
                    >
                        Feeling {getMoodLabel(mood)}? {getMoodEmoji(mood)}
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{
                            color: 'rgba(255,255,255,0.7)',
                            fontWeight: 400,
                            maxWidth: 600,
                            mx: 'auto'
                        }}
                    >
                        Let's navigate this feeling together. Choose a path to find relief.
                    </Typography>
                </Box>

                {/* Journey Path Cards */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                        maxWidth: 700,
                        mx: 'auto'
                    }}
                >
                    {paths.map((path, index) => (
                        <Grow
                            key={path.id}
                            in
                            timeout={600 + index * 200}
                            style={{ transformOrigin: '0 0' }}
                        >
                            <Paper
                                elevation={hoveredPath === path.id ? 16 : 4}
                                onMouseEnter={() => setHoveredPath(path.id)}
                                onMouseLeave={() => setHoveredPath(null)}
                                sx={{
                                    p: 3,
                                    borderRadius: 4,
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    backdropFilter: 'blur(20px)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    transform: hoveredPath === path.id ? 'scale(1.02)' : 'scale(1)',
                                    '&:hover': {
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        boxShadow: `0 20px 60px -10px ${path.gradient.includes('#4f46e5') ? 'rgba(79, 70, 229, 0.4)' : 'rgba(236, 72, 153, 0.4)'}`
                                    }
                                }}
                                onClick={() => onSelectPath(path)}
                            >
                                {/* Path Header */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Box
                                        sx={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: 3,
                                            background: path.gradient,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.8rem',
                                            boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.3)'
                                        }}
                                    >
                                        {path.icon}
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
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
                                        <Typography
                                            variant="body2"
                                            sx={{ color: 'rgba(255,255,255,0.6)' }}
                                        >
                                            {path.description}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={`${path.activities.length} activities`}
                                        size="small"
                                        sx={{
                                            bgcolor: 'rgba(255,255,255,0.1)',
                                            color: 'rgba(255,255,255,0.8)',
                                            fontWeight: 500
                                        }}
                                    />
                                </Box>

                                {/* Activity List */}
                                <Box sx={{ ml: 9, mb: 3 }}>
                                    {path.activities.map((activity) => (
                                        <Box
                                            key={activity.id}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1.5,
                                                py: 0.75
                                            }}
                                        >
                                            <Check
                                                sx={{
                                                    fontSize: 18,
                                                    color: path.gradient.includes('#22c55e') ? '#22c55e' : '#a78bfa'
                                                }}
                                            />
                                            <Typography
                                                variant="body2"
                                                sx={{ color: 'rgba(255,255,255,0.85)' }}
                                            >
                                                {activity.title}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>

                                {/* Start Button */}
                                <Button
                                    variant="contained"
                                    fullWidth
                                    endIcon={<ArrowForward />}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 3,
                                        background: path.gradient,
                                        fontWeight: 600,
                                        fontSize: '1rem',
                                        textTransform: 'none',
                                        boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.3)',
                                        '&:hover': {
                                            background: path.gradient,
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 15px 40px -5px rgba(0, 0, 0, 0.4)'
                                        }
                                    }}
                                >
                                    Start Journey
                                </Button>
                            </Paper>
                        </Grow>
                    ))}
                </Box>

                {/* Skip Option */}
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Button
                        variant="text"
                        onClick={onSkip}
                        sx={{
                            color: 'rgba(255,255,255,0.5)',
                            textTransform: 'none',
                            '&:hover': {
                                color: 'rgba(255,255,255,0.8)',
                                bgcolor: 'rgba(255,255,255,0.05)'
                            }
                        }}
                    >
                        Maybe later, return to dashboard
                    </Button>
                </Box>
            </Box>
        </Fade>
    );
};

export default MoodJourneySelector;
