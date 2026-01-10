import { Box, Button, Container, Grid, Typography, useTheme, useMediaQuery, AppBar, Toolbar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Edit, Chat, People, ArrowForward, Business } from '@mui/icons-material';
// eslint-disable-next-line no-unused-vars
import { motion, useScroll, useTransform } from 'framer-motion';
import GlassCard from '../../components/common/GlassCard';

const LandingPage = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { scrollY } = useScroll();
    const yHero = useTransform(scrollY, [0, 500], [0, 150]);

    const features = [
        {
            icon: <Edit fontSize="large" sx={{ color: '#4f46e5' }} />,
            title: 'AI Meeting Summaries',
            description: 'Automatically transcribe and summarize your Google Meets. Never miss a detail.'
        },
        {
            icon: <Chat fontSize="large" sx={{ color: '#ec4899' }} />,
            title: 'Real-time Collaboration',
            description: 'Instant chat and direct messaging for seamless team communication.'
        },
        {
            icon: <People fontSize="large" sx={{ color: '#8b5cf6' }} />,
            title: 'Visual Organization',
            description: 'Interactive organization charts and task visualization for clear hierarchy.'
        }
    ];

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', overflowX: 'hidden' }}>
            {/* Transparent Glass Header */}
            <AppBar position="fixed" elevation={0} sx={{
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(255,255,255,0.08)'
            }}>
                <Container maxWidth="lg">
                    <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Business sx={{ color: '#818cf8', fontSize: 32 }} />
                            <Typography variant="h6" fontWeight={700} sx={{ color: '#ffffff' }}>
                                Digital Dockers
                            </Typography>
                        </Box>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/login')}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                                color: 'white',
                                borderColor: 'rgba(255,255,255,0.3)',
                                '&:hover': { borderColor: 'rgba(255,255,255,0.6)', bgcolor: 'rgba(255,255,255,0.1)' }
                            }}
                        >
                            Sign In
                        </Button>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Hero Section */}
            <Box
                sx={{
                    position: 'relative',
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pt: { xs: 12, md: 0 }, // Add top padding on mobile to avoid overlap with header
                    pb: 10,
                    background: 'radial-gradient(ellipse at 50% 0%, rgba(79, 70, 229, 0.2) 0%, transparent 70%)'
                }}
            >
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto', mb: 8 }}>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <Typography
                                variant="h1"
                                sx={{
                                    fontWeight: 800,
                                    fontSize: { xs: '2.5rem', md: '4.5rem' },
                                    letterSpacing: '-0.02em',
                                    mb: 2,
                                    background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 50%, #f0abfc 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    textShadow: '0 4px 30px rgba(165, 180, 252, 0.3)',
                                }}
                            >
                                Digital Dockers
                            </Typography>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            <Typography
                                variant="h5"
                                sx={{
                                    mb: 6,
                                    fontSize: { xs: '1.1rem', md: '1.4rem' },
                                    fontWeight: 400,
                                    lineHeight: 1.6,
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    maxWidth: 600,
                                    mx: 'auto'
                                }}
                            >
                                The AI-powered workspace that unifies communication, tasks, and insights into one seamless dock.
                            </Typography>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                        >
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexDirection: isMobile ? 'column' : 'row' }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={() => navigate('/login')}
                                    endIcon={<ArrowForward />}
                                    sx={{
                                        py: 2,
                                        px: 4,
                                        fontSize: '1.1rem',
                                        borderRadius: 3,
                                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                        boxShadow: '0 10px 20px -5px rgba(79, 70, 229, 0.4)'
                                    }}
                                >
                                    Get Started
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    sx={{
                                        py: 2,
                                        px: 4,
                                        fontSize: '1.1rem',
                                        borderRadius: 3,
                                        color: 'text.primary',
                                        borderColor: 'divider',
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.5)' }
                                    }}
                                    onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                                >
                                    Learn More
                                </Button>
                            </Box>
                        </motion.div>
                    </Box>

                    {/* Dashboard Preview Image using Motion */}
                    <motion.div style={{ y: yHero }}>
                        <Box
                            sx={{
                                position: 'relative',
                                width: '100%',
                                maxWidth: 1000,
                                mx: 'auto',
                                borderRadius: 4,
                                overflow: 'hidden',
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                                border: '1px solid rgba(255,255,255,0.1)',
                            }}
                        >
                            <Box
                                component="img"
                                src="/dashboard_preview.png"
                                alt="Digital Dockers Dashboard"
                                sx={{
                                    width: '100%',
                                    height: 'auto',
                                    display: 'block',
                                    transform: 'scale(1.0)',
                                    transition: 'transform 0.5s ease',
                                    '&:hover': { transform: 'scale(1.02)' }
                                }}
                            />

                            {/* Glass Overlay Effect */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(15, 23, 42, 0.1) 100%)',
                                    pointerEvents: 'none'
                                }}
                            />
                        </Box>
                    </motion.div>
                </Container>
            </Box>

            {/* Features Section */}
            <Box id="features" sx={{ py: 10, bgcolor: 'transparent' }}>
                <Container maxWidth="lg">
                    <Typography variant="h3" align="center" fontWeight={700} sx={{ mb: 8 }}>
                        Why Digital Dockers?
                    </Typography>
                    <Grid container spacing={4}>
                        {features.map((feature, idx) => (
                            <Grid item xs={12} md={4} key={idx}>
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                                    viewport={{ once: true }}
                                    style={{ height: '100%' }}
                                >
                                    <GlassCard sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                        <Box sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            bgcolor: 'rgba(79, 70, 229, 0.1)',
                                            mb: 3,
                                            display: 'inline-flex'
                                        }}>
                                            {feature.icon}
                                        </Box>
                                        <Typography variant="h5" fontWeight={600} gutterBottom>
                                            {feature.title}
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary">
                                            {feature.description}
                                        </Typography>
                                    </GlassCard>
                                </motion.div>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Footer */}
            <Box sx={{
                py: 6,
                borderTop: '1px solid rgba(255,255,255,0.08)',
                background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, #0f172a 100%)'
            }}>
                <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        © {new Date().getFullYear()} Digital Dockers. Built with AI.
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
};

export default LandingPage;
