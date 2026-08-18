import React from 'react';
import clsx from 'clsx';

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  className,
  disabled,
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm border border-transparent font-semibold',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600 font-semibold',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm border border-transparent font-semibold',
    outline: 'bg-transparent text-slate-800 border border-slate-300 hover:bg-slate-50 font-semibold',
    gradient: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md border-0 font-semibold'
  };

  return (
    <button
      type={type}
      className={clsx(baseStyles, variants[variant], className)}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};
