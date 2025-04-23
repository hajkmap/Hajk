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
  name = "",
  updateStatus,
  deleteStatus,
  onUpdate,
  onDelete,
  lastSavedBy = "",
  lastSavedDate = "",
  children,
  dirtyFields,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const saveButtonDisabled =
    !dirtyFields || Object.keys(dirtyFields).length === 0;
  const [open, setOpen] = useState<boolean>(false);

  const ActionContainer = styled(Box)(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    textAlign: "center",
    float: "right",
    gap: theme.spacing(2),
    padding: theme.spacing(2),
    marginLeft: theme.spacing(3),
    marginBottom: theme.spacing(2),
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: theme.shape.borderRadius,
    minWidth: "220px",
    maxWidth: "300px",
    top: "100px",
    position: "sticky",
  }));

  const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    backgroundColor: theme.palette.grey[100],
    textAlign: "center",
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
  
    const diffInDays = Math.floor((today.getTime() - savedDate.getTime()) / (1000 * 60 * 60 * 24));
  
    if (diffInDays === 0) return `${t("formControl.time.today")} ${time}`;
    if (diffInDays === 1) return `${t("formControl.time.yesterday")} ${time}`;
    if (diffInDays < 7) return `${diffInDays} ${t("formControl.time.daysAgo")}`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} ${t("formControl.time.weeksAgo")}`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} ${t("formControl.time.monthsAgo")}`;
    
    return `${Math.floor(diffInDays / 365)} ${t("formControl.time.yearsAgo")}`;
  };

  const renderSaveButton = () => (
    <Button
      onClick={(e) => {
        e.preventDefault();
        void onUpdate();
      }}
      variant="contained"
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
      variant="contained"
      color="warning"
    >
      {t("common.cancel")}
    </Button>
  );

  const renderDeleteButton = () => (
    <Button
      onClick={() => setOpen(true)}
      disabled={deleteStatus === "pending" || updateStatus === "pending"}
      variant="contained"
      color="error"
    >
      {t("common.dialog.deleteBtn")}
    </Button>
  );

  const renderDialog = () => (
    <DialogWrapper
      open={open}
      title={t("common.dialog.deleteConfirmation", { name })}
      onClose={() => setOpen(false)}
      actions={
        <>
          {renderDialogCancelButton()}
          {renderDialogDeleteButton()}
        </>
      }
      fullWidth={true}
    >
      <Typography variant="body2" color="text.secondary">
        {t("common.dialog.deleteWarning")}
      </Typography>
    </DialogWrapper>
  );

  const renderDialogDeleteButton = () => (
    <Button
      onClick={(e) => {
        e.preventDefault();
        setOpen(false);
        void onDelete();
        void navigate(-1);
      }}
      type="submit"
      variant="contained"
      color="error"
      disabled={deleteStatus === "pending"}
    >
      {deleteStatus === "pending" ? (
        <CircularProgress color="primary" size={12} />
      ) : (
        t("common.dialog.deleteBtn")
      )}
    </Button>
  );

  const renderSavedInformation = () => (
    <StyledPaper>
      <Typography
        variant="h5"
        sx={{ fontSize: "1.20rem", fontWeight: "bold", mb: 1 }}
      >
        {t("common.lastSaved")}
      </Typography>
      <Typography variant="subtitle1" sx={{ fontSize: "1rem" }}>
        {getTimeAgo(lastSavedDate)}
      </Typography>
      <Typography variant="body1">{t("common.of")}</Typography>
      <Typography variant="body1">{lastSavedBy ? lastSavedBy : t("formControl.unknown")}</Typography>
    </StyledPaper>
  );

  const renderDialogCancelButton = () => (
    <Button
      onClick={() => setOpen(false)}
      variant="contained"
      color="secondary"
    >
      {t("common.cancel")}
    </Button>
  );

  return (
    <Box
      sx={{
        alignItems: "flex-start",
        gap: 3,
        width: "100%",
      }}
    >
      <ActionContainer>
        {renderSaveButton()}
        {renderCancelButton()}
        {renderDeleteButton()}
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
      {renderDialog()}
    </Box>
  );
};

export default FormActionPanel;
