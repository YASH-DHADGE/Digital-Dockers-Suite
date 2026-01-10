import { useState, useRef, useEffect } from 'react';
import { Button, Input, Card, Avatar, Typography, Tooltip, FloatButton } from 'antd';
import {
    MessageOutlined,
    SendOutlined,
    CloseOutlined,
    RobotOutlined,
    UserOutlined,
    LoadingOutlined
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { AnimatePresence, motion } from 'framer-motion';

const { Text } = Typography;
const CHATBOT_API = 'http://localhost:5000/chat';

const ChatbotWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            type: 'bot',
            content: 'Hello! I am your AI assistant. How can I help you today?',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMessage = {
            type: 'user',
            content: inputValue,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await fetch(CHATBOT_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage.content,
                    session_id: 'user-session-' + Date.now() // Simple session ID
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch response');
            }

            const data = await response.json();

            setMessages(prev => [...prev, {
                type: 'bot',
                content: data.response,
                timestamp: new Date()
            }]);

        } catch (error) {
            console.error('Chatbot Error:', error);
            setMessages(prev => [...prev, {
                type: 'bot',
                content: 'Sorry, I encounted an error connecting to the AI server. Please ensure the agentic-chatbot backend is running on port 5000.',
                isError: true,
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        style={{ marginBottom: 16 }}
                    >
                        <Card
                            styles={{ body: { padding: 0 } }}
                            style={{
                                width: 350,
                                height: 500,
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                                border: '1px solid rgba(0,0,0,0.06)',
                                overflow: 'hidden'
                            }}
                            title={
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Avatar size="small" icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />
                                    <span>AI Assistant</span>
                                </div>
                            }
                            extra={
                                <Button
                                    type="text"
                                    icon={<CloseOutlined />}
                                    onClick={() => setIsOpen(false)}
                                    size="small"
                                />
                            }
                        >
                            {/* Messages Area */}
                            <div style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: 16,
                                background: '#f5f5f5',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 12
                            }}>
                                {messages.map((msg, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            display: 'flex',
                                            justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                                        }}
                                    >
                                        <div style={{
                                            maxWidth: '85%',
                                            padding: '8px 12px',
                                            borderRadius: 12,
                                            borderBottomRightRadius: msg.type === 'user' ? 2 : 12,
                                            borderBottomLeftRadius: msg.type === 'bot' ? 2 : 12,
                                            background: msg.type === 'user' ? '#1890ff' : '#fff',
                                            color: msg.type === 'user' ? '#fff' : 'rgba(0,0,0,0.85)',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                            border: msg.type === 'bot' ? '1px solid #f0f0f0' : 'none'
                                        }}>
                                            {msg.type === 'bot' ? (
                                                <div className="markdown-content" style={{ fontSize: 13 }}>
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: 13 }}>{msg.content}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                        <div style={{
                                            padding: '8px 12px',
                                            background: '#fff',
                                            borderRadius: 12,
                                            borderBottomLeftRadius: 2
                                        }}>
                                            <LoadingOutlined style={{ color: '#1890ff' }} />
                                            <span style={{ marginLeft: 8, fontSize: 12, color: '#999' }}>Thinking...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div style={{ padding: 12, borderTop: '1px solid #f0f0f0', background: '#fff' }}>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <Input
                                        placeholder="Type your message..."
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        disabled={isLoading}
                                        variant="filled"
                                        style={{ borderRadius: 20 }}
                                    />
                                    <Button
                                        type="primary"
                                        shape="circle"
                                        icon={<SendOutlined />}
                                        onClick={handleSend}
                                        loading={isLoading}
                                    />
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <FloatButton
                type="primary"
                icon={isOpen ? <CloseOutlined /> : <MessageOutlined />}
                onClick={() => setIsOpen(!isOpen)}
                style={{ width: 56, height: 56 }}
                tooltip={!isOpen ? "Chat with AI" : undefined}
            />
        </div>
    );
};

export default ChatbotWidget;
