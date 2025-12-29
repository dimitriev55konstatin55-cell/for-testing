import React from 'react';

export const IsoTree = () => (
    <svg viewBox="0 0 80 100" className="drop-shadow-xl" width="80" height="100">
        <path d="M35 80 L45 80 L45 95 L35 95 Z" fill="#5c3a21" />
        <path d="M10 80 L40 30 L70 80 Z" fill="#15803d" />
        <path d="M10 80 L40 85 L70 80" fill="none" stroke="#0f5132" strokeWidth="1" opacity="0.3" />
        <path d="M15 60 L40 15 L65 60 Z" fill="#16a34a" />
        <path d="M15 60 L40 65 L65 60" fill="none" stroke="#0f5132" strokeWidth="1" opacity="0.3" />
        <path d="M25 35 L40 0 L55 35 Z" fill="#22c55e" />
        <path d="M40 0 L30 15 L50 15 Z" fill="white" />
    </svg>
);

export const IsoMountain = () => (
    <svg viewBox="0 0 120 100" className="drop-shadow-xl" width="120" height="100">
        <path d="M60 10 L110 100 L10 100 Z" fill="#94a3b8" />
        <path d="M60 10 L80 100 L110 100 Z" fill="#64748b" opacity="0.5" />
        <path d="M60 10 L45 40 L75 40 Z" fill="white" />
    </svg>
);

export const IsoRock = () => (
    <svg viewBox="0 0 60 40" className="drop-shadow-lg" width="50" height="35">
        <path d="M10 30 L20 10 L40 5 L50 25 L40 35 L20 35 Z" fill="#64748b" />
        <path d="M20 10 L40 5 L50 25" fill="none" stroke="#94a3b8" strokeWidth="2" />
        <path d="M20 10 L30 8 L40 5 L25 12 Z" fill="white" />
    </svg>
);

export const SantaHouse = () => (
    <svg viewBox="0 0 120 100" width="120" height="100" className="drop-shadow-2xl">
        <rect x="20" y="40" width="80" height="50" fill="#7c2d12" rx="2" />
        <path d="M20 40 L40 40 L40 90 L20 90 Z" fill="#551a08" />
        <path d="M10 40 L60 0 L110 40" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
        <rect x="50" y="60" width="20" height="30" fill="#fbbf24" opacity="0.8" />
        <rect x="58" y="60" width="4" height="30" fill="#b45309" />
        <rect x="50" y="72" width="20" height="4" fill="#b45309" />
        <path d="M80 20 L80 10 L90 10 L90 25" fill="#551a08" />
        <circle cx="85" cy="8" r="4" fill="#94a3b8" opacity="0.5" />
        <circle cx="90" cy="4" r="5" fill="#94a3b8" opacity="0.3" />
    </svg>
);

export const IsoSleigh = () => (
    <svg viewBox="0 0 100 60" width="100" height="60" className="drop-shadow-xl">
        <path d="M10 40 Q20 55, 90 40" fill="none" stroke="#b45309" strokeWidth="4" />
        <path d="M20 30 L80 30 L90 10 L30 10 Z" fill="#ef4444" />
        <path d="M20 30 L30 10 L90 10 L80 30" fill="none" stroke="#b91c1c" strokeWidth="2" />
        <rect x="30" y="5" width="40" height="10" fill="#facc15" rx="2" />
        <path d="M25 40 L25 30 M75 40 L75 30" stroke="#b45309" strokeWidth="3" />
    </svg>
);