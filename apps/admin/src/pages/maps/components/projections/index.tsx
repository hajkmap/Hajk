import { useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { Control, FieldValues, useController, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import DialogWrapper from "../../../../components/flexible-dialog";
import {
  useProjectionsWithUsage,
  type ProjectionWithUsage,
} from "../../../../api/projections";
import ProjectionFormDialog from "./projection-form-dialog";
import DeleteProjectionDialog from "./delete-projection-dialog";
import ProjectionRow from "./projection-row";
import { toRows, type ProjectionRow as Row } from "./projection-rows";

interface ProjectionsDialogProps {
  open: boolean;
  onClose: () => void;
  control: Control<FieldValues>;
}

/**
 * The projection catalogue, and which projections the map links. Ticking
 * only changes the form; the map's Save button stores it. Creating, editing
 * and deleting change the shared catalogue right away.
 */
export default function ProjectionsDialog({
  open,
  onClose,
  control,
}: ProjectionsDialogProps) {
  const { t } = useTranslation();
  const { data: projections, isLoading } = useProjectionsWithUsage();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectionWithUsage | null>(null);
  const [toDelete, setToDelete] = useState<Row | null>(null);
  const { field } = useController({ name: "projections", control });
  const mainProjection = useWatch({ control, name: "projection.code" }) as
    string | undefined;

  const selected = useMemo(
    () => (Array.isArray(field.value) ? (field.value as string[]) : []),
    [field.value],
  );
  const rows = useMemo(
    () => toRows(projections ?? [], selected),
    [projections, selected],
  );
  const selectedSet = new Set(selected);
  // Saving always links the main projection, so show it as linked.
  if (mainProjection) selectedSet.add(mainProjection);

  const query = search.trim().toLowerCase();
  const visibleRows = query
    ? rows.filter((r) => r.codes.some((c) => c.toLowerCase().includes(query)))
    : rows;

  const setRow = (row: Row, checked: boolean) => {
    const rest = selected.filter((c) => !row.codes.includes(c));
    field.onChange(checked ? [...rest, ...row.codes] : rest);
  };

  const handleCreated = (codes: string[]) => {
    field.onChange(Array.from(new Set([...selected, ...codes])));
  };

  return (
    <>
      <DialogWrapper
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        title={t("map.projections")}
        actions={
          <>
            <Button
              startIcon={<AddIcon />}
              onClick={() => setCreateOpen(true)}
              sx={{ mr: "auto" }}
            >
              {t("projections.new")}
            </Button>
            <Button variant="contained" onClick={onClose}>
              {t("common.dialog.closeBtn")}
            </Button>
          </>
        }
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {t("projections.linkHelp")}
        </Typography>
        <TextField
          size="small"
          fullWidth
          placeholder={t("projections.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 1 }}
        />
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Box>
            {visibleRows.map((row) => {
              const linkedCount = row.codes.filter((c) =>
                selectedSet.has(c),
              ).length;
              return (
                <ProjectionRow
                  key={row.label}
                  row={row}
                  linkedCount={linkedCount}
                  isMain={
                    mainProjection !== undefined &&
                    row.codes.includes(mainProjection)
                  }
                  onToggle={() => setRow(row, linkedCount !== row.codes.length)}
                  onEdit={() => setEditing(row.primary ?? null)}
                  onDelete={() => setToDelete(row)}
                />
              );
            })}
            {visibleRows.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                {t("projections.noMatches")}
              </Typography>
            )}
          </Box>
        )}
      </DialogWrapper>
      <ProjectionFormDialog
        open={createOpen || editing !== null}
        projection={editing}
        onClose={() => {
          setCreateOpen(false);
          setEditing(null);
        }}
        onCreated={handleCreated}
      />
      <DeleteProjectionDialog
        row={toDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
