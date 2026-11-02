import React from "react";
import { Paper, Typography } from "@mui/material";
import { useSettingsSearchTerm } from "./settings-search";

interface FormPanelProps {
  title: string;
  /** Keep the title for settings search, but don't render it (e.g. when a tab already names the panel). */
  hideTitle?: boolean;
  children: React.ReactNode;
}

export default function FormPanel({
  title,
  hideTitle,
  children,
}: FormPanelProps) {
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
      {!hideTitle && (
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          {title}
        </Typography>
      )}
      {children}
    </Paper>
  );
}
