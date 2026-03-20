import React from "react";
import PrimaryButton from "../Common/PrimaryButton";

const LoginButton = ({ placeHolder }) => {
  return (
    <PrimaryButton
      label={placeHolder}
      variant="gradient"
      className="!rounded-xl"
    />
  );
};

export default LoginButton;