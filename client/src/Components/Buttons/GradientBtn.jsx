import React from "react";
import PrimaryButton from "../Common/PrimaryButton";

export default function GradientBtn({ placeholder, type, onClick, className, disabled, isLoading }) {
  return (
    <PrimaryButton
      label={placeholder}
      onClick={onClick}
      type={type}
      className={className}
      disabled={disabled}
      isLoading={isLoading}
      variant="primary"
    />
  );
}
