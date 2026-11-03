import { useEffect } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
} from "@mui/material";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import DialogWrapper from "./flexible-dialog";
import { useCreateProjection, useUpdateProjection } from "../api/projections";
import type { Projection } from "../api/services/types";
import { isEpsgCode } from "../pages/maps/projection-codes";

interface Projecti onFormDialogProps {
  open: boolean;
  onClose: () => void;
  /** Edit this projection; create a new one when omitted. */
  projection?: Projection | null;
  /** Called with every created code (the projection and any alias). */
  onCreated?: (codes: string[]) => void;
}

interface FormValues {
  code: string;
  definition: string;
  minX: string;
  minY: string;
  maxX: string;
  maxY: string;
  units: string;
  withOgcAlias: boolean;
}

const EXTENT_FIELDS = ["minX", "minY", "maxX", "maxY"] as const;

function toFormValues(projection?: Projection | null): FormValues {
  const [minX, minY, maxX, maxY] = projection?.extent ?? [];
  return {
    code: projection?.code ?? "EPSG:",
    definition: projection?.definition ?? "",
    minX: minX?.toString() ?? "",
    minY: minY?.toString() ?? "",
    maxX: maxX?.toString() ?? "",
    maxY: maxY?.toString() ?? "",
    units: projection?.units ?? "",
    withOgcAlias: true,
  };
}

const isNumber = (value: string) =>
  value.trim() !== "" && Number.isFinite(Number(value));

export default function ProjectionFormDialog({
  open,
  onClose,
  projection,
  onCreated,
}: ProjectionFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(projection);
  const createProjection = useCreateProjection();
  const updateProjection = useUpdateProjection();
  const saving = createProjection.isPending || updateProjection.isPending;

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: toFormValues(projection) });

  useEffect(() => {
    if (open) reset(toFormValues(projection));
  }, [open, projection, reset]);

  const code = useWatch({ control, name: "code" }) ?? "";

  const onSubmit = handleSubmit(async (values) => {
    const extent = EXTENT_FIELDS.map((key) => Number(values[key])) as [
      number,
      number,
      number,
      number,
    ];
    const input = {
      definition: values.definition.trim(),
      extent,
      units: values.units.trim(),
    };
    try {
      if (projection) {
        await updateProjection.mutateAsync({ id: projection.id, input });
        toast.success(t("projections.updated", { code: projection.code }));
      } else {
        const created = await createProjection.mutateAsync({
          ...input,
          code: values.code.trim(),
          withOgcAlias: values.withOgcAlias && isEpsgCode(values.code.trim()),
        });
        toast.success(t("projections.created", { code: values.code.trim() }));
        onCreated?.(created.map((p) => p.code));
      }
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  });

  return (
    <DialogWrapper
      open={open}
      onClose={onClose}
      onSubmit={(e) => {
        // The dialog is portalled, but React still bubbles submit up the
        // component tree, e.g. into the map settings form it's opened from.
        e.stopPropagation();
        void onSubmit(e);
      }}
      formNoValidate
      fullWidth
      maxWidth="sm"
      title={
        isEdit
          ? t("projections.editTitle", { code: projection?.code })
          : t("projections.createTitle")
      }
      actions={
        <>
          <Button onClick={onClose}>{t("common.cancel")}</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {t("common.dialog.saveBtn")}
          </Button>
        </>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <TextField
          label={t("projections.code")}
          size="small"
          disabled={isEdit}
          error={Boolean(errors.code)}
          helperText={errors.code?.message ?? t("projections.codeHelp")}
          {...register("code", {
            validate: (v) =>
              v.trim() !== "" && v.trim() !== "EPSG:"
                ? true
                : t("projections.required"),
          })}
        />
        <TextField
          label={t("projections.definition")}
          size="small"
          multiline
          minRows={2}
          error={Boolean(errors.definition)}
          helperText={
            errors.definition?.message ?? t("projections.definitionHelp")
          }
          {...register("definition", {
            validate: (v) => v.trim() !== "" || t("projections.required"),
          })}
        />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
            gap: 1,
          }}
        >
          {EXTENT_FIELDS.map((key) => (
            <TextField
              key={key}
              label={t(`projections.${key}`)}
              size="small"
              slotProps={{ htmlInput: { inputMode: "decimal" } }}
              error={Boolean(errors[key])}
              helperText={errors[key]?.message}
              {...register(key, {
                validate: (v) => isNumber(v) || t("projections.number"),
              })}
            />
          ))}
        </Box>
        <TextField
          label={t("projections.units")}
          size="small"
          helperText={t("projections.unitsHelp")}
          {...register("units")}
        />
        {!isEdit && isEpsgCode(code.trim()) && (
          <Controller
            name="withOgcAlias"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                }
                label={t("projections.withOgcAlias", {
                  alias: `http://www.opengis.net/gml/srs/epsg.xml#${code
                    .trim()
                    .replace(/^EPSG:/i, "")}`,
                })}
              />
            )}
          />
        )}
      </Box>
    </DialogWrapper>
  );
}
