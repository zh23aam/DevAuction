import React from "react";
import GradientBtn from "../Buttons/GradientBtn";
import { BiErrorCircle } from "react-icons/bi";

/**
 * ErrorSection Component
 * A reusable, visually appealing component for displaying error states.
 * 
 * @param {string} title - The main error title
 * @param {string} message - A detailed error message
 * @param {function} onRetry - Optional callback for retrying the operation
 */
const ErrorSection = ({ 
  title = "Oops! Something went wrong", 
  message = "We encountered an unexpected error. Please try again later.", 
  onRetry 
}) => {
  return (
    <div className="w-full flex flex-col justify-center items-center py-20 px-4 bg-[#050618] text-center animate-in fade-in duration-700">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full"></div>
        <BiErrorCircle className="text-red-500 relative z-10" size="80" />
      </div>
      
      <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
        {title}
      </h2>
      
      <div className="max-w-md mx-auto mb-8">
        <p className="text-gray-400 text-lg leading-relaxed">
          {message}
        </p>
      </div>

      {onRetry && (
        <div className="animate-bounce-subtle">
          <GradientBtn placeholder="Try Again" onClick={onRetry} />
        </div>
      )}
    </div>
  );
};

export default ErrorSection;
