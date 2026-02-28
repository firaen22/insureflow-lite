import React, { useState, MouseEvent } from 'react';

interface Card3DProps {
    children: React.ReactNode;
    className?: string;
    depth?: number;
}

export function Card3D({ children, className = '', depth = 40 }: Card3DProps) {
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const box = card.getBoundingClientRect();
        const x = (e.clientX - box.left - box.width / 2) / (box.width / 2);
        const y = (e.clientY - box.top - box.height / 2) / (box.height / 2);
        setRotation({ x: -y * 8, y: x * 8 });
    };

    return (
        <div className="perspective-[1200px] w-full group">
            <div
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => { setIsHovered(false); setRotation({ x: 0, y: 0 }); }}
                className={`relative w-full rounded-2xl transition-transform duration-[400ms] ease-out will-change-transform ${className}`}
                style={{
                    transform: isHovered
                        ? `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) translateZ(24px)`
                        : 'rotateX(0deg) rotateY(0deg) translateZ(0px)',
                    transformStyle: 'preserve-3d',
                }}
            >
                {/* Base Layer */}
                <div className="absolute inset-0 rounded-2xl transition-all duration-500 bg-white border border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:bg-gradient-to-br dark:from-slate-900/90 dark:to-slate-950/95 dark:backdrop-blur-xl dark:border-slate-200 dark:border-white/10 dark:shadow-[0_16px_40px_rgba(2,6,23,0.8)] group-hover:border-brand-200 dark:group-hover:border-slate-300 dark:border-white/20 group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:group-hover:shadow-[0_24px_60px_rgba(2,6,23,0.95)]" />

                {/* Dynamic highlight (dark only) */}
                <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-2xl bg-gradient-to-b from-white/5 to-transparent opacity-0 dark:group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Floating Content Space */}
                <div
                    className="relative h-full"
                    style={{ transform: `translateZ(${depth}px)` }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}
