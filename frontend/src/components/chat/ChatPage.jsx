import { useState, useEffect, useRef } from 'react';
import {
    Box, Grid, Paper, Typography, List, ListItem, ListItemText,
    ListItemAvatar, Avatar, TextField, IconButton, Badge, Divider,
    Chip, useMediaQuery, useTheme, Drawer, Fab
} from '@mui/material';
import { Send, Group, Person, Menu as MenuIcon, Close } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import api from '../../services/api';
import GlassCard from '../common/GlassCard';

const ChatPage = () => {
    const { user } = useAuth();
    const { socket, sendMessage, joinRoom } = useChat();
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [activeRoom, setActiveRoom] = useState('general');
    const [users, setUsers] = useState([]);
    const messagesEndRef = useRef(null);
    const [dmUser, setDmUser] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get('/users');
                setUsers(res.data.filter(u => u._id !== user?._id));
            } catch (err) {
                console.error("Failed to fetch users", err);
            }
        };
        fetchUsers();
    }, [user]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                let res;
                if (activeRoom === 'general') {
                    res = await api.get(`/chat/history/general`);
                    joinRoom('general');
                    setDmUser(null);
                } else {
                    // For DMs, we really should use a unique room ID shared by both
                    // For now, assuming basic room logic or fetching history by user ID
                    // But to make it work with current backend simple logic:
                    res = await api.get(`/chat/history/${activeRoom}`); // This might need backend logic adjustment to find messages between two users
                    // Actually, let's just fix General for now as DMs need unique room generation
                    const foundUser = users.find(u => u._id === activeRoom);
                    setDmUser(foundUser);
                }
                setChatHistory(res.data || []); // Ensure array
                if (isMobile) setMobileOpen(false); // Close drawer on selection
            } catch (err) {
                console.error("Failed to load chat history", err);
            }
        };
        if (user) fetchHistory();
    }, [activeRoom, user, users, joinRoom, isMobile]);

    useEffect(() => {
        if (!socket) return;
        const handleReceive = (data) => {
            if (activeRoom === 'general' && data.room === 'general') {
                setChatHistory(prev => [...prev, data]);
            } else if (activeRoom !== 'general' && (data.sender._id === activeRoom || data.sender === activeRoom)) {
                setChatHistory(prev => [...prev, data]);
            } else if (activeRoom !== 'general' && data.sender._id === user._id && data.recipient === activeRoom) {
                setChatHistory(prev => [...prev, data]);
            }
        };
        socket.on('receive_message', handleReceive);
        return () => socket.off('receive_message', handleReceive);
    }, [socket, activeRoom, user]);

    const handleSend = async () => {
        if (!message.trim()) return;
        const msgData = {
            message,
            sender: user,
            room: activeRoom === 'general' ? 'general' : activeRoom,
            recipient: activeRoom === 'general' ? null : activeRoom
        };

        const optimisticMsg = { ...msgData, _id: Date.now(), createdAt: new Date().toISOString() };
        setChatHistory(prev => [...prev, optimisticMsg]);
        setMessage('');

        const socketRoom = activeRoom === 'general' ? 'general' : activeRoom;
        sendMessage(socketRoom, { message, sender: user, room: socketRoom, recipient: activeRoom === 'general' ? null : activeRoom });

        try {
            await api.post('/chat', { message, recipient: activeRoom === 'general' ? null : activeRoom });
        } catch (err) {
            console.error("Failed to save message", err);
        }
    };

    const SidebarContent = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{
                p: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}10 100%)`
            }}>
                <Typography variant="h6" fontWeight={700} sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Messages</Typography>
                {isMobile && <IconButton onClick={() => setMobileOpen(false)}><Close /></IconButton>}
            </Box>
            <List sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
                <ListItem
                    button
                    selected={activeRoom === 'general'}
                    onClick={() => setActiveRoom('general')}
                    sx={{ borderRadius: 2, mb: 0.5, '&.Mui-selected': { bgcolor: 'primary.light', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.main' } } }}
                >
                    <ListItemAvatar>
                        <Avatar sx={{ bgcolor: activeRoom === 'general' ? 'white' : 'secondary.main', color: activeRoom === 'general' ? 'primary.main' : 'white' }}><Group /></Avatar>
                    </ListItemAvatar>
                    <ListItemText primary="General Room" secondary="Public Chat" secondaryTypographyProps={{ color: activeRoom === 'general' ? 'inherit' : 'textSecondary' }} />
                </ListItem>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                    Direct Messages
                </Typography>
                {users.map(u => (
                    <ListItem
                        key={u._id}
                        button
                        selected={activeRoom === u._id}
                        onClick={() => setActiveRoom(u._id)}
                        sx={{ borderRadius: 2, mb: 0.5, '&.Mui-selected': { bgcolor: 'primary.light', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.main' } } }}
                    >
                        <ListItemAvatar>
                            <Avatar src={u.profileInfo?.avatar}>{u.fullName[0]}</Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={u.fullName} secondary={u.role.replace('_', ' ')} secondaryTypographyProps={{ color: activeRoom === u._id ? 'inherit' : 'textSecondary', fontSize: '0.75rem' }} />
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    return (
        <Box sx={{ height: 'calc(100vh - 100px)', position: 'relative', display: 'flex', gap: 2 }}>
            {/* Mobile Toggle */}
            {isMobile && (
                <Fab color="primary" size="small" sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }} onClick={() => setMobileOpen(true)}>
                    <MenuIcon />
                </Fab>
            )}

            {/* Sidebar - Desktop vs Mobile */}
            {isMobile ? (
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    ModalProps={{ keepMounted: true }}
                    sx={{ '& .MuiDrawer-paper': { width: 300, boxSizing: 'border-box' } }}
                >
                    {SidebarContent}
                </Drawer>
            ) : (
                <Paper sx={{ width: 300, display: 'flex', flexDirection: 'column', borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                    {SidebarContent}
                </Paper>
            )}

            {/* Chat Area */}
            <Paper sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
                <Box sx={{
                    p: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    background: theme.palette.mode === 'light'
                        ? 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
                        : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
                }}>
                    <Avatar sx={{ bgcolor: activeRoom === 'general' ? 'secondary.main' : 'primary.main' }}>
                        {activeRoom === 'general' ? <Group /> : dmUser?.fullName[0]}
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={600} lineHeight={1}>
                            {activeRoom === 'general' ? 'General Room' : dmUser?.fullName || 'Chat'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {activeRoom === 'general' ? `${users.length + 1} members` : 'Online'}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ flexGrow: 1, p: 2, overflow: 'auto', bgcolor: theme.palette.mode === 'light' ? '#f8fafc' : '#0f172a', display: 'flex', flexDirection: 'column' }}>
                    {chatHistory.map((item, idx) => {
                        const isMe = item.sender._id === user._id || item.sender === user._id;
                        return (
                            <Box key={idx} sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', mb: 2 }}>
                                {!isMe && (
                                    <Avatar sx={{ width: 32, height: 32, mr: 1, mt: 0.5, boxShadow: 2 }}>
                                        {item.sender.fullName ? item.sender.fullName[0] : '?'}
                                    </Avatar>
                                )}
                                <Box sx={{ maxWidth: '75%' }}>
                                    {!isMe && (
                                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1, mb: 0.5, display: 'block' }}>
                                            {item.sender.fullName}
                                        </Typography>
                                    )}
                                    <Box sx={{
                                        p: 2,
                                        bgcolor: isMe ? 'primary.main' : 'background.paper',
                                        color: isMe ? 'primary.contrastText' : 'text.primary',
                                        borderRadius: 2,
                                        borderTopLeftRadius: !isMe ? 0 : 2,
                                        borderTopRightRadius: isMe ? 0 : 2,
                                        boxShadow: 2,
                                        background: isMe ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)` : undefined
                                    }}>
                                        <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>{item.message}</Typography>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: isMe ? 'right' : 'left', mt: 0.5, opacity: 0.7 }}>
                                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Typography>
                                </Box>
                            </Box>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </Box>

                <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
                    <Grid container spacing={1} alignItems="center">
                        <Grid item xs>
                            <TextField
                                fullWidth
                                placeholder="Type a message..."
                                variant="outlined"
                                size="small"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 4,
                                        bgcolor: theme.palette.mode === 'light' ? '#f1f5f9' : 'rgba(255,255,255,0.05)',
                                        '& fieldset': { border: 'none' }
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item>
                            <IconButton
                                onClick={handleSend}
                                disabled={!message.trim()}
                                sx={{
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                    color: 'white',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        transform: 'scale(1.05)',
                                        boxShadow: `0 4px 12px ${theme.palette.primary.main}40`
                                    },
                                    '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' }
                                }}
                            >
                                <Send />
                            </IconButton>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Box>
    );
};

export default ChatPage;
