import React, { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  Popover,
  Typography,
  Avatar,
  Tooltip,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CircularProgress from "../components/progress/circular-progress";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useUser } from "../api/users";

// This custom component will replace the save/delete panel-buttons on all the forms

interface FormActionProps {
  updateStatus: "idle" | "pending" | "success" | "error";
  onUpdate: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  /** Where Avbryt goes when no onCancel is given, usually the list page. */
  cancelTo: string;
  saveButtonText?: string;
  backLink?: { label: string; href: string };
  createdBy?: string;
  createdDate?: string;
  lastSavedBy?: string;
  lastSavedDate?: string;
  children?: React.ReactNode;
  isDirty?: boolean;
  warning?: React.ReactNode;
  /** Optional content rendered below the action buttons in the sticky sidebar. */
  sidebarExtra?: React.ReactNode;
}

/** A warning icon. Click it to show the message, click it again to hide the message. */
export function CollapsibleWarning({
  severity = "warning",
  label,
  children,
}: {
  severity?: "warning" | "info" | "error" | "success";
  /** Accessible name for the icon. Falls back to the message when that is text. */
  label?: string;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const iconLabel = label ?? (typeof children === "string" ? children : undefined);

  return (
    <Box ref={anchorRef} sx={{ minWidth: 0, width: "100%" }}>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <IconButton
          size="small"
          color={
            severity === "info"
              ? "info"
              : severity === "error"
                ? "error"
                : "warning"
          }
          aria-label={iconLabel}
          aria-expanded={expanded}
          onClick={() => setExpanded((open) => !open)}
        >
          {severity === "info" ? (
            <InfoOutlinedIcon fontSize="small" />
          ) : (
            <WarningAmberIcon fontSize="small" />
          )}
        </IconButton>
      </Box>
      <Popover
        open={expanded}
        anchorEl={anchorRef.current}
        onClose={(event) => {
          const target = event && "target" in event ? event.target : null;
          if (target instanceof Node && anchorRef.current?.contains(target)) {
            return;
          }
          setExpanded(false);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        disableScrollLock
        disableAutoFocus
        disableRestoreFocus
        slotProps={{
          paper: {
            sx: {
              width: anchorRef.current?.clientWidth ?? 168,
              mt: 1,
            },
          },
        }}
      >
        <Alert
          severity={severity}
          sx={{
            alignItems: "flex-start",
            "& .MuiAlert-message": {
              fontSize: "0.8rem",
              lineHeight: 1.4,
              overflowWrap: "anywhere",
            },
          }}
        >
          {children}
        </Alert>
      </Popover>
    </Box>
  );
}

const FormActionPanel: React.FC<FormActionProps> = ({
  updateStatus,
  onUpdate,
  onCancel,
  cancelTo,
  saveButtonText = "",
  backLink,
  createdBy,
  createdDate,
  lastSavedBy,
  lastSavedDate,
  children,
  isDirty,
  warning,
  sidebarExtra,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: createdUser } = useUser(createdBy ?? "");
  const { data: lastSavedUser } = useUser(lastSavedBy ?? "");

  const formatDate = (d?: string) => (d ? new Date(d).toLocaleString() : "");
  const initials = (name?: string) =>
    (name ?? "")
      .split(" ")
      .map((p) => p.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const handleCancel = () => {
    if (onCancel) {
      void onCancel();
    } else {
      void navigate(cancelTo);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row-reverse",
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
          flexShrink: 0,
          gap: 2,
          p: 2,
          border: "1px solid",
          borderColor: "grey.300",
          borderRadius: 3,
          width: 200,
          maxWidth: 200,
          minWidth: 0,
          overflow: "hidden",
          top: "100px",
          position: "sticky",
        }}
      >
        {updateStatus === "error" && (
          <Alert severity="error" sx={{ textAlign: "left" }}>
            {t("common.saveFailed")}
          </Alert>
        )}
        <Button
          onClick={(e) => {
            e.preventDefault();
            void onUpdate();
          }}
          variant="contained"
          disabled={updateStatus === "pending" || !isDirty}
          sx={{ height: 30 }}
        >
          {updateStatus === "pending" ? (
            <CircularProgress color="primary" size={20} />
          ) : (
            saveButtonText || t("common.dialog.saveBtn")
          )}
        </Button>
        <Button
          onClick={(e) => {
            e.preventDefault();
            void handleCancel();
          }}
        >
          {t("common.cancel")}
        </Button>
        {backLink && (
          <Button component="a" href={backLink.href}>
            {backLink.label}
          </Button>
        )}

        {createdBy && createdDate && (
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Tooltip title={createdUser?.fullName ?? createdBy}>
              <Avatar sx={{ width: 30, height: 30, fontSize: 13 }}>
                {initials(createdUser?.fullName ?? createdBy)}
              </Avatar>
            </Tooltip>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {t("common.createdBy", {
                  createdBy: createdUser?.fullName ?? createdBy,
                  createdDate: formatDate(createdDate),
                })}
              </Typography>
            </Box>
          </Box>
        )}

        {lastSavedBy && lastSavedDate && (
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Tooltip title={lastSavedUser?.fullName ?? lastSavedBy}>
              <Avatar sx={{ width: 30, height: 30, fontSize: 13 }}>
                {initials(lastSavedUser?.fullName ?? lastSavedBy)}
              </Avatar>
            </Tooltip>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {t("common.lastSavedBy", {
                  lastSavedBy: lastSavedUser?.fullName ?? lastSavedBy,
                  lastSavedDate: formatDate(lastSavedDate),
                })}
              </Typography>
            </Box>
          </Box>
        )}

        {warning}
        {sidebarExtra}
      </Box>
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
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
