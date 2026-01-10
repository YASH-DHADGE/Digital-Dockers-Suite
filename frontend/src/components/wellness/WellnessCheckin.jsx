import { useState } from 'react';
import { Box, Typography, Paper, Tabs, Tab, useTheme } from '@mui/material';
import { Air, Psychology } from '@mui/icons-material';
import BreathingExercise from './BreathingExercise';
import WellnessCounselor from './WellnessCounselor';

const WellnessCheckin = () => {
    const [activeTab, setActiveTab] = useState(0);
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    return (
        <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography
                    variant="h4"
                    fontWeight={700}
                    sx={{
                        background: isDark
                            ? 'linear-gradient(135deg, #818cf8 0%, #22d3ee 100%)'
                            : 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 1
                    }}
                >
                    🧘 Wellness Center
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Take a moment to care for yourself
                </Typography>
            </Box>

            {/* Tabs */}
            <Paper
                elevation={isDark ? 0 : 1}
                sx={{
                    mb: 4,
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: isDark ? '1px solid' : 'none',
                    borderColor: 'divider'
                }}
            >
                <Tabs
                    value={activeTab}
                    onChange={(_, v) => setActiveTab(v)}
                    variant="fullWidth"
                    sx={{
                        bgcolor: 'background.paper',
                        '& .MuiTab-root': {
                            py: 2,
                            fontSize: '1rem',
                            fontWeight: 600,
                            textTransform: 'none',
                            color: 'text.secondary',
                            '&:hover': {
                                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
                            }
                        },
                        '& .Mui-selected': {
                            color: 'primary.main'
                        },
                        '& .MuiTabs-indicator': {
                            height: 3,
                            bgcolor: 'primary.main'
                        }
                    }}
                >
                    <Tab icon={<Air />} label="Breathe" iconPosition="start" />
                    <Tab icon={<Psychology />} label="Talk" iconPosition="start" />
                </Tabs>
            </Paper>

            {/* Tab Content */}
            <Box sx={{ mt: 3 }}>
                {/* Breathing Tab */}
                {activeTab === 0 && (
                    <Paper
                        elevation={isDark ? 0 : 1}
                        sx={{
                            p: 4,
                            borderRadius: 3,
                            border: isDark ? '1px solid' : 'none',
                            borderColor: 'divider'
                        }}
                    >
                        <Typography variant="h6" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
                            🌬️ Breathing Exercises
                        </Typography>
                        <BreathingExercise />
                    </Paper>
                )}

                {/* Talk Tab - Wellness Companion */}
                {activeTab === 1 && (
                    <Box>
                        <WellnessCounselor />
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default WellnessCheckin;
