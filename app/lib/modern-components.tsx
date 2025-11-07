"use client";
import React from 'react';

// Modern Card Component
export function ModernCard({ 
  children, 
  className = "", 
  hover = true,
  gradient = false,
  gradientFrom = "from-blue-500",
  gradientTo = "to-blue-600",
  onClick
}: { 
  children: React.ReactNode; 
  className?: string;
  hover?: boolean;
  gradient?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  onClick?: () => void;
}) {
  const baseClasses = "rounded-2xl shadow-lg transition-all duration-300";
  const hoverClasses = hover ? "hover:shadow-xl hover:scale-105" : "";
  const gradientClasses = gradient ? `bg-gradient-to-br ${gradientFrom} ${gradientTo}` : "bg-white/80 backdrop-blur-sm border border-white/20";
  
  return (
    <div 
      className={`${baseClasses} ${gradientClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// Modern Button Component
export function ModernButton({ 
  children, 
  onClick, 
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  type = "button"
}: { 
  children: React.ReactNode; 
  onClick?: () => void;
  variant?: "primary" | "secondary" | "success" | "danger" | "warning";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}) {
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white",
    secondary: "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white",
    success: "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white",
    danger: "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white",
    warning: "bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white"
  };
  
  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-base",
    lg: "px-6 py-4 text-lg"
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${variants[variant]} ${sizes[size]} rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

// Modern Input Component
export function ModernInput({ 
  value, 
  onChange, 
  placeholder, 
  type = "text",
  className = "",
  error = false,
  required = false,
  min,
  max,
  step,
  inputMode
}: { 
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  error?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  inputMode?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      min={min}
      max={max}
      step={step}
      {...(inputMode ? { inputMode: inputMode as React.InputHTMLAttributes<HTMLInputElement>['inputMode'] } : {})}
      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
        error 
          ? "border-red-500 bg-red-50" 
          : "border-gray-200 bg-white/80 backdrop-blur-sm focus:border-blue-500"
      } ${className}`}
    />
  );
}

// Debounced input for search fields
export function DebouncedInput({
  value,
  onDebouncedChange,
  delay = 300,
  placeholder,
  className = ""
}: {
  value: string;
  onDebouncedChange: (v: string) => void;
  delay?: number;
  placeholder?: string;
  className?: string;
}) {
  const [inner, setInner] = React.useState(value);
  React.useEffect(() => setInner(value), [value]);
  React.useEffect(() => {
    const t = setTimeout(() => {
      if (inner !== value) onDebouncedChange(inner);
    }, delay);
    return () => clearTimeout(t);
  }, [inner, delay]);
  return (
    <ModernInput
      value={inner}
      onChange={e=>setInner(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}

// Simple autocomplete dropdown
export function ModernAutocomplete<T extends { id: string; label: string }>({
  options,
  value,
  onChange,
  placeholder = "",
  className = ""
}: {
  options: T[];
  value?: string;
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState<number>(-1);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(q)).slice(0, 20);
  }, [options, query]);
  const selected = options.find(o => o.id === value);
  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
        placeholder={placeholder}
        value={open ? query : (selected?.label || "")}
        onChange={e=>{ setQuery(e.target.value); setOpen(true); setHighlightedIndex(0);} }
        onFocus={()=>{ setQuery(""); setOpen(true); setHighlightedIndex(0);} }
        onBlur={()=>setTimeout(()=>setOpen(false), 150)}
        onKeyDown={(e)=>{
          if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) { setOpen(true); setHighlightedIndex(0); return; }
          if (!open) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(i => Math.min((i<0?0:i)+1, filtered.length-1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(i => Math.max((i<=0?0:i-1), 0));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            const item = filtered[highlightedIndex] || filtered[0];
            if (item) { onChange(item.id); setOpen(false); (e.target as HTMLInputElement).blur(); }
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
      />
      {open && (
        <div ref={listRef} className="absolute z-40 mt-1 w-full bg-white rounded-xl shadow-lg border max-h-56 overflow-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">Không có kết quả</div>
          ) : (
            filtered.map((o, idx) => (
              <button
                key={o.id}
                className={`w-full text-left px-4 py-2 ${idx===highlightedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                onMouseEnter={()=>setHighlightedIndex(idx)}
                onMouseDown={(e)=>e.preventDefault()}
                onClick={()=>{ onChange(o.id); setOpen(false); inputRef.current?.blur(); }}
              >
                {o.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Modern Select Component
export function ModernSelect({ 
  value, 
  onChange, 
  children,
  className = "",
  error = false
}: { 
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  className?: string;
  error?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
        error 
          ? "border-red-500 bg-red-50" 
          : "border-gray-200 bg-white/80 backdrop-blur-sm focus:border-blue-500"
      } ${className}`}
    >
      {children}
    </select>
  );
}

// Controlled inputs adapters for react-hook-form
export function RHFInput({ control, name, rules, ...rest }: any) {
  const { Controller } = require('react-hook-form');
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }: any) => (
        <ModernInput {...rest} value={field.value ?? ''} onChange={(e)=>field.onChange(e.target.value)} error={!!fieldState.error} />
      )}
    />
  );
}

export function RHFSelect({ control, name, rules, children, ...rest }: any) {
  const { Controller } = require('react-hook-form');
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }: any) => (
        <ModernSelect {...rest} value={field.value ?? ''} onChange={(e)=>field.onChange(e.target.value)} error={!!fieldState.error}>
          {children}
        </ModernSelect>
      )}
    />
  );
}

export function RHFAutocomplete({ control, name, rules, options, placeholder, className }: any) {
  const { Controller } = require('react-hook-form');
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }: { field: { value: string; onChange: (v: string)=>void } }) => (
        <ModernAutocomplete options={options} value={field.value} onChange={field.onChange} placeholder={placeholder} className={className} />
      )}
    />
  );
}

// Modern Form Component
export function ModernForm({ 
  children, 
  onSubmit, 
  className = ""
}: { 
  children: React.ReactNode; 
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
}) {
  return (
    <form 
      onSubmit={onSubmit} 
      className={`bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-lg space-y-4 ${className}`}
    >
      {children}
    </form>
  );
}

// Modern List Item Component
export function ModernListItem({ 
  children, 
  className = "",
  hover = true
}: { 
  children: React.ReactNode; 
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={`bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-white/20 shadow-lg transition-all duration-300 ${
      hover ? "hover:shadow-xl hover:scale-105" : ""
    } ${className}`}>
      {children}
    </div>
  );
}

// Modern Stats Card Component
export function StatsCard({ 
  title, 
  value, 
  icon, 
  gradient = "from-blue-500 to-blue-600",
  textColor = "text-white"
}: { 
  title: string; 
  value: string | number; 
  icon?: string;
  gradient?: string;
  textColor?: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
      {icon && <div className="text-2xl mb-2">{icon}</div>}
      <div className={`text-sm ${textColor} mb-1`}>{title}</div>
      <div className={`text-2xl font-bold ${textColor}`}>{value}</div>
    </div>
  );
}

// Confirm Dialog Component
export function ConfirmDialog({
  open,
  title = "Xác nhận",
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  onConfirm,
  onCancel
}: {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-sm p-5">
        <div className="text-lg font-semibold text-gray-900 mb-2">{title}</div>
        <div className="text-gray-600 mb-5">{message}</div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}