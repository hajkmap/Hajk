import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Button,
  Box,
  Grid,
  TextField,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  useTheme,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { isAxiosError } from "axios";
import { toast } from "react-toastify";
import type { Map as MapRecord } from "../../../api/maps/types";
import type { MapCreateInput } from "../../../api/maps/map-create-types";
import { useCreateMap } from "../../../api/maps";
import { useProjections } from "../../../api/services/hooks";
import useAppStateStore from "../../../store/use-app-state-store";
import { getDefaultMapProjectionCode } from "../../../lib/map-defaults";
import DialogWrapper from "../../../components/flexible-dialog";
import type { ApiValidationDetail } from "../../../lib/internal-api-client";

interface CreateMapFormValues {
  name: string;
  locked: boolean;
  options: {
    title: string;
    description: string;
    projection: string;
    zoom: string;
    minZoom: string;
    maxZoom: string;
    center: string;
    origin: string;
    extent: string;
    resolutions: string;
    extraPrintResolutions: string;
    constrainResolution: boolean;
    constrainOnlyCenter: boolean;
    constrainResolutionMobile: boolean;
  };
}

interface MapCreateErrorBody {
  errorId?: string;
  error?: string;
  details?: ApiValidationDetail[];
}

function getCreateMapErrorMessage(error: unknown, t: TFunction): string {
  if (!isAxiosError<MapCreateErrorBody>(error) || !error.response) {
    return t("maps.createMapFailed");
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

  return t("maps.createMapFailed");
}

function buildDefaultValues(): CreateMapFormValues {
  return {
    name: "",
    locked: false,
    options: {
      title: "",
      description: "",
      projection: getDefaultMapProjectionCode(),
      zoom: "1.33",
      minZoom: "0",
      maxZoom: "8",
      center: "576357, 6386049",
      origin: "0,0",
      extent: "-1200000, 4700000, 2600000, 8500000",
      resolutions: "2048, 1024, 512, 256, 128, 64, 32, 16, 8",
      extraPrintResolutions: "",
      constrainResolution: false,
      constrainOnlyCenter: false,
      constrainResolutionMobile: false,
    },
  };
}

interface CreateMapDialogProps {
  open: boolean;
  onClose: () => void;
  baseRoute: string;
  existingMaps: MapRecord[];
}

export default function CreateMapDialog({
  open,
  onClose,
  baseRoute,
  existingMaps,
}: CreateMapDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { palette } = useTheme();
  const { mutateAsync: createMap, isPending } = useCreateMap();
  const { data: projections } = useProjections();
  const { defaultCoordinates } = useAppStateStore.getState();

  const [activeStep, setActiveStep] = useState(0);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    reset,
    formState: { errors },
  } = useForm<CreateMapFormValues>({
    defaultValues: buildDefaultValues(),
    mode: "onChange",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (open) {
      reset(buildDefaultValues());
    }
  }, [open, reset]);

  const handleClose = () => {
    setActiveStep(0);
    onClose();
  };

  const isDuplicateMapName = (value: string) => {
    const normalizedName = value.trim().toLowerCase();
    if (!normalizedName || !existingMaps.length) return false;
    return existingMaps.some(
      (map) => map.name.toLowerCase() === normalizedName,
    );
  };

  const projectionCodes = useMemo(() => {
    const fromProjections = (projections ?? [])
      .filter((projection) => projection.code.startsWith("EPSG:"))
      .map((projection) => projection.code);
    const base = defaultCoordinates.length ? defaultCoordinates : fromProjections;
    const merged = new Set<string>(base);
    const current = getDefaultMapProjectionCode();
    if (current) merged.add(current);
    return Array.from(merged);
  }, [projections, defaultCoordinates]);

  const steps = [
    t("maps.dialog.stepBasicInfo"),
    t("maps.dialog.stepBaseSettings"),
  ];
  const isLastStep = activeStep === steps.length - 1;

  const handleNext = async () => {
    const valid = await trigger(["name"]);
    if (valid) setActiveStep((step) => step + 1);
  };

  const handleBack = () => setActiveStep((step) => Math.max(0, step - 1));

  const handleCreate = handleSubmit(async (data) => {
    try {
      const payload: MapCreateInput = {
        name: data.name.trim(),
        locked: data.locked,
        options: { ...data.options },
      };
      const response = await createMap(payload);
      if (response.id == null) {
        toast.error(t("maps.createMapFailed"), {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        });
        return;
      }
      toast.success(t("maps.createMapSuccess", { name: data.name.trim() }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
      void navigate(`${baseRoute}/${response.id}`);
      handleClose();
    } catch (error) {
      console.error("Failed to submit map:", error);
      toast.error(getCreateMapErrorMessage(error, t), {
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
      title={t("maps.dialog.title")}
      onClose={handleClose}
      actions={
        <>
          <Button
            type="button"
            variant="text"
            color="primary"
            onClick={handleClose}
          >
            {t("common.dialog.closeBtn")}
          </Button>
          {activeStep > 0 && (
            <Button type="button" variant="text" color="primary" onClick={handleBack}>
              {t("common.back")}
            </Button>
          )}
          {!isLastStep ? (
            <Button
              type="button"
              variant="contained"
              color="primary"
              onClick={() => void handleNext()}
            >
              {t("common.next")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="contained"
              color="primary"
              disabled={isPending}
              onClick={() => void handleCreate()}
            >
              {t("common.dialog.saveBtn")}
            </Button>
          )}
        </>
      }
    >
      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {activeStep === 0 && (
        <Grid container spacing={2}>
          <Grid size={12}>
            <TextField
              label={t("map.name")}
              fullWidth
              {...register("name", {
                validate: (value) => {
                  const trimmed = value.trim();
                  if (!trimmed) return `${t("common.required")}`;
                  if (isDuplicateMapName(value)) return t("maps.createMapConflict");
                  return true;
                },
              })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              label={t("map.title")}
              fullWidth
              {...register("options.title")}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              label={t("map.description")}
              fullWidth
              multiline
              rows={3}
              {...register("options.description")}
            />
          </Grid>
        </Grid>
      )}

      {activeStep === 1 && (
        <Grid container spacing={2}>
          <Grid size={12}>
            <Typography variant="body2" color="text.secondary">
              {t("maps.dialog.baseSettingsHelp")}
            </Typography>
          </Grid>
          <Grid size={12}>
            <FormControl fullWidth>
              <InputLabel id="create-map-projection-label">
                {t("map.projection")}
              </InputLabel>
              <Controller
                name="options.projection"
                control={control}
                render={({ field }) => (
                  <Select
                    labelId="create-map-projection-label"
                    label={t("map.projection")}
                    {...field}
                    value={field.value ?? ""}
                  >
                    {projectionCodes.map((code) => (
                      <MenuItem key={code} value={code}>
                        {code}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
          </Grid>
          <Grid size={6}>
            <TextField
              label={t("map.startZoom")}
              fullWidth
              slotProps={{ htmlInput: { inputMode: "decimal" } }}
              {...register("options.zoom")}
            />
          </Grid>
          <Grid size={6}>
            <TextField
              label={t("map.centerCoordinate")}
              fullWidth
              {...register("options.center")}
            />
          </Grid>
          <Grid size={6}>
            <TextField
              label={t("map.minZoom")}
              fullWidth
              type="number"
              {...register("options.minZoom")}
            />
          </Grid>
          <Grid size={6}>
            <TextField
              label={t("map.maxZoom")}
              fullWidth
              type="number"
              {...register("options.maxZoom")}
            />
          </Grid>
          <Grid size={6}>
            <TextField
              label={t("map.origin")}
              fullWidth
              {...register("options.origin")}
            />
          </Grid>
          <Grid size={6}>
            <TextField
              label={t("map.extent")}
              fullWidth
              {...register("options.extent")}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              label={t("map.resolutions")}
              fullWidth
              {...register("options.resolutions")}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              label={t("map.printResolutions")}
              fullWidth
              {...register("options.extraPrintResolutions")}
            />
          </Grid>
          <Grid size={12}>
            <Box>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Controller
                      name="options.constrainResolution"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          checked={Boolean(field.value)}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      )}
                    />
                  }
                  label={t("map.constrainResolution")}
                />
                <FormControlLabel
                  control={
                    <Controller
                      name="options.constrainOnlyCenter"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          checked={Boolean(field.value)}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      )}
                    />
                  }
                  label={t("map.constrainOnlyCenter")}
                />
                <FormControlLabel
                  control={
                    <Controller
                      name="options.constrainResolutionMobile"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          checked={Boolean(field.value)}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      )}
                    />
                  }
                  label={t("map.constrainResolutionMobile")}
                />
              </FormGroup>
            </Box>
          </Grid>
        </Grid>
      )}
    </DialogWrapper>
  );
}
