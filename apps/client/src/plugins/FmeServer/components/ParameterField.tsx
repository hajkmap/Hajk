import React from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  TextField,
  Typography,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { isPublishedParameterOptional } from "../api/publishedParameters";
import { getParameterUiKind } from "../api/parameterUi";
import type { ParameterUiKind } from "../api/parameterUi";
import type { ParameterFieldProps, PublishedParameter } from "../types";

type FieldProps = ParameterFieldProps;

function clampColorChannel(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)));
}

function colorChannelToHex(value: number): string {
  return clampColorChannel(value).toString(16).padStart(2, "0");
}

function normalizeColorComponentValueType(
  parameter: PublishedParameter
): string {
  return String(parameter.componentValueType ?? "")
    .trim()
    .toLowerCase();
}

function colorComponentScale(
  componentValueType: string,
  channels: number[]
): number {
  if (["float", "double", "decimal"].includes(componentValueType)) {
    return 255;
  }
  if (["percent", "percentage"].includes(componentValueType)) {
    return 2.55;
  }
  if (
    [
      "byte",
      "int",
      "integer",
      "uint8",
      "uint8_t",
      "uchar",
      "unsigned_byte",
    ].includes(componentValueType)
  ) {
    return 1;
  }
  return channels.every((channel) => channel >= 0 && channel <= 1) ? 255 : 1;
}

function fmeColorToHex(
  value: unknown,
  componentValueType: string
): string | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }
  if (/^#[0-9a-f]{6}$/i.test(value)) {
    return value;
  }

  const channels = value
    .split(",")
    .slice(0, 3)
    .map((channel) => Number(channel.trim()));
  if (
    channels.length !== 3 ||
    channels.some((channel) => Number.isNaN(channel))
  ) {
    return null;
  }

  const scale = colorComponentScale(componentValueType, channels);
  return `#${channels
    .map((channel) => colorChannelToHex(channel * scale))
    .join("")}`;
}

function hexToColorChannels(value: string): [number, number, number] | null {
  const hex = value.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(hex)) {
    return null;
  }
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
}

function hexToFmeColor(value: string, componentValueType: string): string {
  const channels = hexToColorChannels(value);
  if (!channels) {
    return "";
  }

  if (["hex", "html", "string"].includes(componentValueType)) {
    return value;
  }
  if (["percent", "percentage"].includes(componentValueType)) {
    return channels.map((channel) => (channel / 255) * 100).join(",");
  }
  if (
    [
      "byte",
      "int",
      "integer",
      "uint8",
      "uint8_t",
      "uchar",
      "unsigned_byte",
    ].includes(componentValueType)
  ) {
    return channels.join(",");
  }

  return channels.map((channel) => channel / 255).join(",");
}

function getFileAcceptValue(parameter: PublishedParameter): string | undefined {
  if (!Array.isArray(parameter.filters)) {
    return undefined;
  }

  const filters = parameter.filters.flatMap((filter) => {
    if (typeof filter === "string") {
      return [filter];
    }
    if (
      filter &&
      typeof filter === "object" &&
      Array.isArray((filter as { filter?: unknown }).filter)
    ) {
      return (filter as { filter: unknown[] }).filter;
    }
    return [];
  });

  const accept = filters
    .filter((filter): filter is string => typeof filter === "string")
    .map((filter) => filter.trim())
    .filter(Boolean)
    .map((filter) => filter.replace(/^\*/, ""))
    .map((filter) => (filter.startsWith(".") ? filter : `.${filter}`));

  return accept.length > 0 ? accept.join(",") : undefined;
}

function getSelectedListValues(parameter: PublishedParameter): string[] {
  const value = parameter.value ?? parameter.defaultValue;
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value.map(String) : [String(value)];
}

