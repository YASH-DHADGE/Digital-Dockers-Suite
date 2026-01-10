import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    Form,
    Input,
    Slider,
    Select,
    Button,
    Typography,
    Row,
    Col,
    List,
    Tag,
    Empty,
    Spin,
    message,
    Space
} from 'antd';
import {
    SlidersOutlined,
    PlusOutlined,
    RocketOutlined,
    ClockCircleOutlined,
    DeleteOutlined,
    EyeOutlined
} from '@ant-design/icons';
import presentationService from '../../services/presentationService';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const STYLE_OPTIONS = [
    { value: 'professional', label: '💼 Professional' },
    { value: 'creative', label: '🎨 Creative' },
    { value: 'academic', label: '📚 Academic' },
    { value: 'business', label: '📈 Business' },
    { value: 'startup', label: '🚀 Startup' }
];

const THEME_OPTIONS = [
    { value: 'dark', label: '🌙 Dark' },
    { value: 'light', label: '☀️ Light' },
    { value: 'vibrant', label: '🌈 Vibrant' }
];

const SlideGeneratorPage = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const [generating, setGenerating] = useState(false);
    const [presentations, setPresentations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [slideCount, setSlideCount] = useState(5);

    // Fetch existing presentations
    useEffect(() => {
        fetchPresentations();
    }, []);

    const fetchPresentations = async () => {
        try {
            const data = await presentationService.getMyPresentations(10);
            setPresentations(data);
        } catch (error) {
            console.error('Failed to fetch presentations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (values) => {
        setGenerating(true);
        try {
            const result = await presentationService.createPresentation({
                topic: values.topic,
                slideCount: slideCount,
                style: values.style,
                theme: values.theme
            });

            message.success(`Created: ${result.title}`);
            navigate(`/dashboard/presentations/${result.presentationId}`);
        } catch (error) {
            console.error('Generation failed:', error);
            message.error(error.response?.data?.message || 'Failed to generate presentation');
        } finally {
            setGenerating(false);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        try {
            await presentationService.deletePresentation(id);
            message.success('Presentation deleted');
            fetchPresentations();
        } catch (error) {
            message.error('Failed to delete');
        }
    };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
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
                        padding: 10,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: 12,
                        color: '#fff'
                    }}>
                        <SlidersOutlined />
                    </span>
                    AI Slide Generator
                </Title>
                <Text type="secondary" style={{ fontSize: 16, marginTop: 8, display: 'block' }}>
                    Create professional presentations in seconds with AI
                </Text>
            </div>

            <Row gutter={[24, 24]}>
                {/* Create Form */}
                <Col xs={24} lg={14}>
                    <Card
                        title={
                            <Space>
                                <RocketOutlined style={{ color: '#667eea' }} />
                                <span>Create New Presentation</span>
                            </Space>
                        }
                        style={{
                            borderRadius: 16,
                            boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
                        }}
                    >
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleGenerate}
                            initialValues={{
                                style: 'professional',
                                theme: 'dark'
                            }}
                        >
                            <Form.Item
                                name="topic"
                                label="Presentation Topic"
                                rules={[{ required: true, message: 'Please enter a topic' }]}
                            >
                                <Input.TextArea
                                    placeholder="e.g., The Future of Artificial Intelligence in Healthcare"
                                    rows={3}
                                    maxLength={500}
                                    showCount
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item label={`Number of Slides: ${slideCount}`}>
                                <Slider
                                    min={3}
                                    max={20}
                                    value={slideCount}
                                    onChange={setSlideCount}
                                    marks={{
                                        3: '3',
                                        5: '5',
                                        10: '10',
                                        15: '15',
                                        20: '20'
                                    }}
                                    tooltip={{ formatter: (val) => `${val} slides` }}
                                />
                            </Form.Item>

                            <Row gutter={16}>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        name="style"
                                        label="Style"
                                        rules={[{ required: true }]}
                                    >
                                        <Select
                                            options={STYLE_OPTIONS}
                                            size="large"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        name="theme"
                                        label="Theme"
                                        rules={[{ required: true }]}
                                    >
                                        <Select
                                            options={THEME_OPTIONS}
                                            size="large"
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={generating}
                                    icon={<PlusOutlined />}
                                    size="large"
                                    block
                                    style={{
                                        height: 52,
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        border: 'none',
                                        fontSize: 16,
                                        fontWeight: 600
                                    }}
                                >
                                    {generating ? 'Generating with AI...' : 'Generate Presentation'}
                                </Button>
                            </Form.Item>
                        </Form>

                        {generating && (
                            <div style={{
                                textAlign: 'center',
                                padding: '24px 0 0',
                                color: '#666'
                            }}>
                                <Spin size="small" />
                                <Text style={{ marginLeft: 12 }}>
                                    AI is crafting your slides... This may take 10-20 seconds.
                                </Text>
                            </div>
                        )}
                    </Card>
                </Col>

                {/* Recent Presentations */}
                <Col xs={24} lg={10}>
                    <Card
                        title={
                            <Space>
                                <ClockCircleOutlined />
                                <span>Recent Presentations</span>
                            </Space>
                        }
                        style={{
                            borderRadius: 16,
                            boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
                        }}
                        styles={{ body: { padding: presentations.length ? 0 : 24 } }}
                    >
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: 40 }}>
                                <Spin />
                            </div>
                        ) : presentations.length === 0 ? (
                            <Empty
                                description="No presentations yet"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        ) : (
                            <List
                                dataSource={presentations}
                                renderItem={(item) => (
                                    <List.Item
                                        style={{
                                            padding: '16px 24px',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s'
                                        }}
                                        onClick={() => navigate(`/dashboard/presentations/${item._id}`)}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        actions={[
                                            <Button
                                                key="view"
                                                type="text"
                                                icon={<EyeOutlined />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/dashboard/presentations/${item._id}`);
                                                }}
                                            />,
                                            <Button
                                                key="delete"
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={(e) => handleDelete(item._id, e)}
                                            />
                                        ]}
                                    >
                                        <List.Item.Meta
                                            title={
                                                <Text strong ellipsis style={{ maxWidth: 200 }}>
                                                    {item.title}
                                                </Text>
                                            }
                                            description={
                                                <Space size={4} wrap>
                                                    <Tag color="blue">{item.slideCount} slides</Tag>
                                                    <Tag>{item.style}</Tag>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        {dayjs(item.createdAt).format('MMM D, YYYY')}
                                                    </Text>
                                                </Space>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default SlideGeneratorPage;
