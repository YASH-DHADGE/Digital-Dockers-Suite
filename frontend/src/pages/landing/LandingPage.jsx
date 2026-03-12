import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AppBar,
    Box,
    Button,
    Chip,
    Container,
    Divider,
    Grid,
    IconButton,
    Paper,
    Stack,
    Toolbar,
    Typography
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Menu as MenuIcon, Close as CloseIcon, ArrowForward } from '@mui/icons-material';
import {
    Brain,
    CheckSquare,
    FileText,
    Mail,
    MessageSquare,
    Presentation,
    Shield,
    Sparkles,
    TrendingUp,
    Users,
    Video,
    Zap
} from 'lucide-react';

const NAV_ITEMS = [
    { id: 'features', label: 'Features' },
    { id: 'workflow', label: 'Workflow' },
    { id: 'cta', label: 'Get Started' }
];

const FEATURE_ITEMS = [
    {
        title: 'AutoMail Engine',
        description: 'Generate clear, professional emails quickly for updates, follow-ups, and stakeholder communication.',
        icon: Mail,
        tone: 'primary'
    },
    {
        title: 'Emotion Analytics',
        description: 'Understand message sentiment and communication tone to improve collaboration and reduce friction.',
        icon: Brain,
        tone: 'success'
    },
    {
        title: 'TaskPilot AI',
        description: 'Prioritize and organize work intelligently based on status, deadlines, and team context.',
        icon: CheckSquare,
        tone: 'secondary'
    },
    {
        title: 'SlideForge AI',
        description: 'Build presentation-ready decks from your project data and narratives in a few clicks.',
        icon: Presentation,
        tone: 'warning'
    },
    {
        title: 'SmartDock Assistant',
        description: 'Use a context-aware assistant for instant answers, summaries, and daily productivity support.',
        icon: MessageSquare,
        tone: 'error'
    },
    {
        title: 'DocSummary Engine',
        description: 'Convert long documents into concise action items, decisions, and key takeaways.',
        icon: FileText,
        tone: 'info'
    },
    {
        title: 'Meeting Insights',
        description: 'Transform meeting content into structured summaries, responsibilities, and next steps.',
        icon: Video,
        tone: 'primary'
    }
];

const WORKFLOW_STEPS = [
    {
        title: 'Plan Together',
        description: 'Align teams with shared tasks, backlog visibility, and roadmap clarity.',
        icon: Users
    },
    {
        title: 'Execute Faster',
        description: 'Automate repetitive communication and keep delivery flowing with AI assistance.',
        icon: Zap
    },
    {
        title: 'Track Confidently',
        description: 'Use live dashboards and reports to monitor team health and project progress.',
        icon: TrendingUp
    }
];

const KPI_ITEMS = [
    { value: '7', label: 'AI Engines' },
    { value: '10x', label: 'Faster Workflows' },
    { value: '24/7', label: 'AI Assistant' }
];