function ChoiceField({ parameter, index, onChange }: FieldProps) {
  return (
    <FormControl
      fullWidth
      size="small"
      required={!isPublishedParameterOptional(parameter)}
    >
      <InputLabel variant="outlined" id={`fme-choice-label-${index}`}>
        {parameter.description}
      </InputLabel>
      <Select
        labelId={`fme-choice-label-${index}`}
        id={`fme-choice-${index}`}
        variant="outlined"
        value={parameter.value ?? parameter.defaultValue ?? ""}
        label={parameter.description}
        onChange={(e) => onChange(e.target.value, index)}
      >
        {parameter.listOptions.map((option, optionIndex) => (
          <MenuItem key={optionIndex} value={option.value}>
            {option.caption}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function MultiselectField({ parameter, index, onChange }: FieldProps) {
  const selected = getSelectedListValues(parameter);

  const getOptionCaption = (value: string) =>
    parameter.listOptions.find((o) => o.value === value)?.caption ?? value;

  return (
    <FormControl
      fullWidth
      size="small"
      required={!isPublishedParameterOptional(parameter)}
      sx={{ m: 0 }}
    >
      <InputLabel variant="outlined" id={`fme-listbox-label-${index}`}>
        {parameter.description}
      </InputLabel>
      <Select
        labelId={`fme-listbox-label-${index}`}
        id={`fme-listbox-${index}`}
        multiple
        variant="outlined"
        label={parameter.description}
        value={selected}
        onChange={(e) => onChange(e.target.value as string[], index)}
        renderValue={(values) => (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {values.map((value) => (
              <Chip key={value} label={getOptionCaption(value)} size="small" />
            ))}
          </Box>
        )}
      >
        {parameter.listOptions.map((option, optionIndex) => (
          <MenuItem key={optionIndex} value={option.value}>
            {option.caption}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function TextInputField({
  parameter,
  index,
  onChange,
  fieldProps = {},
}: FieldProps & {
  fieldProps?: {
    type?: string;
    multiline?: boolean;
    minRows?: number;
    slotProps?: Record<string, unknown>;
  };
}) {
  const isPassword = getParameterUiKind(parameter) === "PASSWORD";

  return (
    <TextField
      id={`fme-field-${index}`}
      size="small"
      fullWidth
      required={!isPublishedParameterOptional(parameter)}
      label={parameter.description}
      type={isPassword ? "password" : fieldProps.type || "text"}
      multiline={fieldProps.multiline}
      minRows={fieldProps.minRows}
      value={parameter.value ?? parameter.defaultValue ?? ""}
      onChange={(e) => onChange(e.target.value, index)}
      slotProps={fieldProps.slotProps}
    />
  );
}

function BooleanField({ parameter, index, onChange }: FieldProps) {
  const checked = Boolean(parameter.value ?? parameter.defaultValue ?? false);

  return (
    <FormControlLabel
      sx={{ ml: 0 }}
      control={
        <Checkbox
          checked={checked}
          onChange={(e) => onChange(e.target.checked, index)}
        />
      }
      label={parameter.description}
    />
  );
}

function ColorField({ parameter, index, onChange }: FieldProps) {
  const componentValueType = normalizeColorComponentValueType(parameter);
  const selectedColor = fmeColorToHex(
    parameter.value ?? parameter.defaultValue,
    componentValueType
  );

  return (
    <Box>
      <Typography variant="caption" sx={{ display: "block" }} gutterBottom>
        {parameter.description}
        {!isPublishedParameterOptional(parameter) && " *"}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {selectedColor && (
          <Box
            aria-hidden="true"
            sx={{
              width: 24,
              height: 24,
              border: 1,
              borderColor: "divider",
              bgcolor: selectedColor,
            }}
          />
        )}
        <Button variant="outlined" size="small" component="label">
          {selectedColor ? "Ändra färg" : "Välj färg"}
          <Box
            component="input"
            type="color"
            value={selectedColor ?? "#ffffff"}
            onChange={(e) =>
              onChange(hexToFmeColor(e.target.value, componentValueType), index)
            }
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              opacity: 0,
              cursor: "pointer",
            }}
          />
        </Button>
        {selectedColor && (
          <Button
            size="small"
            color="inherit"
            startIcon={<ClearIcon />}
            onClick={() => onChange("", index)}
          >
            Ta bort
          </Button>
        )}
        {!selectedColor && (
          <Typography variant="body2" color="text.secondary">
            Ingen färg vald
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function RangeSliderField({ parameter, index, onChange, model }: FieldProps) {
  const { value, step } = model.getRangeSliderValueAndStep(parameter);
  const sliderMin = model.getRangeSliderMinimum(parameter, step);
  const sliderMax = model.getRangeSliderMaximum(parameter, step);

  return (
    <>
      <Typography variant="caption" sx={{ display: "block" }} gutterBottom>
        {parameter.description}
      </Typography>
      <Slider
        value={value}
        min={sliderMin}
        max={sliderMax}
        step={step}
        marks={[
          { value: sliderMin, label: sliderMin.toString() },
          { value: sliderMax, label: sliderMax.toString() },
        ]}
        valueLabelDisplay="auto"
        onChange={(_e, newValue) => onChange(newValue as number, index)}
      />
    </>
  );
}

function DisplayOnlyField({ parameter }: FieldProps) {
  return (
    <Typography variant="body2" color="text.secondary">
      {parameter.description || parameter.name}
    </Typography>
  );
}

function PathField({ parameter, index, onChange }: FieldProps) {
  return (
    <TextField
      id={`fme-path-${index}`}
      size="small"
      fullWidth
      required={!isPublishedParameterOptional(parameter)}
      label={parameter.description}
      value={parameter.value ?? parameter.defaultValue ?? ""}
      onChange={(e) => onChange(e.target.value, index)}
      placeholder="Ange sökväg"
    />
  );
}

function FileField({
  parameter,
  index,
  onChange,
  uploadParameterFile,
}: FieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState(false);

  const uploadedPath =
    typeof parameter.value === "string" ? parameter.value : "";
  const hasSelectedFile = Boolean(selectedFileName || uploadedPath);

  const handleClearFile = () => {
    setSelectedFileName("");
    setUploadError(false);
    onChange("", index);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setSelectedFileName(file.name);
    setUploadError(false);
    setUploading(true);

    const result = await uploadParameterFile(file);
    setUploading(false);

    if (result.error || !result.path) {
      setUploadError(true);
      return;
    }

    onChange(result.path, index);
  };

  return (
    <Box>
      <Typography variant="caption" sx={{ display: "block" }} gutterBottom>
        {parameter.description}
        {!isPublishedParameterOptional(parameter) && " *"}
      </Typography>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={getFileAcceptValue(parameter)}
        onChange={handleFileSelected}
      />
      <Button
        variant="outlined"
        size="small"
        startIcon={
          uploading ? <CircularProgress size={16} /> : <UploadFileIcon />
        }
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? "Laddar upp..." : "Välj fil"}
      </Button>
      {hasSelectedFile && !uploading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
          <Typography variant="body2" sx={{ flex: 1 }}>
            {selectedFileName || uploadedPath}
          </Typography>
          <Button
            size="small"
            color="inherit"
            startIcon={<ClearIcon />}
            onClick={handleClearFile}
            aria-label="Ta bort vald fil"
          >
            Ta bort
          </Button>
        </Box>
      )}
      {uploadError && (
        <Typography variant="caption" color="error" sx={{ display: "block" }}>
          Filen kunde inte laddas upp. Försök igen.
        </Typography>
      )}
    </Box>
  );
}

const SHRINK_LABEL = { slotProps: { inputLabel: { shrink: true } } };

const TEXT_FIELD_PROPS_BY_KIND: Partial<
  Record<
    ParameterUiKind,
    {
      type?: string;
      multiline?: boolean;
      minRows?: number;
      slotProps?: Record<string, unknown>;
    }
  >
> = {
  NUMBER: { type: "number" },
  TEXTAREA: { multiline: true, minRows: 3 },
  DATE: { type: "date", ...SHRINK_LABEL },
  TIME: { type: "time", ...SHRINK_LABEL },
  DATETIME: { type: "datetime-local", ...SHRINK_LABEL },
};

const ParameterField = (props: FieldProps) => {
  const kind = getParameterUiKind(props.parameter);

  const renderField = () => {
    switch (kind) {
      case "DISPLAY_ONLY":
        return <DisplayOnlyField {...props} />;
      case "FILE":
        return <FileField {...props} />;
      case "PATH":
        return <PathField {...props} />;
      case "CHOICE":
        return <ChoiceField {...props} />;
      case "MULTISELECT":
        return <MultiselectField {...props} />;
      case "SLIDER":
        return <RangeSliderField {...props} />;
      case "BOOLEAN":
        return <BooleanField {...props} />;
      case "COLOR":
        return <ColorField {...props} />;
      default:
        return (
          <TextInputField
            {...props}
            fieldProps={TEXT_FIELD_PROPS_BY_KIND[kind] ?? {}}
          />
        );
    }
  };

  return <Grid size={12}>{renderField()}</Grid>;
};

export default ParameterField;
