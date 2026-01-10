import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, message, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { AnimatePresence } from 'framer-motion';
import presentationService from '../../services/presentationService';
import Slide from '../../components/slides/Slide';
import SlideControls from '../../components/slides/SlideControls';

const PresentationViewer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const containerRef = useRef(null);

    const [presentation, setPresentation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPresenting, setIsPresenting] = useState(false);

    // Fetch presentation
    useEffect(() => {
        const fetchPresentation = async () => {
            try {
                const data = await presentationService.getPresentation(id);
                setPresentation(data);
            } catch (error) {
                console.error('Failed to fetch presentation:', error);
                message.error('Presentation not found');
                navigate('/dashboard/slide-generator');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchPresentation();
        }
    }, [id, navigate]);

    // Navigation functions
    const goToNext = useCallback(() => {
        if (presentation && currentIndex < presentation.slides.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    }, [presentation, currentIndex]);

    const goToPrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    }, [currentIndex]);

    // Toggle presentation mode
    const togglePresentMode = useCallback(() => {
        if (!isPresenting) {
            // Enter fullscreen
            if (containerRef.current?.requestFullscreen) {
                containerRef.current.requestFullscreen();
            }
            setIsPresenting(true);
        } else {
            // Exit fullscreen
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
            setIsPresenting(false);
        }
    }, [isPresenting]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            switch (e.key) {
                case 'ArrowRight':
                case ' ':
                    e.preventDefault();
                    goToNext();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    goToPrev();
                    break;
                case 'f':
                case 'F':
                    e.preventDefault();
                    togglePresentMode();
                    break;
                case 'Escape':
                    if (isPresenting) {
                        setIsPresenting(false);
                    }
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goToNext, goToPrev, togglePresentMode, isPresenting]);

    // Handle fullscreen change
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && isPresenting) {
                setIsPresenting(false);
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [isPresenting]);

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0f172a'
            }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!presentation) {
        return null;
    }

    const currentSlide = presentation.slides[currentIndex];

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                minHeight: isPresenting ? '100vh' : 'calc(100vh - 60px)',
                backgroundColor: '#0f172a',
                display: 'flex',
                flexDirection: 'column',
                position: isPresenting ? 'fixed' : 'relative',
                top: isPresenting ? 0 : 'auto',
                left: isPresenting ? 0 : 'auto',
                zIndex: isPresenting ? 9999 : 'auto'
            }}
        >
            {/* Back button (hidden in present mode) */}
            {!isPresenting && (
                <div style={{ padding: '16px 24px' }}>
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/dashboard/slide-generator')}
                        style={{ color: '#94a3b8' }}
                    >
                        Back to Generator
                    </Button>
                </div>
            )}

            {/* Slide viewport */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: isPresenting ? 0 : '0 24px'
            }}>
                <div style={{
                    width: isPresenting ? '100vw' : '90vw',
                    maxWidth: isPresenting ? 'none' : '1400px',
                    aspectRatio: '16 / 9',
                    maxHeight: isPresenting ? '100vh' : 'calc(100vh - 200px)',
                    borderRadius: isPresenting ? 0 : 16,
                    overflow: 'hidden',
                    boxShadow: isPresenting ? 'none' : '0 25px 50px rgba(0,0,0,0.5)'
                }}>
                    <AnimatePresence mode="wait">
                        <Slide
                            key={currentSlide.id}
                            slide={currentSlide}
                            isPresenting={isPresenting}
                        />
                    </AnimatePresence>
                </div>
            </div>

            {/* Controls */}
            <div style={{
                position: isPresenting ? 'fixed' : 'relative',
                bottom: 0,
                left: 0,
                right: 0,
                transition: 'opacity 0.3s',
                opacity: isPresenting ? 0.8 : 1
            }}
                onMouseEnter={(e) => isPresenting && (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => isPresenting && (e.currentTarget.style.opacity = '0.3')}
            >
                <SlideControls
                    currentIndex={currentIndex}
                    totalSlides={presentation.slides.length}
                    onPrev={goToPrev}
                    onNext={goToNext}
                    isPresenting={isPresenting}
                    onTogglePresent={togglePresentMode}
                    title={presentation.title}
                />
            </div>
        </div>
    );
};

export default PresentationViewer;
