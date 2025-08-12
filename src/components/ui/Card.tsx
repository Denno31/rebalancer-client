import React from 'react';
import { COLORS } from '@/utils/theme';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '',
  variant = 'default'
}) => {
  const baseClasses = `bg-[${COLORS.background.card}] border border-[${COLORS.border.default}] rounded-lg`;
  const variantClasses = variant === 'elevated' ? 'shadow-lg' : 'shadow-md';
  
  return (
    <div className={`${baseClasses} ${variantClasses} ${className}`}>
      {children}
    </div>
  );
};
