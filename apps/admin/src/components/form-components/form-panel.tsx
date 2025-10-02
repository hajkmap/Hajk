import React from "react";
import { Paper, Typography } from "@mui/material";

interface FormPanelProps {
  title: string;
  children: React.ReactNode;
}

export default function FormPanel({ title, children }: FormPanelProps) {
  return (
    <Paper
      sx={{
        backgroundColor: "none",
        width: "100%",
        p: 2,
        pb: 0,
        pl: 0,
        mb: 3,
        ml: 2,
        mr: 2,
        display: "block",
      }}
    >
      <Typography variant="h6" sx={{ mt: -0.5, ml: 2, mb: 1.5 }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}
