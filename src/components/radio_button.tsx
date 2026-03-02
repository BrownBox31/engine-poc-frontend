import React from 'react';

interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface RadioButtonProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  direction?: 'horizontal' | 'vertical';
}

const RadioButton: React.FC<RadioButtonProps> = ({
  name,
  options,
  value,
  onChange,
  label,
  error,
  disabled = false,
  required = false,
  className = '',
  direction = 'vertical'
}) => {
  const containerClasses = `
    flex ${direction === 'horizontal' ? 'flex-row space-x-4' : 'flex-col space-y-2'}
    ${className}
  `.trim();

  return (
    <div className="flex flex-col space-y-2">
      {label && (
        <fieldset className="border-none p-0 m-0">
          <legend className="text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </legend>
        </fieldset>
      )}
      
      <div className={containerClasses}>
        {options.map((option) => {
          const radioId = `${name}-${option.value}`;
          const isDisabled = disabled || option.disabled;
          
          return (
            <div key={option.value} className="flex items-center space-x-2">
              <input
                id={radioId}
                name={name}
                type="radio"
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange(e.target.value)}
                disabled={isDisabled}
                required={required}
                className={`
                  w-4 h-4 text-blue-600 border-gray-300
                  focus:ring-blue-500 focus:ring-2
                  ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                `}
              />
              <label 
                htmlFor={radioId}
                className={`
                  text-sm text-gray-700
                  ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                `}
              >
                {option.label}
              </label>
            </div>
          );
        })}
      </div>
      
      {error && (
        <span className="text-sm text-red-500">
          {error}
        </span>
      )}
    </div>
  );
};

export default RadioButton;
