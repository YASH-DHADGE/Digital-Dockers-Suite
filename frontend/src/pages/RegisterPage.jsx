import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Box, Button, TextField, Typography,
    Alert, CircularProgress, InputAdornment, IconButton, MenuItem, Grid, useTheme, useMediaQuery
} from '@mui/material';
import { Email, Lock, Person, Visibility, VisibilityOff, Business, Work, ArrowForward } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import GlassCard from '../components/common/GlassCard';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'technical_team',
        department: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const roles = [
        { value: 'admin', label: 'Administrator' },
        { value: 'project_manager', label: 'Project Manager' },
        { value: 'technical_team', label: 'Technical Team' },
        { value: 'marketing_team', label: 'Marketing Team' },
        { value: 'technical_lead', label: 'Technical Lead' },
        { value: 'marketing_lead', label: 'Marketing Lead' },
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const { confirmPassword: _confirmPassword, ...userData } = formData;
            await register(userData);
            toast.success('Registration Successful!');
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
            <Grid item xs={12} md={5} sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                p: 4,
                bgcolor: 'background.paper',
                zIndex: 2,
                overflowY: 'auto'
            }}>
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <Box sx={{ maxWidth: 450, mx: 'auto', width: '100%' }}>
                        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Business sx={{ color: 'primary.main', fontSize: 32 }} />
                            <Typography variant="h5" fontWeight={700} color="primary.main">
                                Digital Dockers
                            </Typography>
                        </Box>

                        <Typography
                            variant="h3"
                            fontWeight={800}
                            gutterBottom
                            sx={{
                                background: 'linear-gradient(45deg, #4f46e5, #ec4899)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}
                        >
                            Create Account
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            Join the AI-powered workspace revolution.
                        </Typography>

                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                        <Box component="form" onSubmit={handleSubmit} noValidate>
                            <TextField
                                margin="dense"
                                required
                                fullWidth
                                name="fullName"
                                label="Full Name"
                                value={formData.fullName}
                                onChange={handleChange}
                                sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                            />

                            <TextField
                                margin="dense"
                                required
                                fullWidth
                                name="email"
                                label="Email Address"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                            />

                            <TextField
                                margin="dense"
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={handleChange}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                            />

                            <TextField
                                margin="dense"
                                required
                                fullWidth
                                name="confirmPassword"
                                label="Confirm Password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                            />

                            <TextField
                                margin="dense"
                                required
                                fullWidth
                                select
                                name="role"
                                label="Role"
                                value={formData.role}
                                onChange={handleChange}
                                sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                            >
                                {roles.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                margin="dense"
                                fullWidth
                                name="department"
                                label="Department (Optional)"
                                value={formData.department}
                                onChange={handleChange}
                                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={loading}
                                endIcon={!loading && <ArrowForward />}
                                sx={{
                                    mt: 2,
                                    mb: 2,
                                    py: 1.5,
                                    borderRadius: 3,
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                    boxShadow: '0 10px 20px -5px rgba(79, 70, 229, 0.4)'
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
                            </Button>

                            <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
                                <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
                                <Typography variant="caption" sx={{ px: 2, color: 'text.secondary' }}>OR</Typography>
                                <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
                            </Box>

                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || ''}/api/auth/google`}
                                sx={{ py: 1.5, borderRadius: 3, borderColor: 'divider', color: 'text.primary' }}
                                startIcon={
                                    <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /><path fill="none" d="M0 0h48v48H0z" /></svg>
                                }
                            >
                                Sign up with Google
                            </Button>

                            <Box sx={{ mt: 3, textAlign: 'center' }}>
                                <Link to="/login" style={{ textDecoration: 'none', color: '#4f46e5', fontWeight: 500 }}>
                                    Already have an account? Sign In
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
                        background: 'radial-gradient(circle at 90% 80%, rgb(236, 72, 153) 0%, rgb(15, 23, 42) 70%)',
                        opacity: 0.8
                    }} />
                    {/* Animated shapes */}
                    <Box sx={{
                        position: 'absolute', top: '20%', right: '20%', width: 300, height: 300,
                        background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                        filter: 'blur(80px)', borderRadius: '50%',
                        animation: 'float 12s infinite ease-in-out'
                    }} />
                    <Box sx={{
                        position: 'absolute', bottom: '10%', left: '10%', width: 250, height: 250,
                        background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                        filter: 'blur(60px)', borderRadius: '50%',
                        animation: 'floatReverse 15s infinite ease-in-out'
                    }} />

                    <Box sx={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', p: 8 }}>
                        <GlassCard sx={{ p: 4, maxWidth: 500, backdropFilter: 'blur(20px)', bgcolor: 'rgba(255,255,255,0.1)' }}>
                            <Typography variant="h4" fontWeight={700} color="white" gutterBottom>
                                "AI-powered productivity at its finest."
                            </Typography>
                            <Typography variant="h6" color="rgba(255,255,255,0.7)" sx={{ mt: 2 }}>
                                Join thousands of teams already transforming their workflows with Digital Dockers.
                            </Typography>
                            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h3" color="white" fontWeight={700}>10k+</Typography>
                                    <Typography color="rgba(255,255,255,0.6)">Teams</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h3" color="white" fontWeight={700}>50k+</Typography>
                                    <Typography color="rgba(255,255,255,0.6)">Users</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h3" color="white" fontWeight={700}>99%</Typography>
                                    <Typography color="rgba(255,255,255,0.6)">Uptime</Typography>
                                </Box>
                            </Box>
                        </GlassCard>
                    </Box>
                </Grid>
            )}
        </Grid>
    );
};

export default RegisterPage;
