import React, { FormEventHandler } from "react";
import { Box } from "@mui/material";

interface FormContainerProps {
  children: React.ReactNode;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  className?: string;
  noValidate?: boolean;
  autoComplete?: string;
  formRef?: React.Ref<HTMLFormElement>;
}

export default function FormContainer({
  children,
  onSubmit = (e) => {
    e.preventDefault();
  },
  className = "form-container",
  noValidate = true,
  autoComplete = "off",
  formRef,
}: FormContainerProps) {
  return (
    <Box
      sx={{ ml: -2 }}
      component="form"
      className={className}
      onSubmit={onSubmit}
      noValidate={noValidate}
      autoComplete={autoComplete}
      ref={formRef}
    >
      {children}
    </Box>
  );
}
