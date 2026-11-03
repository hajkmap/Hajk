import { Button, CircularProgress, Typography } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import DialogWrapper from "../../../../components/flexible-dialog";
import { useDeleteProjection } from "../../../../api/projections";
import type { ProjectionRow } from "./projection-rows";

interface DeleteProjectionDialogProps {
  row: ProjectionRow | null;
  onClose: () => void;
}

/** Confirms and deletes a projection (and its unused other form). */
export default function DeleteProjectionDialog({
  row,
  onClose,
}: DeleteProjectionDialogProps) {
  const { t } = useTranslation();
  const deleteProjection = useDeleteProjection();

  const handleDelete = async () => {
    if (!row?.primary) return;
    try {
      const deleted = await deleteProjection.mutateAsync(row.primary.id);
      toast.success(t("projections.deleted", { codes: deleted.join(", ") }));
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <DialogWrapper
      fullWidth
      open={row !== null}
      title={t("projections.deleteTitle")}
      onClose={onClose}
      actions={
        <>
          <Button onClick={onClose}>{t("common.cancel")}</Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteProjection.isPending}
            onClick={() => void handleDelete()}
            startIcon={
              deleteProjection.isPending ? (
                <CircularProgress color="inherit" size={18} />
              ) : (
                <DeleteOutlineIcon />
              )
            }
          >
            {t("common.delete")}
          </Button>
        </>
      }
    >
      <Typography>
        {t("projections.deleteConfirm", {
          codes: row ? row.codes.join(", ") : "",
        })}
      </Typography>
    </DialogWrapper>
  );
}
