import { useState } from 'react';
import {
    Box, Paper, Typography, Button, CircularProgress, Alert
} from '@mui/material';
import { UploadFile, AutoAwesome, Description } from '@mui/icons-material';
import api from '../../services/api';

const DocumentManager = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setSummary('');
            setError('');
        }
    };

    const handleAnalyze = async () => {
        if (!selectedFile) return;

        setLoading(true);
        setError('');
        setSummary('');

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const res = await api.post('/n8n/analyze', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setSummary(res.data.summary);
        } catch (err) {
            console.error('Analysis error:', err);
            setError(err.response?.data?.message || 'Failed to analyze document. Please check the n8n webhook connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setSelectedFile(null);
        setSummary('');
        setError('');
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    <AutoAwesome sx={{ color: '#4f46e5' }} />
                    AI Document Analyzer
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Upload a document to get an AI-powered summary. Files are sent directly for analysis and are not stored.
                </Typography>
            </Box>

            {/* Upload Section */}
            <Paper
                sx={{
                    p: 4,
                    textAlign: 'center',
                    border: '2px dashed',
                    borderColor: selectedFile ? 'primary.main' : 'divider',
                    bgcolor: selectedFile ? 'action.selected' : 'background.paper',
                    borderRadius: 3,
                    mb: 3,
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                        borderColor: 'primary.light',
                        boxShadow: '0 8px 30px rgba(79, 70, 229, 0.12)'
                    },
                    '&::before': selectedFile ? {} : {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(79, 70, 229, 0.05), transparent)',
                        animation: 'shimmer 2s infinite'
                    }
                }}
            >
                {!selectedFile ? (
                    <>
                        <UploadFile sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            Select a Document
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Supported formats: PDF, DOCX, TXT, PPTX
                        </Typography>
                        <Button variant="contained" component="label" startIcon={<UploadFile />}>
                            Choose File
                            <input type="file" hidden onChange={handleFileSelect} accept=".pdf,.docx,.doc,.txt,.pptx,.ppt" />
                        </Button>
                    </>
                ) : (
                    <>
                        <Description sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            {selectedFile.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {(selectedFile.size / 1024).toFixed(2)} KB
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Button
                                variant="contained"
                                color="secondary"
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesome />}
                                onClick={handleAnalyze}
                                disabled={loading}
                            >
                                {loading ? 'Analyzing...' : 'Analyze with AI'}
                            </Button>
                            <Button variant="outlined" onClick={handleReset} disabled={loading}>
                                Clear
                            </Button>
                        </Box>
                    </>
                )}
            </Paper>

            {/* Error Display */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Summary Display */}
            {summary && (
                <Paper sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'primary.light',
                    boxShadow: '0 4px 20px rgba(79, 70, 229, 0.1)'
                }}>
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 2,
                        background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        <AutoAwesome sx={{ color: '#4f46e5' }} />
                        <Typography variant="h6" fontWeight={600} sx={{
                            background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            AI Summary
                        </Typography>
                    </Box>
                    <Typography
                        variant="body1"
                        sx={{
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.8,
                            color: 'text.primary'
                        }}
                    >
                        {summary}
                    </Typography>
                </Paper>
            )}
        </Box>
    );
};

export default DocumentManager;
