import { useEffect } from "react";
import {
  Button,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { isAxiosError } from "axios";
import { toast } from "react-toastify";
import { useTheme } from "@mui/material/styles";
import type { Map as MapRecord } from "../../../api/maps/types";
import { useDuplicateMap } from "../../../api/maps";
import DialogWrapper from "../../../components/flexible-dialog";
import type { ApiValidationDetail } from "../../../lib/internal-api-client";

interface DuplicateMapFormValues {
  name: string;
  includeLayers: boolean;
  includeGroups: boolean;
  includeTools: boolean;
}

interface MapDuplicateErrorBody {
  errorId?: string;
  error?: string;
  details?: ApiValidationDetail[];
}

const DEFAULT_DUPLICATE_OPTIONS = {
  includeLayers: true,
  includeGroups: true,
  includeTools: true,
};

function getDuplicateMapErrorMessage(error: unknown, t: TFunction): string {
  if (!isAxiosError<MapDuplicateErrorBody>(error) || !error.response) {
    return t("maps.duplicateMapFailed");
  }

  const status = error.response.status;
  const data = error.response.data;

  if (status === 409) {
    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error.trim();
    }
    return t("maps.createMapConflict");
  }

  if (status === 400 && Array.isArray(data?.details)) {
    const messages = data.details.map((d) => d.message).filter(Boolean);
    if (messages.length > 0) {
      return messages.join(" · ");
    }
  }

  if (typeof data?.error === "string" && data.error.trim()) {
    return data.error.trim();
  }

  return t("maps.duplicateMapFailed");
}

function buildSuggestedName(sourceMapName: string, existingMaps: MapRecord[]) {
  const baseName = `${sourceMapName} (copy)`;
  const existingNames = new Set(
    existingMaps.map((map) => map.name.trim().toLowerCase()),
  );

  if (!existingNames.has(baseName.toLowerCase())) {
    return baseName;
  }

  let suffix = 2;
  while (existingNames.has(`${sourceMapName} (copy ${suffix})`.toLowerCase())) {
    suffix += 1;
  }

  return `${sourceMapName} (copy ${suffix})`;
}

function buildDefaultValues(
  sourceMap: MapRecord | null,
  existingMaps: MapRecord[],
): DuplicateMapFormValues {
  return {
    name: sourceMap ? buildSuggestedName(sourceMap.name, existingMaps) : "",
    ...DEFAULT_DUPLICATE_OPTIONS,
  };
}

interface DuplicateMapDialogProps {
  open: boolean;
  sourceMap: MapRecord | null;
  existingMaps: MapRecord[];
  onClose: () => void;
  onDuplicated?: (map: MapRecord) => void;
}

export default function DuplicateMapDialog({
  open,
  sourceMap,
  existingMaps,
  onClose,
  onDuplicated,
}: DuplicateMapDialogProps) {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const { mutateAsync: duplicateMap, isPending } = useDuplicateMap();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DuplicateMapFormValues>({
    defaultValues: buildDefaultValues(null, existingMaps),
    mode: "onChange",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (open) {
      reset(buildDefaultValues(sourceMap, existingMaps));
    }
  }, [open, sourceMap, existingMaps, reset]);

  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  const isDuplicateMapName = (value: string) => {
    const normalizedName = value.trim().toLowerCase();
    if (!normalizedName) return false;
    return existingMaps.some(
      (map) => map.name.toLowerCase() === normalizedName,
    );
  };

  const handleDuplicate = handleSubmit(async (data) => {
    if (!sourceMap) return;

    try {
      const response = await duplicateMap({
        sourceMapName: sourceMap.name,
        name: data.name.trim(),
        includeLayers: data.includeLayers,
        includeGroups: data.includeGroups,
        includeTools: data.includeTools,
      });
      toast.success(t("maps.duplicateMapSuccess", { name: data.name.trim() }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
      onDuplicated?.(response);
      onClose();
    } catch (error) {
      console.error("Failed to duplicate map:", error);
      toast.error(getDuplicateMapErrorMessage(error, t), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    }
  });

  return (
    <DialogWrapper
      fullWidth
      maxWidth="sm"
      open={open}
      title={t("maps.duplicate.dialog.title")}
      onClose={handleClose}
      actions={
        <>
          <Button
            type="button"
            variant="text"
            color="primary"
            onClick={handleClose}
            disabled={isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="contained"
            color="primary"
            disabled={isPending || !sourceMap}
            onClick={() => void handleDuplicate()}
          >
            {t("common.duplicate")}
          </Button>
        </>
      }
    >
      <TextField
        sx={{ mt: 1 }}
        label={t("map.name")}
        fullWidth
        autoFocus
        disabled={isPending}
        {...register("name", {
          validate: (value) => {
            const trimmed = value.trim();
            if (!trimmed) return `${t("common.required")}`;
            if (isDuplicateMapName(value)) return t("maps.createMapConflict");
            return true;
          },
        })}
        error={!!errors.name}
        helperText={
          errors.name?.message ??
          (sourceMap
            ? t("maps.duplicate.dialog.sourceMap", { name: sourceMap.name })
            : undefined)
        }
      />

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t("maps.duplicate.includeRelations")}
        </Typography>
        <FormGroup>
          <Controller
            name="includeLayers"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                    disabled={isPending}
                  />
                }
                label={t("maps.duplicate.includeLayers")}
              />
            )}
          />
          <Controller
            name="includeGroups"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                    disabled={isPending}
                  />
                }
                label={t("maps.duplicate.includeGroups")}
              />
            )}
          />
          <Controller
            name="includeTools"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                    disabled={isPending}
                  />
                }
                label={t("maps.duplicate.includeTools")}
              />
            )}
          />
        </FormGroup>
      </Box>
    </DialogWrapper>
  );
}
