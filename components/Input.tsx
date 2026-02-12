import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  labelEn?: string; // New prop for English subtitle
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, labelEn, error, className = '', ...props }) => {
  return (
    <div className="w-full mb-6">
      <div className="flex items-baseline gap-2 mb-2 pl-1">
        <label className="text-gray-300 text-sm font-medium tracking-wide">
          {label}
        </label>
        {labelEn && (
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-sans">
            {labelEn}
          </span>
        )}
      </div>
      
      <div className="relative group">
        <input
          className={`w-full bg-white/5 border-b border-white/20 rounded-t-sm px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all duration-300 ${className}`}
          {...props}
        />
        {/* Animated bottom line effect */}
        <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-300 group-focus-within:w-full"></div>
      </div>
      
      {error && (
        <p className="text-red-400 text-xs mt-1 ml-1">{error}</p>
      )}
    </div>
  );
};