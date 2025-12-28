import React from 'react'

const AuthButton = ({
  children,
  type = 'button',
  onClick,
  disabled = false,
  variant = 'primary',
  className = '',
  icon,
  ...props
}) => {
  const baseClasses = 'font-semibold py-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg'

  const variants = {
    primary: 'bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 text-white shadow-lg rounded-2xl w-auto px-8 mx-auto',
    secondary: 'bg-glass-bg border border-glass-border rounded-lg text-text-primary hover:bg-glass-border hover:border-white/20 w-full',
    ghost: 'bg-transparent text-text-primary hover:bg-glass-bg/50 w-full'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {icon && <i className={`${icon} text-lg`}></i>}
      {children}
    </button>
  )
}

export default AuthButton

