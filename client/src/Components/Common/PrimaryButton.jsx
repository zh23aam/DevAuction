import React from "react";

const PrimaryButton = ({
  label,
  onClick,
  type = "button",
  className = "",
  disabled = false,
  isLoading = false,
  variant = "primary", // primary, danger, outline, gradient
  icon: Icon,
}) => {
  const baseStyles =
    "relative p-3 px-6 rounded-full font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap text-sm tracking-wide flex items-center justify-center gap-2 h-fit select-none cursor-pointer";

  const variants = {
    primary:
      "bg-gradient-to-b from-[#18203E] to-[#13203a] text-white/90 border border-white/10 shadow-[inset_0_0_10px_0_rgba(191,151,255,0.15)] ctaBtn",
    danger:
      "bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/50 shadow-lg shadow-red-500/10",
    outline:
      "bg-[#0f1325]/40 backdrop-blur-sm border border-[#0CA3E7]/30 text-[#0CA3E7] hover:bg-[#0CA3E7]/10 hover:border-[#0CA3E7]/50 shadow-sm",
    gradient:
      "bg-gradient-to-r from-[#9A76FF] via-[#0CA3E7] to-[#23DD9F] text-white shadow-lg shadow-blue-500/20 border-none",
    ghost:
      "bg-transparent text-gray-500 hover:text-white hover:bg-white/5 transition-colors",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          {label || "Processing..."}
        </span>
      ) : (
        <>
          {Icon && <Icon size={Icon.size || 14} className={Icon.className} />}
          {label}
        </>
      )}
    </button>
  );
};

export default PrimaryButton;
