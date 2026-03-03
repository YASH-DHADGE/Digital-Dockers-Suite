import { Tooltip, Grid, theme } from 'antd';
import { Typography } from 'antd';

const { Text } = Typography;
const { useBreakpoint } = Grid;

const DistributionBar = ({ label, icon: Icon, count, total, percentage, color, onClick }) => {
    const screens = useBreakpoint();
    const { token } = theme.useToken();

    const isMobile = !screens.md;
    const isCompact = !screens.lg;

    // Truncate label based on screen size
    const maxLabelLength = isMobile ? 8 : isCompact ? 10 : 14;
    const displayLabel = label.length > maxLabelLength
        ? label.substring(0, maxLabelLength - 2) + '...'
        : label;

    return (
        <div
            onClick={onClick}
            style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'stretch' : 'center',
                gap: isMobile ? 8 : 12,
                padding: isMobile ? '12px 12px' : '12px 20px',
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                borderRadius: '8px',
                margin: '0 -4px',
                background: 'transparent',
            }}
            onMouseEnter={(e) => {
                if (onClick) {
                    e.currentTarget.style.backgroundColor = token.colorBgTextHover;
                    e.currentTarget.style.transform = 'translateX(4px)';
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'translateX(0)';
            }}
        >
            {/* Left: Icon + Label */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                minWidth: isMobile ? 'auto' : isCompact ? '100px' : '120px',
                flex: isMobile ? 'none' : 0.8
            }}>
                {Icon && (
                    <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: `${color}15`,
                        flexShrink: 0,
                    }}>
                        <Icon style={{ fontSize: 14, color }} />
                    </div>
                )}
                <Tooltip title={label}>
                    <Text strong style={{
                        fontSize: isMobile ? '13px' : '12px',
                        color: token.colorText,
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                    }}>
                        {displayLabel}
                    </Text>
                </Tooltip>
            </div>

            {/* Center: Progress Bar */}
            <div style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 12 : 10
            }}>
                <div
                    style={{
                        flex: 1,
                        minWidth: 0,
                        height: isMobile ? '10px' : '8px',
                        backgroundColor: token.colorBgLayout,
                        borderRadius: '6px',
                        overflow: 'hidden',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)',
                    }}
                >
                    <div
                        style={{
                            height: '100%',
                            backgroundColor: color || token.colorPrimary,
                            width: `${Math.min(percentage, 100)}%`,
                            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                            borderRadius: '6px',
                            background: `linear-gradient(90deg, ${color || token.colorPrimary}, ${color || token.colorPrimary}dd)`,
                        }}
                    />
                </div>
                <Tooltip title={`${count} of ${total} items`}>
                    <Text strong style={{
                        fontSize: isMobile ? '13px' : '12px',
                        color: token.colorText,
                        minWidth: isMobile ? 45 : 40,
                        textAlign: 'right',
                        flexShrink: 0,
                        fontVariantNumeric: 'tabular-nums',
                    }}>
                        {percentage}%
                    </Text>
                </Tooltip>
            </div>
        </div>
    );
};

export default DistributionBar;

