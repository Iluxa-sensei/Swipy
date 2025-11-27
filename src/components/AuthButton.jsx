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
  const baseClasses = 'w-full font-semibold rounded-lg py-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
  
  const variants = {
    primary: 'bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 hover:from-blue-500 hover:via-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]',
    secondary: 'bg-glass-bg border border-glass-border rounded-lg text-text-primary hover:bg-glass-border hover:border-white/20',
    ghost: 'bg-transparent text-text-primary hover:bg-glass-bg/50'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {icon && <i className={icon}></i>}
      {children}
    </button>
  )
}

export default AuthButton

