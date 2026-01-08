import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  className?: string;
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  disabled = false,
  ...props
}: ButtonProps) {
  const baseStyle = "inline-flex items-center justify-center px-4 py-2.5 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 focus:ring-indigo-500",
    secondary: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm focus:ring-indigo-500",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600",
    danger: "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
