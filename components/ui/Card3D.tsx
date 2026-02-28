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
                {/* Navy Base Layer with Glass Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/95 backdrop-blur-xl border border-white/10 shadow-[0_16px_40px_rgba(2,6,23,0.8)] group-hover:border-white/20 group-hover:shadow-[0_24px_60px_rgba(2,6,23,0.95)] transition-all duration-500" />

                {/* Dynamic White Specular Highlight */}
                <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-2xl bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

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
