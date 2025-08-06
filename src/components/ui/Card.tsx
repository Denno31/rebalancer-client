import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-[#1E2329] border border-[#2A2E37] rounded-lg shadow-md ${className}`}>
      {children}
    </div>
  );
};
