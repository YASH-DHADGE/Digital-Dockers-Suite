import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Button,
    Box,
    CircularProgress,
    Avatar
} from '@mui/material';
import { Mail, ConnectWithoutContact } from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const EmailListWidget = () => {
    const { user } = useAuth();
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEmails = async () => {
            if (!user?.googleId) {
                setLoading(false);
                return;
            }

            try {
                const res = await api.get('/emails/inbox');
                setEmails(res.data);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch inbox", err);
                setError("Could not load emails.");
            } finally {
                setLoading(false);
            }
        };

        fetchEmails();
    }, [user]);

    if (!user?.googleId) {
        return (
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 2 }}>
                <Mail sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>Gmail Inbox</Typography>
                <Typography variant="body2" color="text.secondary" align="center" paragraph>
                    Connect your Google account to manage your emails.
                </Typography>
                <Button variant="outlined" href={`${import.meta.env.VITE_API_URL || ''}/api/auth/google`}>
                    Connect Gmail
                </Button>
            </Card>
        );
    }

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Recent Emails</Typography>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : error ? (
                    <Typography color="error" variant="body2">{error}</Typography>
                ) : emails.length === 0 ? (
                    <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                        Inbox is empty.
                    </Typography>
                ) : (
                    <List disablePadding>
                        {emails.map((email) => (
                            <ListItem
                                key={email.id}
                                disableGutters
                                sx={{
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    '&:last-child': { borderBottom: 'none' },
                                    py: 1.5
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: 14 }}>
                                        {email.from.charAt(0).toUpperCase()}
                                    </Avatar>
                                </ListItemIcon>
                                <ListItemText
                                    primary={email.subject}
                                    secondary={
                                        <>
                                            <Typography component="span" variant="caption" sx={{ display: 'block', fontWeight: 'bold' }}>
                                                {email.from.replace(/<.*>/, '').trim()}
                                            </Typography>
                                            <Typography component="span" variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 200 }}>
                                                {email.snippet}
                                            </Typography>
                                        </>
                                    }
                                    primaryTypographyProps={{ variant: 'subtitle2', noWrap: true }}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 1, whiteSpace: 'nowrap' }}>
                                    {email.date ? format(new Date(email.date), 'MMM d') : ''}
                                </Typography>
                            </ListItem>
                        ))}
                    </List>
                )}
            </CardContent>
        </Card>
    );
};

export default EmailListWidget;
