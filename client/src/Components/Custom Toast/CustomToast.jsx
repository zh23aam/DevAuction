import React from "react";
import { RxCross2 } from "react-icons/rx";
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo } from "react-icons/fi";

export default function CustomToast({
  msg,
  type,
  className,
  setShowToast,
}) {
  const getIcon = () => {
    switch (type?.toLowerCase()) {
      case "green":
      case "success":
        return <FiCheckCircle className="text-emerald-400" size={20} />;
      case "red":
      case "error":
        return <FiXCircle className="text-rose-400" size={20} />;
      case "yellow":
      case "warning":
        return <FiAlertCircle className="text-amber-400" size={20} />;
      default:
        return <FiInfo className="text-blue-400" size={20} />;
    }
  };

  const getStyles = () => {
    switch (type?.toLowerCase()) {
      case "green":
      case "success":
        return "border-emerald-500/20 bg-emerald-500/10 shadow-emerald-500/10";
      case "red":
      case "error":
        return "border-rose-500/20 bg-rose-500/10 shadow-rose-500/10";
      case "yellow":
      case "warning":
        return "border-amber-500/20 bg-amber-500/10 shadow-amber-500/10";
      default:
        return "border-blue-500/20 bg-blue-500/10 shadow-blue-500/10";
    }
  };

  return (
    <div
      className={`fixed top-12 z-[1000000] flex items-center gap-4 px-5 py-4 rounded-2xl text-white transition-all duration-500 ease-out backdrop-blur-xl border ${getStyles()} shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] ${className}`}
    >
      <div className="flex items-center gap-3">
        {getIcon()}
        <span className="text-sm font-bold tracking-tight text-white/90">{msg}</span>
      </div>
      <button
        onClick={() => setShowToast(false)}
        className="p-1.5 hover:bg-white/10 rounded-full transition-all text-white/30 hover:text-white ml-2"
      >
        <RxCross2 size={16} />
      </button>
    </div>
  );
}
