import React from 'react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

const Select: React.FC<SelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  error,
  disabled = false,
  required = false,
  className = '',
  id,
  name
}) => {
  const selectId = id || name || label?.toLowerCase().replace(/\s+/g, '-');
  
  const selectClasses = `
    w-full px-3 py-2 border rounded-lg transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    ${error ? 'border-red-500' : 'border-gray-300'}
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer'}
    ${className}
  `.trim();

  return (
    <div className="flex flex-col space-y-1">
      {label && (
        <label 
          htmlFor={selectId}
          className="text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        id={selectId}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        className={selectClasses}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <span className="text-sm text-red-500">
          {error}
        </span>
      )}
    </div>
  );
};

export default Select;
