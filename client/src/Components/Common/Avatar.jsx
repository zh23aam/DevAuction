import React, { useState } from "react";

const Avatar = ({ src, alt, name, size = "md", className = "" }) => {
  const [hasError, setHasError] = useState(false);

  const getInitials = (userName) => {
    if (!userName) return "?";
    const parts = userName.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return userName[0].toUpperCase();
  };

  const getColor = (userName) => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-orange-500",
      "bg-cyan-500",
    ];
    if (!userName) return colors[0];
    let hash = 0;
    for (let i = 0; i < userName.length; i++) {
      hash = userName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const sizeClasses = {
    xs: "w-8 h-8 text-[10px]",
    sm: "w-10 h-10 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-xl",
    xl: "w-24 h-24 text-3xl",
    "2xl": "w-32 h-32 text-5xl",
    "avatar-xl": "sm:h-52 sm:w-48 w-32 h-36", // Matches existing profile hero size
  };

  const selectedSize = sizeClasses[size] || size;

  if (src && !hasError) {
    return (
      <div className={`${selectedSize} rounded-full overflow-hidden border-2 border-white/10 shadow-lg shrink-0 ${className}`}>
        <img
          src={src}
          alt={alt || name}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`${selectedSize} rounded-full flex items-center justify-center font-bold text-white shadow-lg border-2 border-white/10 shrink-0 ${getColor(name)} ${className}`}>
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
