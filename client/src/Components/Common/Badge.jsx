import React from "react";

/**
 * A shared Badge component for tags, skills, and status indicators.
 * Provides a premium, consistent look with glassmorphism and subtle gradients.
 */
const Badge = ({ 
  children, 
  variant = "default", 
  className = "", 
  size = "md",
  onClick 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-full font-medium transition-all duration-300 select-none";
  
  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-4 py-1 text-[12px]",
    lg: "px-6 py-2 text-sm"
  };

  const variants = {
    default: "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20",
    primary: "bg-[#0CA3E7]/10 border border-[#0CA3E7]/20 text-[#0CA3E7] hover:bg-[#0CA3E7]/20 hover:border-[#0CA3E7]/40",
    success: "bg-green-500/10 border border-green-500/20 text-green-500 hover:bg-green-500/20",
    danger: "bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20",
    premium: "bg-gradient-to-b from-[#18203E] to-[#172748] border border-white/10 text-gray-200 shadow-lg shadow-black/20"
  };

  return (
    <div 
      className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${className} ${onClick ? "cursor-pointer active:scale-95" : ""}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Badge;
