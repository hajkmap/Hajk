import React from "react";
import { Box, Button, Typography } from "@mui/material";
import CircularProgress from "../components/progress/circular-progress";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

// This custom component will replace the save/delete panel-buttons on all the forms

interface FormActionProps {
  updateStatus: "idle" | "pending" | "success" | "error";
  deleteStatus: "idle" | "pending" | "success" | "error";
  onUpdate: () => void | Promise<void>;
  onDelete: () => void | Promise<void>;
  lastSavedBy?: string;
  lastSavedDate?: string;
  saveButtonText?: string;
  deleteButtonText?: string;
  children?: React.ReactNode;
  navigateTo?: string;
}

const FormActionPanel: React.FC<FormActionProps> = ({
  updateStatus,
  deleteStatus,
  onUpdate,
  onDelete,
  lastSavedBy = "",
  lastSavedDate = "",
  saveButtonText = "",
  deleteButtonText = "",
  children,
  navigateTo,
}) => {
  const navigate = useNavigate();
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
        }}
      >
        <Button
          onClick={(e) => {
            e.preventDefault();
            void onUpdate();
          }}
          variant="contained"
          disabled={updateStatus === "pending" || deleteStatus === "pending"}
        >
          {updateStatus === "pending" ? (
            <CircularProgress color="primary" size={30} />
          ) : (
            t("services.dialog.saveBtn", saveButtonText)
          )}
        </Button>

        <Button
          onClick={(e) => {
            e.preventDefault();
            void onDelete();
            if (navigateTo) {
              void navigate(navigateTo);
            }
          }}
          disabled={deleteStatus === "pending" || updateStatus === "pending"}
          variant="text"
        >
          {t("common.dialog.deleteBtn", deleteButtonText)}
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
