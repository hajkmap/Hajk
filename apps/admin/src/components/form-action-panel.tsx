import React, { useState } from "react";
import { Box, Button, styled, Typography, Paper } from "@mui/material";
import CircularProgress from "../components/progress/circular-progress";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import DialogWrapper from "../components/flexible-dialog";

interface FormActionProps {
  name?: string;
  updateStatus: "idle" | "pending" | "success" | "error";
  deleteStatus: "idle" | "pending" | "success" | "error";
  onUpdate: () => void | Promise<void>;
  onDelete: () => void | Promise<void>;
  lastSavedBy?: string;
  lastSavedDate?: string;
  children?: React.ReactNode;
  dirtyFields?: Partial<Readonly<Record<string, boolean>>>;
}

const FormActionPanel: React.FC<FormActionProps> = ({
  updateStatus,
  deleteStatus,
  onUpdate,
  lastSavedBy = "",
  lastSavedDate = "",
  children,
  dirtyFields,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const saveButtonDisabled =
    !dirtyFields || Object.keys(dirtyFields).length === 0;

  const ActionContainer = styled(Box)(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    textAlign: "center",
    float: "right",
    gap: theme.spacing(2),
    padding: theme.spacing(2),
    marginLeft: theme.spacing(3),
    marginBottom: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    minWidth: "220px",
    maxWidth: "300px",
    top: "100px",
    position: "sticky",
    backgroundColor:
      theme.palette.mode === "dark"
        ? theme.palette.background.paper
        : theme.palette.background.default,
    color: theme.palette.text.primary,
  }));

  const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(1),
    backgroundColor:
      theme.palette.mode === "dark"
        ? theme.palette.background.paper
        : theme.palette.background.default,
    textAlign: "center",
    color: theme.palette.text.primary,
    // border: `1px solid ${theme.palette.divider}`,
    border: "none",
    boxShadow: "none",
    elevation: 0,
  }));

  const getTimeAgo = (dateString?: string): string => {
    if (!dateString) return "Unknown";

    const date = new Date(dateString);
    const now = new Date();
    const time = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const today = new Date(now.setHours(0, 0, 0, 0));
    const savedDate = new Date(date.setHours(0, 0, 0, 0));

    const diffInDays = Math.floor(
      (today.getTime() - savedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return `${t("formControl.time.today")} ${time}`;
    if (diffInDays === 1) return `${t("formControl.time.yesterday")} ${time}`;
    if (diffInDays < 7) return `${diffInDays} ${t("formControl.time.daysAgo")}`;
    if (diffInDays < 30)
      return `${Math.floor(diffInDays / 7)} ${t("formControl.time.weeksAgo")}`;
    if (diffInDays < 365)
      return `${Math.floor(diffInDays / 30)} ${t("formControl.time.monthsAgo")}`;

    return `${Math.floor(diffInDays / 365)} ${t("formControl.time.yearsAgo")}`;
  };

  const renderSaveButton = () => (
    <Button
      onClick={(e) => {
        e.preventDefault();
        void onUpdate();
      }}
      variant="contained"
      color="primary"
      disabled={
        updateStatus === "pending" ||
        deleteStatus === "pending" ||
        saveButtonDisabled
      }
    >
      {updateStatus === "pending" ? (
        <CircularProgress color="primary" size={12} />
      ) : (
        t("common.dialog.saveBtn")
      )}
    </Button>
  );

  const renderCancelButton = () => (
    <Button
      onClick={() => void navigate(-1)}
      variant="text"
      color="primary"
      sx={{ "&:hover": { backgroundColor: "grey.300" } }}
    >
      {t("common.cancel")}
    </Button>
  );

  const renderSavedInformation = () => (
    <StyledPaper>
      <Typography variant="body1" sx={{ fontSize: "1rem" }}>
        {t("common.lastSaved")} {t("common.of")}{" "}
        {lastSavedBy ? lastSavedBy : t("formControl.unknown")}{" "}
        {getTimeAgo(lastSavedDate)}
      </Typography>
    </StyledPaper>
  );

  return (
    <Box
      sx={{
        alignItems: "flex-start",
        gap: 3,
      }}
    >
      <ActionContainer sx={{ maxWidth: "200px" }}>
        {renderSaveButton()}
        {renderCancelButton()}
        {renderSavedInformation()}
      </ActionContainer>
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
