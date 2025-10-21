"use client";
import { useState } from "react";

type ValidationError = {
  field: string;
  message: string;
};

export function useFormValidation() {
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const validate = (data: Record<string, any>, rules: Record<string, (value: any) => string | null>) => {
    const newErrors: ValidationError[] = [];
    
    Object.entries(rules).forEach(([field, validator]) => {
      const error = validator(data[field]);
      if (error) {
        newErrors.push({ field, message: error });
      }
    });
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const clearErrors = () => setErrors([]);
  
  const getError = (field: string) => errors.find(e => e.field === field)?.message;

  return { errors, validate, clearErrors, getError };
}

// Common validation rules
export const validationRules = {
  required: (fieldName: string) => (value: any) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${fieldName} là bắt buộc`;
    }
    return null;
  },
  
  minLength: (min: number, fieldName: string) => (value: string) => {
    if (value && value.length < min) {
      return `${fieldName} phải có ít nhất ${min} ký tự`;
    }
    return null;
  },
  
  minValue: (min: number, fieldName: string) => (value: number) => {
    if (value !== undefined && value < min) {
      return `${fieldName} phải lớn hơn hoặc bằng ${min}`;
    }
    return null;
  },
  
  maxValue: (max: number, fieldName: string) => (value: number) => {
    if (value !== undefined && value > max) {
      return `${fieldName} phải nhỏ hơn hoặc bằng ${max}`;
    }
    return null;
  },
  
  email: (value: string) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Email không hợp lệ';
    }
    return null;
  },
  
  phone: (value: string) => {
    if (value && !/^[0-9+\-\s()]+$/.test(value)) {
      return 'Số điện thoại không hợp lệ';
    }
    return null;
  }
};

// Error display component
export function ErrorMessage({ error }: { error?: string }) {
  if (!error) return null;
  
  return (
    <div className="text-red-600 text-sm mt-1">
      {error}
    </div>
  );
}

// Loading spinner component
export function LoadingSpinner({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };
  
  return (
    <div className={`animate-spin rounded-full border-b-2 border-current ${sizeClasses[size]}`}></div>
  );
}

// Success/Error toast component
export function Toast({ 
  message, 
  type = "success", 
  onClose 
}: { 
  message: string; 
  type?: "success" | "error" | "info";
  onClose: () => void;
}) {
  const typeClasses = {
    success: "bg-green-600",
    error: "bg-red-600", 
    info: "bg-blue-600"
  };
  
  return (
    <div className={`fixed top-4 right-4 ${typeClasses[type]} text-white px-4 py-2 rounded-lg shadow-lg z-50`}>
      <div className="flex items-center justify-between">
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 text-white hover:text-gray-200">
          ×
        </button>
      </div>
    </div>
  );
}
