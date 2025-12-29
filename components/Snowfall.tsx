import React, { useMemo } from 'react';

const Snowfall = () => {
    const flakes = useMemo(() => {
        return Array.from({ length: 30 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100 + '%',
            animationDuration: (Math.random() * 3 + 4) + 's',
            animationDelay: -(Math.random() * 5) + 's',
            opacity: Math.random() * 0.5 + 0.3,
            size: Math.random() * 10 + 5 + 'px'
        }));
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[150] overflow-hidden">
            {flakes.map(flake => (
                <div key={flake.id} className="snowflake" style={{
                    left: flake.left,
                    animationDuration: flake.animationDuration,
                    animationDelay: flake.animationDelay,
                    opacity: flake.opacity,
                    fontSize: flake.size
                }}>❄</div>
            ))}
        </div>
    );
};

export default Snowfall;