import React from 'react';

interface InputFieldProps {
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  name?: string;
  autoComplete?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  className = '',
  id,
  name,
  autoComplete
}) => {
  const inputId = id || name || label?.toLowerCase().replace(/\s+/g, '-');
  
  const inputClasses = `
    w-full px-3 py-2 border rounded-lg transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    ${error ? 'border-red-500' : 'border-gray-300'}
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
    ${className}
  `.trim();

  return (
    <div className="flex flex-col space-y-1">
      {label && (
        <label 
          htmlFor={inputId}
          className="text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        id={inputId}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        className={inputClasses}
      />
      
      {error && (
        <span className="text-sm text-red-500">
          {error}
        </span>
      )}
    </div>
  );
};

export default InputField;
