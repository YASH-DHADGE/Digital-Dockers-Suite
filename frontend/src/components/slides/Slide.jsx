import { motion } from 'framer-motion';
import { Typography } from 'antd';

const { Title, Text, Paragraph } = Typography;

// Animation variants
const slideVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
};

const titleVariants = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0, transition: { delay: 0.2 } }
};

const subtitleVariants = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0, transition: { delay: 0.3 } }
};

const contentVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.4 } }
};

const bulletVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 }
};

const Slide = ({ slide, isPresenting = false }) => {
    const {
        title,
        subtitle,
        type,
        content = [],
        backgroundColor = '#1a1a2e',
        textColor = '#ffffff',
        accentColor = '#3b82f6',
        layout = 'center'
    } = slide;

    // Layout styles based on layout type
    const getLayoutStyles = () => {
        switch (layout) {
            case 'left':
                return {
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    paddingLeft: '10%',
                    paddingRight: '10%'
                };
            case 'split':
                return {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingLeft: '8%',
                    paddingRight: '8%'
                };
            case 'center':
            default:
                return {
                    alignItems: 'center',
                    textAlign: 'center',
                    paddingLeft: '10%',
                    paddingRight: '10%'
                };
        }
    };

    // Type-specific rendering
    const renderContent = () => {
        const layoutStyles = getLayoutStyles();

        switch (type) {
            case 'title':
                return (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        height: '100%',
                        ...layoutStyles
                    }}>
                        <motion.div variants={titleVariants}>
                            <Title
                                level={1}
                                style={{
                                    color: textColor,
                                    fontSize: isPresenting ? '4rem' : '3rem',
                                    marginBottom: 16,
                                    fontWeight: 700
                                }}
                            >
                                {title}
                            </Title>
                        </motion.div>
                        {subtitle && (
                            <motion.div variants={subtitleVariants}>
                                <Text style={{
                                    color: accentColor,
                                    fontSize: isPresenting ? '1.8rem' : '1.4rem',
                                    opacity: 0.9
                                }}>
                                    {subtitle}
                                </Text>
                            </motion.div>
                        )}
                    </div>
                );

            case 'quote':
                return (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        height: '100%',
                        ...layoutStyles
                    }}>
                        <motion.div
                            variants={titleVariants}
                            style={{
                                borderLeft: `4px solid ${accentColor}`,
                                paddingLeft: 32,
                                maxWidth: '80%'
                            }}
                        >
                            <Paragraph style={{
                                color: textColor,
                                fontSize: isPresenting ? '2.2rem' : '1.6rem',
                                fontStyle: 'italic',
                                lineHeight: 1.6,
                                margin: 0
                            }}>
                                "{content[0] || title}"
                            </Paragraph>
                            {subtitle && (
                                <Text style={{
                                    color: accentColor,
                                    fontSize: isPresenting ? '1.2rem' : '1rem',
                                    marginTop: 16,
                                    display: 'block'
                                }}>
                                    — {subtitle}
                                </Text>
                            )}
                        </motion.div>
                    </div>
                );

            case 'conclusion':
                return (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        height: '100%',
                        ...layoutStyles
                    }}>
                        <motion.div variants={titleVariants}>
                            <Title
                                level={2}
                                style={{
                                    color: accentColor,
                                    fontSize: isPresenting ? '2.8rem' : '2.2rem',
                                    marginBottom: 32
                                }}
                            >
                                {title}
                            </Title>
                        </motion.div>
                        <motion.ul variants={contentVariants} style={{
                            listStyle: 'none',
                            padding: 0,
                            margin: 0,
                            textAlign: layout === 'center' ? 'center' : 'left'
                        }}>
                            {content.map((bullet, idx) => (
                                <motion.li
                                    key={idx}
                                    variants={bulletVariants}
                                    style={{
                                        color: textColor,
                                        fontSize: isPresenting ? '1.6rem' : '1.2rem',
                                        marginBottom: 16,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12
                                    }}
                                >
                                    <span style={{
                                        color: accentColor,
                                        fontSize: '1.4em',
                                        fontWeight: 'bold'
                                    }}>✓</span>
                                    {bullet}
                                </motion.li>
                            ))}
                        </motion.ul>
                    </div>
                );

            case 'image':
            case 'content':
            default:
                return (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        paddingTop: '8%',
                        ...layoutStyles
                    }}>
                        <motion.div variants={titleVariants}>
                            <Title
                                level={2}
                                style={{
                                    color: textColor,
                                    fontSize: isPresenting ? '2.6rem' : '2rem',
                                    marginBottom: 8
                                }}
                            >
                                {title}
                            </Title>
                        </motion.div>
                        {subtitle && (
                            <motion.div variants={subtitleVariants}>
                                <Text style={{
                                    color: accentColor,
                                    fontSize: isPresenting ? '1.4rem' : '1.1rem',
                                    marginBottom: 32,
                                    display: 'block'
                                }}>
                                    {subtitle}
                                </Text>
                            </motion.div>
                        )}
                        <motion.ul variants={contentVariants} style={{
                            listStyle: 'none',
                            padding: 0,
                            margin: '24px 0 0 0',
                            textAlign: layout === 'center' ? 'center' : 'left'
                        }}>
                            {content.map((bullet, idx) => (
                                <motion.li
                                    key={idx}
                                    variants={bulletVariants}
                                    style={{
                                        color: textColor,
                                        fontSize: isPresenting ? '1.5rem' : '1.15rem',
                                        marginBottom: 20,
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 16,
                                        lineHeight: 1.5
                                    }}
                                >
                                    <span style={{
                                        color: accentColor,
                                        fontSize: '0.8em',
                                        marginTop: 4
                                    }}>●</span>
                                    {bullet}
                                </motion.li>
                            ))}
                        </motion.ul>
                    </div>
                );
        }
    };

    return (
        <motion.div
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            style={{
                width: '100%',
                height: '100%',
                backgroundColor,
                borderRadius: isPresenting ? 0 : 16,
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            {renderContent()}
        </motion.div>
    );
};

export default Slide;
