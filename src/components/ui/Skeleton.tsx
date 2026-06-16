import React from 'react';

export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
    return (
        <div
            className={`skeleton ${className}`}
            style={{
                background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)',
                backgroundSize: '200% 100%',
                animation: 'skeleton-shimmer 1.5s infinite',
                borderRadius: '8px',
                ...style,
            }}
        />
    );
}

export function StatCardSkeleton() {
    return (
        <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '140px' }}>
            <Skeleton style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
            <Skeleton style={{ width: '80px', height: '32px' }} />
            <Skeleton style={{ width: '120px', height: '16px' }} />
        </div>
    );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
    return (
        <tr>
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i}>
                    <Skeleton style={{ width: i === 0 ? '80%' : '100%', height: '20px' }} />
                </td>
            ))}
        </tr>
    );
}
