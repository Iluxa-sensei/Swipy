import React from 'react'

const AuthInput = ({ 
  label, 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  required = false,
  minLength,
  maxLength,
  pattern,
  title,
  className = '',
  ...props 
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-text-primary font-medium text-base mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        pattern={pattern}
        title={title}
        className={`w-full h-14 px-4 py-3 bg-glass-bg border border-glass-border rounded-lg text-text-primary text-base placeholder-text-secondary focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200 hover:border-white/20 ${className}`}
        {...props}
      />
    </div>
  )
}

export default AuthInput

