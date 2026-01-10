import { Tooltip } from 'antd';
import { Typography } from 'antd';

const { Text } = Typography;

const DistributionBar = ({ label, icon: Icon, count, total, percentage, color, onClick }) => {
    const displayLabel = label.length > 12 ? label.substring(0, 10) + '...' : label;

    return (
        <div
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 12,
                paddingBottom: 12,
                borderBottom: '1px solid #f0f0f0',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'background 0.2s',
                borderRadius: '4px',
                marginLeft: '-4px',
                marginRight: '-4px',
                paddingLeft: '20px',
                paddingRight: '20px'
            }}
            onMouseEnter={(e) => onClick && (e.currentTarget.style.backgroundColor = '#f6f8fa')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
            {/* Left: Icon + Label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: '120px', flex: 0.8 }}>
                {Icon && <Icon style={{ fontSize: 14, color, flexShrink: 0 }} />}
                <Tooltip title={label}>
                    <Text strong style={{ fontSize: '12px', color: '#262626', fontWeight: 500 }}>
                        {displayLabel}
                    </Text>
                </Tooltip>
            </div>

            {/* Center: Progress Bar */}
            <div style={{ flex: 1.5, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                    style={{
                        flex: 1,
                        minWidth: 0,
                        height: '8px',
                        backgroundColor: '#dfe1e6',
                        borderRadius: '4px',
                        overflow: 'hidden'
                    }}
                >
                    <div
                        style={{
                            height: '100%',
                            backgroundColor: color || '#0052cc',
                            width: `${percentage}%`,
                            transition: 'width 0.4s ease',
                            borderRadius: '4px'
                        }}
                    />
                </div>
                <Tooltip title={`${count} of ${total} items`}>
                    <Text strong style={{ fontSize: '12px', color: '#262626', minWidth: 40, textAlign: 'right', flexShrink: 0 }}>
                        {percentage}%
                    </Text>
                </Tooltip>
            </div>
        </div>
    );
};

export default DistributionBar;
