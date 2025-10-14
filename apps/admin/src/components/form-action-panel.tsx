import React from "react";
import { Box, Button, Typography } from "@mui/material";
import CircularProgress from "../components/progress/circular-progress";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

// This custom component will replace the save/delete panel-buttons on all the forms

interface FormActionProps {
  updateStatus: "idle" | "pending" | "success" | "error";
  onUpdate: () => void | Promise<void>;
  lastSavedBy?: string;
  lastSavedDate?: string;
  saveButtonText?: string;
  children?: React.ReactNode;
}

const FormActionPanel: React.FC<FormActionProps> = ({
  updateStatus,
  onUpdate,
  lastSavedBy = "",
  lastSavedDate = "",
  saveButtonText = "",
  children,
}) => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        alignItems: "flex-start",
        gap: 3,
        width: "100%",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          textAlign: "center",
          float: "right",
          gap: 2,
          p: 2,
          ml: 3,
          mb: 2,
          border: "1px solid",
          borderColor: "grey.300",
          borderRadius: 3,
          maxWidth: "200px",
          top: "100px",
          position: "sticky",
        }}
      >
        <Button
          onClick={(e) => {
            e.preventDefault();
            void onUpdate();
          }}
          variant="contained"
          disabled={updateStatus === "pending"}
        >
          {updateStatus === "pending" ? (
            <CircularProgress color="primary" size={30} />
          ) : (
            t("services.dialog.saveBtn", saveButtonText)
          )}
        </Button>

        <Typography variant="body1">
          {t("common.lastSavedBy", { lastSavedBy, lastSavedDate })}
        </Typography>
      </Box>
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default FormActionPanel;
