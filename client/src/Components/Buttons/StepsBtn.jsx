import React from 'react'
import PrimaryButton from "../Common/PrimaryButton";

export default function StepsBtn({stepNo}) {
  return (
    <PrimaryButton
      label={`Step ${stepNo}`}
      variant="outline"
      className="!rounded-xl !border-[#0CA3E7]/40 !bg-[#0CA3E7]/11 !text-white/90"
    />
  )
}
