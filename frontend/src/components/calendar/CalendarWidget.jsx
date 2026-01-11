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
    Chip
} from '@mui/material';
import { CalendarToday, VideoCameraFront, Event } from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const CalendarWidget = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEvents = async () => {
            if (!user?.googleId) {
                setLoading(false);
                return;
            }

            try {
                const res = await api.get('/calendar/events');
                setEvents(res.data);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch calendar events", err);
                setError("Could not load events. Please try reconnecting your account.");
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [user]);

    if (!user?.googleId) {
        return (
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 2 }}>
                <Event sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>Google Calendar</Typography>
                <Typography variant="body2" color="text.secondary" align="center" paragraph>
                    Connect your Google account to see your upcoming meetings here.
                </Typography>
                <Button variant="outlined" href={`${import.meta.env.VITE_API_URL || ''}/api/auth/google`}>
                    Connect Google
                </Button>
            </Card>
        );
    }

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Upcoming Events</Typography>
                    <Chip label="Today" size="small" color="primary" variant="outlined" />
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : error ? (
                    <Typography color="error" variant="body2">{error}</Typography>
                ) : events.length === 0 ? (
                    <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                        No upcoming events provided.
                    </Typography>
                ) : (
                    <List disablePadding>
                        {events.map((event) => (
                            <ListItem
                                key={event.id}
                                disableGutters
                                sx={{
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    '&:last-child': { borderBottom: 'none' },
                                    py: 1.5
                                }}
                                secondaryAction={
                                    event.meetLink && (
                                        <Button
                                            size="small"
                                            startIcon={<VideoCameraFront />}
                                            href={event.meetLink}
                                            target="_blank"
                                            variant="soft"
                                        >
                                            Join
                                        </Button>
                                    )
                                }
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            bgcolor: 'action.hover',
                                            borderRadius: 1,
                                            p: 0.5,
                                            width: 40
                                        }}
                                    >
                                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                            {format(new Date(event.start), 'MMM')}
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                            {format(new Date(event.start), 'd')}
                                        </Typography>
                                    </Box>
                                </ListItemIcon>
                                <ListItemText
                                    primary={event.title}
                                    secondary={format(new Date(event.start), 'h:mm a')}
                                    primaryTypographyProps={{ variant: 'subtitle2', noWrap: true }}
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </CardContent>
        </Card>
    );
};

export default CalendarWidget;
