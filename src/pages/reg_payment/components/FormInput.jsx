import React from 'react';
import { User, Mail, Phone, IdCard, Building, GraduationCap, Layers2 } from 'lucide-react';

const getIcon = (label) => {
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes('name')) return User;
  if (lowerLabel.includes('email')) return Mail;
  if (lowerLabel.includes('phone')) return Phone;
  if (lowerLabel.includes('level')) return Layers2;
  if (lowerLabel.includes('matric')) return IdCard;
  if (lowerLabel.includes('faculty')) return Building;
  if (lowerLabel.includes('department')) return GraduationCap;
  return User;
};

const FormInput = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  required = false,
  themeColor,
  error,
  options = [], // Add options prop
  disabled = false
}) => {
  const Icon = getIcon(label);
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: themeColor }} />
          {label}
          {required && <span className="text-red-500 dark:text-red-400">*</span>}
        </div>
      </label>
      <div className="relative">
        {type === 'select' ? (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`w-full px-5 py-4 bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border-2 rounded-xl focus:ring-4 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-white outline-none ${
              error 
                ? 'border-red-500 dark:border-red-400 focus:ring-red-500/20 shadow-lg shadow-red-500/20' 
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            style={{
              '--tw-ring-color': error ? '#ef444420' : `${themeColor}30`,
            }}
            onFocus={(e) => {
              if (!error && !disabled) {
                e.target.style.borderColor = themeColor;
                e.target.style.boxShadow = `0 0 0 4px ${themeColor}20`;
              }
            }}
            onBlur={(e) => {
              if (!error && !disabled) {
                e.target.style.borderColor = '';
                e.target.style.boxShadow = '';
              }
            }}
            required={required}
          >
            <option value="">Select {label}</option>
            {options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`w-full px-5 py-4 bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border-2 rounded-xl focus:ring-4 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 outline-none ${
              error 
                ? 'border-red-500 dark:border-red-400 focus:ring-red-500/20 shadow-lg shadow-red-500/20' 
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            style={{
              '--tw-ring-color': error ? '#ef444420' : `${themeColor}30`,
            }}
            onFocus={(e) => {
              if (!error && !disabled) {
                e.target.style.borderColor = themeColor;
                e.target.style.boxShadow = `0 0 0 4px ${themeColor}20`;
              }
            }}
            onBlur={(e) => {
              if (!error && !disabled) {
                e.target.style.borderColor = '';
                e.target.style.boxShadow = '';
              }
            }}
            placeholder={placeholder}
            required={required}
          />
        )}
      </div>
      {error && (
        <div className="flex items-center gap-2 text-red-500 dark:text-red-400 text-sm mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <span className="w-1 h-1 rounded-full bg-red-500"></span>
          {error}
        </div>
      )}
    </div>
  );
};

export default FormInput;