import React from "react";

/**
 * A shared EmptyState component for consistent "no data" displays.
 * Standardizes iconography, typography, and optional actions.
 */
const EmptyState = ({ 
  icon = "🔍", 
  title = "No results found", 
  description = "Try adjusting your search or filters to find what you're looking for.",
  actionText,
  onAction,
  className = "",
  size = "lg"
}) => {
  const sizePadding = {
    sm: "py-10",
    md: "py-14",
    lg: "py-20"
  };

  return (
    <div className={`w-full ${sizePadding[size]} flex flex-col items-center justify-center text-center text-gray-600 gap-4 border-2 border-dashed border-white/5 rounded-3xl animate-in fade-in zoom-in duration-500 ${className}`}>
      <span className="text-6xl grayscale opacity-20 mb-2">{icon}</span>
      <div className="max-w-xs space-y-1">
        <p className="text-xl font-bold text-gray-400 tracking-tight">{title}</p>
        <p className="text-sm text-gray-500 leading-relaxed font-medium">{description}</p>
      </div>
      {actionText && onAction && (
        <button 
          onClick={onAction}
          className="mt-4 text-[#0CA3E7] hover:text-[#0CA3E7]/80 font-bold text-xs uppercase tracking-[0.2em] transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
