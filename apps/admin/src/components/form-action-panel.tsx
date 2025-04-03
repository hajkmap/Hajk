import React, {useState} from "react";
import { Box, Button, Typography } from "@mui/material";
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
  const saveButtonDisabled = !dirtyFields || Object.keys(dirtyFields).length === 0;
  const [open, setOpen] = useState<boolean>(false);

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
        {/* Save Button */}
        <Button
          onClick={(e) => {
            e.preventDefault();
            void onUpdate();
          }}
          variant="contained"
          disabled={updateStatus === "pending" || deleteStatus === "pending" || saveButtonDisabled}
        >
          {updateStatus === "pending" ? (
            <CircularProgress color="primary" size={12} />
          ) : (
            t("common.dialog.saveBtn")
          )}
        </Button>

        {/* Cancel Button */}
        <Button
          onClick={() => {
            void navigate("/layers");
          }}
          variant="contained"
          color="warning"
        >
          {t("common.cancel")}
        </Button>

        {/* Delete Button */}
        <Button
          onClick={() => {
            setOpen(true);
          }}
          disabled={deleteStatus === "pending" || updateStatus === "pending"}
          variant="contained"
          color="error"
        >
          {t("common.dialog.deleteBtn")}
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
              {/* Delete Dialog */}
      <DialogWrapper
        open={open}
        title={t("common.dialog.deleteConfirmation", { name })}
        onClose={() => setOpen(false)}
        actions={(
          <>
            <Button onClick={() => setOpen(false)} variant="contained" color="secondary">
              {t("common.cancel")}
            </Button>
            <Button
              onClick={(e) => {
                e.preventDefault();
                setOpen(false);
                void onDelete();
                void navigate("/layers");
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
          </>
        )}
        fullWidth={true}
      >
        <Typography variant="body2" color="text.secondary">
          {t("common.dialog.deleteWarning")}
        </Typography>
      </DialogWrapper>
    </Box>
  );
};

export default FormActionPanel;
