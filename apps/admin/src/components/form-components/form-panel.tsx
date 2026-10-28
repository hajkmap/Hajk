import React from "react";
import { Paper, Typography } from "@mui/material";
import { useSettingsSearchTerm } from "./settings-search";

interface FormPanelProps {
  title: string;
  children: React.ReactNode;
}

export default function FormPanel({ title, children }: FormPanelProps) {
  const searching = useSettingsSearchTerm() !== null;

  return (
    <Paper
      {...(searching
        ? { "data-settings-section": "", "data-settings-title": title }
        : {})}
      sx={{
        backgroundColor: "none",
        width: "100%",
        p: 2,
        mb: 3,
        display: "block",
      }}
    >
      <Typography variant="h6" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}
