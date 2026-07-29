import React from 'react';

export const AuracashIcon = ({ size = 20, style = {} }) => (
    <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
        {/* Base do polígono de 9 lados (Aproximação de um nonágono formato de gema) */}
        <polygon 
            points="12,2 18.4,4.3 21.8,10.3 20.7,17 15.4,21.4 8.6,21.4 3.3,17 2.2,10.3 5.6,4.3" 
            fill="#a855f7" 
            stroke="#e9d5ff" 
            strokeWidth="1.5" 
            strokeLinejoin="round" 
        />
        {/* Mesa central da gema */}
        <polygon 
            points="12,7 16,9 17,14 14,17 10,17 7,14 8,9" 
            fill="#9333ea" 
        />
        {/* Linhas facetadas partindo do centro pras bordas para dar efeito 3D */}
        <polyline points="12,2 12,7" stroke="#e9d5ff" strokeWidth="1" strokeOpacity="0.5" />
        <polyline points="18.4,4.3 16,9" stroke="#e9d5ff" strokeWidth="1" strokeOpacity="0.5" />
        <polyline points="21.8,10.3 17,14" stroke="#e9d5ff" strokeWidth="1" strokeOpacity="0.5" />
        <polyline points="20.7,17 14,17" stroke="#e9d5ff" strokeWidth="1" strokeOpacity="0.5" />
        <polyline points="15.4,21.4 14,17" stroke="#e9d5ff" strokeWidth="1" strokeOpacity="0.5" />
        <polyline points="8.6,21.4 10,17" stroke="#e9d5ff" strokeWidth="1" strokeOpacity="0.5" />
        <polyline points="3.3,17 10,17" stroke="#e9d5ff" strokeWidth="1" strokeOpacity="0.5" />
        <polyline points="2.2,10.3 7,14" stroke="#e9d5ff" strokeWidth="1" strokeOpacity="0.5" />
        <polyline points="5.6,4.3 8,9" stroke="#e9d5ff" strokeWidth="1" strokeOpacity="0.5" />
    </svg>
);
