import { Button, Progress, Typography, Tooltip } from 'antd';
import {
    LeftOutlined,
    RightOutlined,
    FullscreenOutlined,
    FullscreenExitOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const SlideControls = ({
    currentIndex = 0,
    totalSlides = 1,
    onPrev,
    onNext,
    isPresenting = false,
    onTogglePresent,
    title = ''
}) => {
    const progress = totalSlides > 0 ? ((currentIndex + 1) / totalSlides) * 100 : 0;

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: isPresenting ? 0 : '0 0 16px 16px'
        }}>
            {/* Left: Title */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <Text
                    ellipsis
                    style={{
                        color: '#fff',
                        fontSize: 14,
                        opacity: 0.9
                    }}
                >
                    {title}
                </Text>
            </div>

            {/* Center: Navigation */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16
            }}>
                <Button
                    type="text"
                    icon={<LeftOutlined />}
                    onClick={onPrev}
                    disabled={currentIndex === 0}
                    style={{
                        color: '#fff',
                        opacity: currentIndex === 0 ? 0.3 : 1
                    }}
                />

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    minWidth: 180
                }}>
                    <Progress
                        percent={progress}
                        showInfo={false}
                        strokeColor="#3b82f6"
                        trailColor="rgba(255,255,255,0.2)"
                        size="small"
                        style={{ flex: 1, margin: 0 }}
                    />
                    <Text style={{
                        color: '#fff',
                        fontSize: 13,
                        whiteSpace: 'nowrap',
                        opacity: 0.8
                    }}>
                        {currentIndex + 1} / {totalSlides}
                    </Text>
                </div>

                <Button
                    type="text"
                    icon={<RightOutlined />}
                    onClick={onNext}
                    disabled={currentIndex >= totalSlides - 1}
                    style={{
                        color: '#fff',
                        opacity: currentIndex >= totalSlides - 1 ? 0.3 : 1
                    }}
                />
            </div>

            {/* Right: Present Button */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <Tooltip title={isPresenting ? 'Exit Fullscreen (F)' : 'Present (F)'}>
                    <Button
                        type="primary"
                        icon={isPresenting ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                        onClick={onTogglePresent}
                        style={{
                            backgroundColor: '#3b82f6',
                            borderColor: '#3b82f6'
                        }}
                    >
                        {isPresenting ? 'Exit' : 'Present'}
                    </Button>
                </Tooltip>
            </div>
        </div>
    );
};

export default SlideControls;
