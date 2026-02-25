import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  padding = 'p-6', 
  shadow = 'shadow-sm', 
  hover = false,
  onClick
}) => {
  const baseClasses = `bg-white rounded-lg border border-gray-200 ${shadow} ${padding}`;
  const hoverClasses = hover ? 'hover:shadow-md transition-shadow cursor-pointer' : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';

  return (
    <div 
      className={`${baseClasses} ${hoverClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;