const LandingPage = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 12);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollToSection = (id) => {
        const section = document.getElementById(id);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setMobileMenuOpen(false);
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                color: 'text.primary',
                background: isDark
                    ? `radial-gradient(1200px 500px at 50% -5%, ${alpha(theme.palette.primary.main, 0.25)} 0%, transparent 70%), ${theme.palette.background.default}`
                    : `radial-gradient(1200px 500px at 50% -5%, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%), ${theme.palette.background.default}`
            }}
        >
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    bgcolor: isScrolled ? alpha(theme.palette.background.paper, isDark ? 0.9 : 0.92) : 'transparent',
                    color: 'text.primary',
                    backdropFilter: isScrolled ? 'blur(14px)' : 'none',
                    borderBottom: `1px solid ${isScrolled ? alpha(theme.palette.divider, 0.9) : 'transparent'}`,
                    transition: 'all 0.2s ease'
                }}
            >
                <Container maxWidth="lg">
                    <Toolbar disableGutters sx={{ minHeight: 72 }}>
                        <Box
                            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', flexGrow: 1 }}
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        >
                            <Box
                                sx={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '10px',
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                                    <path d="M16 2L2 10L16 18L30 10L16 2Z" fill="rgba(255,255,255,0.9)" />
                                    <path d="M2 10V22L16 30L30 22V10L16 18L2 10Z" fill="rgba(255,255,255,0.65)" />
                                </svg>
                            </Box>
                            <Typography sx={{ fontSize: '1.15rem', fontWeight: 700 }}>
                                Digital Dockers
                            </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }}>
                            {NAV_ITEMS.map((item) => (
                                <Button
                                    key={item.id}
                                    color="inherit"
                                    onClick={() => scrollToSection(item.id)}
                                    sx={{ color: 'text.secondary', fontWeight: 500 }}
                                >
                                    {item.label}
                                </Button>
                            ))}
                        </Stack>

                        <Stack direction="row" spacing={1.2} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                            <Button variant="text" color="inherit" onClick={() => navigate('/login')}>
                                Sign In
                            </Button>
                            <Button variant="contained" onClick={() => navigate('/register')}>
                                Create Account
                            </Button>
                        </Stack>

                        <IconButton
                            onClick={() => setMobileMenuOpen((prev) => !prev)}
                            sx={{ display: { xs: 'inline-flex', md: 'none' }, ml: 1 }}
                            aria-label="toggle navigation menu"
                        >
                            {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
                        </IconButton>
                    </Toolbar>

                    {mobileMenuOpen && (
                        <Paper
                            elevation={0}
                            sx={{
                                display: { md: 'none' },
                                mb: 1.5,
                                p: 2,
                                borderRadius: 2,
                                border: `1px solid ${theme.palette.divider}`,
                                bgcolor: 'background.paper'
                            }}
                        >
                            <Stack spacing={1}>
                                {NAV_ITEMS.map((item) => (
                                    <Button
                                        key={item.id}
                                        onClick={() => scrollToSection(item.id)}
                                        sx={{ justifyContent: 'flex-start', color: 'text.secondary' }}
                                    >
                                        {item.label}
                                    </Button>
                                ))}
                                <Divider sx={{ my: 0.5 }} />
                                <Button onClick={() => navigate('/login')} sx={{ justifyContent: 'flex-start' }}>
                                    Sign In
                                </Button>
                                <Button variant="contained" onClick={() => navigate('/register')}>
                                    Create Account
                                </Button>
                            </Stack>
                        </Paper>
                    )}
                </Container>
            </AppBar>

            <Box component="section" sx={{ pt: { xs: 13, md: 15 }, pb: { xs: 7, md: 10 } }}>
                <Container maxWidth="lg">
                    <Grid container spacing={{ xs: 3, md: 4 }} alignItems="stretch">
                        <Grid item xs={12} md={7}>
                            <Stack spacing={3} sx={{ height: '100%', justifyContent: 'center' }}>
                                <Chip
                                    icon={<Sparkles size={14} />}
                                    label="AI-powered productivity suite"
                                    sx={{
                                        width: 'fit-content',
                                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                                        color: 'text.primary',
                                        border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`
                                    }}
                                />

                                <Typography
                                    variant="h2"
                                    sx={{
                                        fontWeight: 800,
                                        lineHeight: 1.15,
                                        letterSpacing: '-0.02em',
                                        maxWidth: 700
                                    }}
                                >
                                    Plan smarter, move faster, and deliver better with Digital Dockers.
                                </Typography>

                                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 650, lineHeight: 1.8 }}>
                                    Manage tasks, meetings, communication, and reporting in one collaborative workspace powered by practical AI tools.
                                </Typography>

                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        endIcon={<ArrowForward />}
                                        onClick={() => navigate('/register')}
                                    >
                                        Start Free
                                    </Button>
                                    <Button variant="outlined" size="large" onClick={() => navigate('/login')}>
                                        Sign In
                                    </Button>
                                </Stack>

                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2.25,
                                        borderRadius: 3,
                                        border: `1px solid ${theme.palette.divider}`,
                                        bgcolor: alpha(theme.palette.background.paper, isDark ? 0.72 : 0.88)
                                    }}
                                >
                                    <Grid container>
                                        {KPI_ITEMS.map((item, index) => (
                                            <Grid item xs={4} key={item.label}>
                                                <Box
                                                    sx={{
                                                        textAlign: 'center',
                                                        px: { xs: 0.5, sm: 1 },
                                                        borderRight: index < KPI_ITEMS.length - 1 ? `1px solid ${theme.palette.divider}` : 'none'
                                                    }}
                                                >
                                                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                                        {item.value}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '0.03em' }}>
                                                        {item.label}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Paper>
                            </Stack>
                        </Grid>

                        <Grid item xs={12} md={5}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: { xs: 2.2, md: 2.8 },
                                    borderRadius: 3,
                                    border: `1px solid ${theme.palette.divider}`,
                                    bgcolor: alpha(theme.palette.background.paper, isDark ? 0.74 : 0.9),
                                    height: '100%'
                                }}
                            >
                                <Typography variant="h6" sx={{ mb: 0.75 }}>
                                    Everything in one workflow hub
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.2 }}>
                                    Built to match how your team already works across planning, execution, and reporting.
                                </Typography>

                                <Stack spacing={1.3}>
                                    {FEATURE_ITEMS.slice(0, 4).map((feature) => {
                                        const Icon = feature.icon;
                                        const accent = theme.palette[feature.tone]?.main || theme.palette.primary.main;

                                        return (
                                            <Box
                                                key={feature.title}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1.2,
                                                    p: 1.25,
                                                    borderRadius: 2,
                                                    border: `1px solid ${alpha(accent, 0.28)}`,
                                                    bgcolor: alpha(accent, isDark ? 0.12 : 0.07)
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        width: 34,
                                                        height: 34,
                                                        borderRadius: 1.5,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: accent,
                                                        bgcolor: alpha(accent, isDark ? 0.25 : 0.15)
                                                    }}
                                                >
                                                    <Icon size={17} />
                                                </Box>
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {feature.title}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                                                        {feature.description}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            <Box id="features" component="section" sx={{ py: { xs: 7, md: 10 } }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 5 } }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1.25 }}>
                            Core capabilities aligned with your team flow
                        </Typography>
                        <Typography color="text.secondary" sx={{ maxWidth: 760, mx: 'auto' }}>
                            Use focused AI modules for communication, planning, document work, and execution tracking without switching between tools.
                        </Typography>
                    </Box>

                    <Grid container spacing={2.2}>
                        {FEATURE_ITEMS.map((feature) => {
                            const Icon = feature.icon;
                            const accent = theme.palette[feature.tone]?.main || theme.palette.primary.main;

                            return (
                                <Grid item xs={12} sm={6} md={4} key={feature.title}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2.4,
                                            borderRadius: 3,
                                            border: `1px solid ${theme.palette.divider}`,
                                            bgcolor: alpha(theme.palette.background.paper, isDark ? 0.74 : 0.9),
                                            height: '100%',
                                            transition: 'transform 0.2s ease, border-color 0.2s ease',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                borderColor: alpha(accent, 0.45)
                                            }
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: accent,
                                                bgcolor: alpha(accent, isDark ? 0.24 : 0.13),
                                                mb: 1.6
                                            }}
                                        >
                                            <Icon size={20} />
                                        </Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.6 }}>
                                            {feature.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                            {feature.description}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Container>
            </Box>

            <Box id="workflow" component="section" sx={{ pb: { xs: 7, md: 9 } }}>
                <Container maxWidth="lg">
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2.2, md: 3 },
                            borderRadius: 3,
                            border: `1px solid ${theme.palette.divider}`,
                            bgcolor: alpha(theme.palette.background.paper, isDark ? 0.72 : 0.9)
                        }}
                    >
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2.5 }}>
                            Designed for real delivery teams
                        </Typography>
                        <Grid container spacing={2}>
                            {WORKFLOW_STEPS.map((step) => {
                                const Icon = step.icon;
                                return (
                                    <Grid item xs={12} md={4} key={step.title}>
                                        <Box
                                            sx={{
                                                p: 2,
                                                borderRadius: 2,
                                                border: `1px solid ${theme.palette.divider}`,
                                                height: '100%'
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: 1.5,
                                                    bgcolor: alpha(theme.palette.primary.main, isDark ? 0.25 : 0.12),
                                                    color: 'primary.main',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    mb: 1.2
                                                }}
                                            >
                                                <Icon size={18} />
                                            </Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.6 }}>
                                                {step.title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                                {step.description}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </Paper>
                </Container>
            </Box>

            <Box id="cta" component="section" sx={{ pb: { xs: 7, md: 10 } }}>
                <Container maxWidth="lg">
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2.5, md: 4 },
                            borderRadius: 3,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
                            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, isDark ? 0.32 : 0.12)} 0%, ${alpha(theme.palette.secondary.main, isDark ? 0.2 : 0.1)} 100%)`
                        }}
                    >
                        <Stack spacing={2} sx={{ textAlign: 'center', alignItems: 'center' }}>
                            <Chip icon={<Shield size={14} />} label="Secure. Scalable. Team-ready." />
                            <Typography variant="h4" sx={{ fontWeight: 700, maxWidth: 760 }}>
                                Bring planning, execution, and AI assistance into one consistent workspace.
                            </Typography>
                            <Typography color="text.secondary" sx={{ maxWidth: 720 }}>
                                Create your workspace in minutes and start collaborating with the same UI patterns your team uses across the platform.
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.4}>
                                <Button variant="contained" size="large" onClick={() => navigate('/register')}>
                                    Create Account
                                </Button>
                                <Button variant="outlined" size="large" onClick={() => navigate('/login')}>
                                    Sign In
                                </Button>
                            </Stack>
                        </Stack>
                    </Paper>
                </Container>
            </Box>

            <Box component="footer" sx={{ pb: 3 }}>
                <Container maxWidth="lg">
                    <Divider sx={{ mb: 2.5 }} />
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        alignItems={{ xs: 'flex-start', md: 'center' }}
                        justifyContent="space-between"
                        spacing={1.5}
                    >
                        <Typography variant="body2" color="text.secondary">
                            © {new Date().getFullYear()} Digital Dockers. All rights reserved.
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <Button size="small" onClick={() => scrollToSection('features')}>Features</Button>
                            <Button size="small" onClick={() => scrollToSection('workflow')}>Workflow</Button>
                            <Button size="small" onClick={() => scrollToSection('cta')}>Start</Button>
                        </Stack>
                    </Stack>
                </Container>
            </Box>
        </Box>
    );
};

export default LandingPage;
