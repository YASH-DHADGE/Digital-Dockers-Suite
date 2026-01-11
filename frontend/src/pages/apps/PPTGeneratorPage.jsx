import { useState } from 'react';
import { Typography, Row, Col, Card, Form, Input, Button, Space, message, Spin } from 'antd';
import { FilePptOutlined, CodeOutlined, PlayCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

// N8N Webhook URL for PPT generation
const N8N_WEBHOOK_URL = 'https://rohan-2409.app.n8n.cloud/webhook-test/ppt-generator';

/**
 * Generates ISO 8601 timestamp with timezone offset
 * Example: "2026-01-11T11:02:10.538+05:30"
 */
const getISOWithTimezone = () => {
    const now = new Date();
    const offset = -now.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
    const minutes = String(Math.abs(offset) % 60).padStart(2, '0');

    // Get ISO string without 'Z' and append timezone
    const isoBase = now.toISOString().slice(0, -1);
    return `${isoBase}${sign}${hours}:${minutes}`;
};

const PPTGeneratorPage = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [jsonOutput, setJsonOutput] = useState('');
    const [htmlPreview, setHtmlPreview] = useState('');

    const handleGenerateJSON = async (values) => {
        setLoading(true);
        setJsonOutput('');
        setHtmlPreview('');

        try {
            // Build the payload with exact key names as specified
            const payload = [{
                "Topic": values.topic,
                "Target Audience": values.targetAudience,
                "Key Points to Cover": values.keyPoints,
                "Preferred Color Scheme": values.colorScheme,
                "submittedAt": getISOWithTimezone(),
                "formMode": "test"
            }];

            // Display JSON output
            const prettyJson = JSON.stringify(payload, null, 2);
            setJsonOutput(prettyJson);

            // Send to n8n webhook
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Webhook responded with status ${response.status}`);
            }

            // Get HTML response from n8n
            const htmlContent = await response.text();

            if (htmlContent) {
                setHtmlPreview(htmlContent);
                message.success('PPT template generated successfully!');
            } else {
                message.info('Request sent. No HTML template returned from the workflow.');
            }

        } catch (error) {
            console.error('Error generating PPT:', error);
            message.error('Failed to generate PPT. Please check the webhook or try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 1600, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                }}>
                    <span style={{
                        display: 'flex',
                        padding: 8,
                        background: 'rgba(255, 122, 0, 0.1)',
                        borderRadius: 8,
                        color: '#FF7A00'
                    }}>
                        <FilePptOutlined />
                    </span>
                    AI PPT Generator
                </Title>
                <Text type="secondary" style={{ fontSize: 16, marginTop: 8, display: 'block' }}>
                    Generate professional presentation templates instantly using AI.
                </Text>
            </div>

            <Row gutter={[24, 24]}>
                {/* Left Column - Form & JSON Output */}
                <Col xs={24} lg={12}>
                    <Card
                        style={{
                            borderRadius: 12,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                        }}
                    >
                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                            <div>
                                <Title level={4} style={{
                                    margin: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    background: 'linear-gradient(135deg, #FF7A00, #FF4D4F)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>
                                    <FilePptOutlined style={{ color: '#FF7A00' }} />
                                    Presentation Details
                                </Title>
                                <Text type="secondary">
                                    Fill in the details to generate your presentation
                                </Text>
                            </div>

                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={handleGenerateJSON}
                                requiredMark={false}
                            >
                                <Form.Item
                                    name="topic"
                                    label="Topic"
                                    rules={[{ required: true, message: 'Please enter the presentation topic' }]}
                                >
                                    <Input
                                        placeholder="e.g., AI in Healthcare"
                                        size="large"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="targetAudience"
                                    label="Target Audience"
                                    rules={[{ required: true, message: 'Please enter the target audience' }]}
                                >
                                    <Input
                                        placeholder="e.g., Doctors, Engineers, Students"
                                        size="large"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="keyPoints"
                                    label="Key Points to Cover"
                                    rules={[{ required: true, message: 'Please enter key points to cover' }]}
                                >
                                    <TextArea
                                        rows={4}
                                        placeholder="Enter the main points you want to cover in your presentation..."
                                        style={{ resize: 'vertical' }}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="colorScheme"
                                    label="Preferred Color Scheme"
                                    rules={[{ required: true, message: 'Please enter preferred color scheme' }]}
                                >
                                    <Input
                                        placeholder="e.g., Black and Blue, Professional Dark, Warm Orange"
                                        size="large"
                                    />
                                </Form.Item>

                                <Form.Item style={{ marginBottom: 0 }}>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={loading}
                                        icon={<PlayCircleOutlined />}
                                        size="large"
                                        block
                                        style={{
                                            background: 'linear-gradient(135deg, #FF7A00, #FF4D4F)',
                                            border: 'none',
                                            height: 48
                                        }}
                                    >
                                        {loading ? 'Generating...' : 'Generate JSON'}
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Space>
                    </Card>

                    {/* JSON Output Section */}
                    {jsonOutput && (
                        <Card
                            title={<><CodeOutlined /> Generated JSON</>}
                            style={{
                                marginTop: 24,
                                borderRadius: 12,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                            }}
                        >
                            <pre style={{
                                background: '#1e1e1e',
                                color: '#d4d4d4',
                                padding: 16,
                                borderRadius: 8,
                                overflow: 'auto',
                                maxHeight: 300,
                                fontSize: 13,
                                fontFamily: "'Fira Code', 'Consolas', monospace",
                                margin: 0,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                            }}>
                                {jsonOutput}
                            </pre>
                        </Card>
                    )}
                </Col>

                {/* Right Column - HTML Preview (Slides-like 16:9) */}
                <Col xs={24} lg={12}>
                    <Card
                        title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FilePptOutlined />
                                <span>Presentation Preview</span>
                                <span style={{
                                    marginLeft: 'auto',
                                    fontSize: 12,
                                    color: '#888',
                                    fontWeight: 'normal'
                                }}>
                                    16:9
                                </span>
                            </div>
                        }
                        style={{
                            borderRadius: 12,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        }}
                        styles={{
                            body: {
                                padding: 16,
                                background: '#2c2c2c'
                            }
                        }}
                    >
                        {/* Presentation Container with 16:9 Aspect Ratio */}
                        <div style={{
                            width: '100%',
                            maxWidth: 1600,
                            aspectRatio: '16 / 9',
                            margin: '0 auto',
                            background: '#fff',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                            borderRadius: 4,
                            overflow: 'hidden',
                            position: 'relative'
                        }}>
                            {loading ? (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '100%',
                                    height: '100%',
                                    flexDirection: 'column',
                                    gap: 16,
                                    background: '#fff'
                                }}>
                                    <Spin size="large" />
                                    <Text type="secondary">Generating presentation...</Text>
                                </div>
                            ) : htmlPreview ? (
                                <iframe
                                    srcDoc={`
                                        <!DOCTYPE html>
                                        <html>
                                        <head>
                                            <style>
                                                * { margin: 0; padding: 0; box-sizing: border-box; }
                                                html, body { 
                                                    width: 100%; 
                                                    height: 100%; 
                                                    overflow: hidden;
                                                }
                                                .presentation-container {
                                                    width: 100%;
                                                    height: 100%;
                                                    aspect-ratio: 16 / 9;
                                                    background: white;
                                                }
                                                .slide {
                                                    width: 100%;
                                                    height: 100%;
                                                    aspect-ratio: 16 / 9;
                                                    display: flex;
                                                    flex-direction: column;
                                                    justify-content: center;
                                                    padding: 60px 80px;
                                                    box-sizing: border-box;
                                                }
                                            </style>
                                        </head>
                                        <body>
                                            <div class="presentation-container">
                                                ${htmlPreview}
                                            </div>
                                        </body>
                                        </html>
                                    `}
                                    title="Presentation Preview"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        border: 'none',
                                        background: '#fff'
                                    }}
                                    sandbox="allow-scripts allow-same-origin"
                                />
                            ) : (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '100%',
                                    height: '100%',
                                    flexDirection: 'column',
                                    gap: 16,
                                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                                    color: '#666'
                                }}>
                                    <FilePptOutlined style={{ fontSize: 64, opacity: 0.3 }} />
                                    <div style={{ textAlign: 'center', padding: '0 20px' }}>
                                        <Text type="secondary" style={{ fontSize: 16 }}>
                                            Presentation preview will appear here
                                        </Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: 13 }}>
                                            16:9 aspect ratio (1920×1080)
                                        </Text>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default PPTGeneratorPage;
