import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface AuthFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: 'text' | 'email' | 'password' | 'date';
  inputMode?: 'text' | 'numeric' | 'email' | 'tel';
  maxLength?: number;
  autoComplete?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  showToggle?: boolean;
  revealed?: boolean;
  onToggleReveal?: () => void;
  className?: string;
}

const baseInput =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary/50 outline-none transition-colors';

const AuthField: React.FC<AuthFieldProps> = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  maxLength,
  autoComplete,
  onKeyDown,
  showToggle,
  revealed,
  onToggleReveal,
  className = '',
}) => {
  const inputType = type === 'password' && revealed ? 'text' : type;

  return (
    <div className={`relative ${className}`}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={inputType}
        inputMode={inputMode}
        maxLength={maxLength}
        autoComplete={autoComplete}
        onKeyDown={onKeyDown}
        className={`${baseInput} ${showToggle ? 'pr-11' : ''}`}
      />
      {showToggle && onToggleReveal && (
        <button
          type="button"
          onClick={onToggleReveal}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-300 transition-colors"
          aria-label={revealed ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
};

export default AuthField;