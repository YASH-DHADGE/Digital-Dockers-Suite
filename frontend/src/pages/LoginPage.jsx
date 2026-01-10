import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Box, Button, TextField, Typography, Container, Paper,
    Alert, CircularProgress, InputAdornment, IconButton, Grid, useTheme, useMediaQuery
} from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff, Business, ArrowForward } from '@mui/icons-material';
import { toast } from 'react-toastify';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import GlassCard from '../components/common/GlassCard';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (err) {
            setError(err);
            toast.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Grid container sx={{ minHeight: '100vh', overflow: 'hidden' }}>
            {/* Left Side - Form */}
            <Grid item xs={12} md={5} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', p: 4, bgcolor: 'background.paper', zIndex: 2 }}>
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <Box sx={{ maxWidth: 450, mx: 'auto', width: '100%' }}>
                        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Business sx={{ color: 'primary.main', fontSize: 32 }} />
                            <Typography variant="h5" fontWeight={700} color="primary.main">
                                Digital Dockers
                            </Typography>
                        </Box>

                        <Typography variant="h3" fontWeight={800} gutterBottom sx={{ background: 'linear-gradient(45deg, #4f46e5, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Welcome Back
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                            Please enter your details to access your dashboard.
                        </Typography>

                        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                        <Box component="form" onSubmit={handleSubmit} noValidate>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="email"
                                label="Email Address"
                                name="email"
                                autoComplete="email"
                                autoFocus
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={loading}
                                endIcon={!loading && <ArrowForward />}
                                sx={{
                                    mt: 4,
                                    mb: 2,
                                    py: 1.5,
                                    borderRadius: 3,
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                    boxShadow: '0 10px 20px -5px rgba(79, 70, 229, 0.4)'
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                            </Button>

                            <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
                                <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
                                <Typography variant="caption" sx={{ px: 2, color: 'text.secondary' }}>OR</Typography>
                                <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
                            </Box>

                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'}
                                sx={{ py: 1.5, borderRadius: 3, borderColor: 'divider', color: 'text.primary' }}
                                startIcon={
                                    <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /><path fill="none" d="M0 0h48v48H0z" /></svg>
                                }
                            >
                                Sign in with Google
                            </Button>

                            <Box sx={{ mt: 3, textAlign: 'center' }}>
                                <Link to="/register" style={{ textDecoration: 'none', color: '#4f46e5', fontWeight: 500 }}>
                                    Don't have an account? Sign Up
                                </Link>
                            </Box>
                        </Box>
                    </Box>
                </motion.div>
            </Grid>

            {/* Right Side - Visual */}
            {!isMobile && (
                <Grid item md={7} sx={{ position: 'relative', bgcolor: '#0f172a', overflow: 'hidden' }}>
                    <Box sx={{
                        position: 'absolute',
                        top: 0, left: 0, width: '100%', height: '100%',
                        background: 'radial-gradient(circle at 10% 20%, rgb(79, 70, 229) 0%, rgb(15, 23, 42) 70%)',
                        opacity: 0.8
                    }} />
                    {/* Animated shapes */}
                    <Box sx={{
                        position: 'absolute', top: '20%', left: '20%', width: 300, height: 300,
                        background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                        filter: 'blur(80px)', borderRadius: '50%',
                        animation: 'float 12s infinite ease-in-out, subtleGlow 4s infinite ease-in-out'
                    }} />
                    <Box sx={{
                        position: 'absolute', bottom: '10%', right: '10%', width: 250, height: 250,
                        background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                        filter: 'blur(60px)', borderRadius: '50%',
                        animation: 'floatReverse 15s infinite ease-in-out, subtleGlow 5s infinite ease-in-out'
                    }} />

                    <Box sx={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', p: 8 }}>
                        <GlassCard sx={{ p: 4, maxWidth: 500, backdropFilter: 'blur(20px)', bgcolor: 'rgba(255,255,255,0.1)' }}>
                            <Typography variant="h4" fontWeight={700} color="white" gutterBottom>
                                "The best workspace solution we've ever used."
                            </Typography>
                            <Typography variant="h6" color="rgba(255,255,255,0.7)" sx={{ mt: 2 }}>
                                Streamline your workflow with AI insights, automated reporting, and unified communication.
                            </Typography>
                        </GlassCard>
                    </Box>
                </Grid>
            )}
        </Grid>
    );
};

export default LoginPage;
