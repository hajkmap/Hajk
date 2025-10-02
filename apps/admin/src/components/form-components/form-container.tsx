import React, { FormEventHandler } from "react";
import { Box } from "@mui/material";

interface FormContainerProps {
  children: React.ReactNode;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  className?: string;
  noValidate?: boolean;
  autoComplete?: string;
}

export default function FormContainer({
  children,
  onSubmit = (e) => {
    e.preventDefault();
    console.warn("No relevant onSubmit handler provided");
  },
  className = "form-container",
  noValidate = true,
  autoComplete = "off",
}: FormContainerProps) {
  return (
    <Box
      sx={{ ml: -2 }}
      component="form"
      className={className}
      onSubmit={onSubmit}
      noValidate={noValidate}
      autoComplete={autoComplete}
    >
      {children}
    </Box>
  );
}
