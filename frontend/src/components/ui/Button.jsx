import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-emerald-500 text-white hover:bg-emerald-600 border-2 border-emerald-500 hover:border-emerald-600 shadow-sm hover:shadow-md active:scale-95',
    secondary: 'bg-transparent text-emerald-500 border-2 border-emerald-500 hover:bg-emerald-50 shadow-sm hover:shadow-md active:scale-95',
    danger: 'bg-red-500 text-white hover:bg-red-600 border-2 border-red-500 hover:border-red-600 shadow-sm hover:shadow-md active:scale-95',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 border-2 border-transparent active:scale-95',
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
