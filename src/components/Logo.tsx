import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const ProofboundLogo: React.FC<LogoProps> = ({ className = "w-8 h-8", size = 80 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 80 80" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <polygon points="40,5 65,22.5 65,57.5 40,75 15,57.5 15,22.5" fill="currentColor"/>
      <path d="M22 30 L37 33 L37 50 L22 47 Z" fill="white"/>
      <path d="M43 33 L58 30 L58 47 L43 50 Z" fill="white"/>
      <line x1="25" y1="36" x2="34" y2="37.5" stroke="currentColor" strokeWidth="1"/>
      <line x1="25" y1="40" x2="32" y2="41.5" stroke="currentColor" strokeWidth="1"/>
      <line x1="46" y1="37.5" x2="55" y2="36" stroke="currentColor" strokeWidth="1"/>
      <line x1="48" y1="41.5" x2="55" y2="40" stroke="currentColor" strokeWidth="1"/>
    </svg>
  );
};

export default ProofboundLogo;