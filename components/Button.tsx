import React, { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  className?: string;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'flex items-center justify-center gap-2 font-bold transition-all';

  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg hover:shadow-indigo-200 transform hover:-translate-y-0.5 active:scale-95',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 active:scale-95',
    outline: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 active:scale-95',
    danger: 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 active:scale-95'
  };

  const defaultRounding = className.includes('rounded') ? '' : 'rounded-xl';
  const defaultPadding = className.includes('py-') || className.includes('px-') || className.includes('p-') ? '' : 'px-4 py-3';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${defaultRounding} ${defaultPadding} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
