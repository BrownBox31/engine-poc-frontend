import React from 'react';

interface CheckBoxProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
}

const CheckBox: React.FC<CheckBoxProps> = ({
  label,
  checked,
  onChange,
  disabled = false,
  className = '',
  id,
  name,
  required = false
}) => {
  const checkboxId = id || name || label?.toLowerCase().replace(/\s+/g, '-');
  
  const checkboxClasses = `
    w-4 h-4 text-blue-600 border-gray-300 rounded
    focus:ring-blue-500 focus:ring-2
    ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
    ${className}
  `.trim();

  return (
    <div className="flex items-center space-x-2">
      <input
        id={checkboxId}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        required={required}
        className={checkboxClasses}
      />
      
      {label && (
        <label 
          htmlFor={checkboxId}
          className={`text-sm text-gray-700 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
    </div>
  );
};

export default CheckBox;
