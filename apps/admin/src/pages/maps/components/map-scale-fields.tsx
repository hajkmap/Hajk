import { useId, useState, type ReactNode } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import {
  Control,
  FieldValues,
  UseFormSetValue,
  useWatch,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import FormFieldGrid, {
  FormFieldRow,
} from "../../../components/form-components/form-field-grid";
import {
  FieldLabelAbove,
  InlineLabelWithHelp,
} from "../../../components/form-components/field-label-with-help";
import { SettingsSearchField } from "../../../components/form-components/searchable-field";
import {
  SCALE_FIELD_NAMES,
  applyScaleChange,
  changeScaleRow,
  removeScaleRow,
  scaleRowBounds,
  scaleRowOptions,
  toScaleValues,
  validateScales,
  type ScaleBounds,
  type ScaleError,
  type ScaleValues,
} from "../map-scales";

const ERROR_KEYS: Record<ScaleError, string> = {
  noScales: "map.scaleErrorNoScales",
  invalidScale: "map.scaleErrorInvalidScale",
  invalidPrintScale: "map.scaleErrorInvalidPrintScale",
  invalidZoomScale: "map.scaleErrorInvalidZoomScale",
  zoomOrder: "map.scaleErrorZoomOrder",
  maxIsCoarsest: "map.scaleErrorMaxIsCoarsest",
  printNotFiner: "map.scaleErrorPrintNotFiner",
};

interface ScaleComboFieldProps {
  id?: string;
  ariaLabel?: string;
  value: string;
  options: string[];
  onCommit: (text: string) => void;
}

// Typed text stays local until it's committed: rows re-sort on commit and
// would move while typing, and `1:50` on the way to `1:5000` is a wrong value.
function ScaleComboField({
  id,
  ariaLabel,
  value,
  options,
  onCommit,
}: ScaleComboFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = (text: string) => {
    setDraft(null);
    if (text.trim() !== value.trim()) onCommit(text.trim());
  };

  return (
    <Autocomplete<string, false, true, true>
      id={id}
      freeSolo
      disableClearable
      size="small"
      options={options}
      value={value}
      inputValue={draft ?? value}
      onChange={(_, selected) => commit(selected)}
      onInputChange={(_, typed, reason) => {
        if (reason === "input") setDraft(typed);
      }}
      onBlur={() => {
        if (draft !== null) commit(draft);
      }}
      onKeyDown={(event) => {
        // The form saves on submit.
        if (event.key === "Enter") event.preventDefault();
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          slotProps={{
            ...params.slotProps,
            htmlInput: {
              ...params.slotProps.htmlInput,
              "aria-label": ariaLabel,
            },
          }}
        />
      )}
    />
  );
}

interface ScaleZoomFieldProps {
  labelKey: string;
  helpKey: string;
  value: string;
  options: string[];
  onCommit: (text: string) => void;
}

function ScaleZoomField({
  labelKey,
  helpKey,
  value,
  options,
  onCommit,
}: ScaleZoomFieldProps) {
  const { t } = useTranslation();
  const id = useId();

  return (
    <Box>
      <FieldLabelAbove
        htmlFor={id}
        label={String(t(labelKey as never))}
        help={String(t(helpKey as never))}
      />
      <ScaleComboField
        id={id}
        value={value}
        options={options}
        onCommit={onCommit}
      />
    </Box>
  );
}

interface ScaleRowListProps {
  labelKey: string;
  helpKey: string;
  rows: string[];
  bounds: ScaleBounds;
  /** Filled rows that can't be removed. */
  minRows: number;
  onChangeRow: (index: number, text: string) => void;
  onRemoveRow: (index: number) => void;
  onAddRow: () => void;
}

function ScaleRowList({
  labelKey,
  helpKey,
  rows,
  bounds,
  minRows,
  onChangeRow,
  onRemoveRow,
  onAddRow,
}: ScaleRowListProps) {
  const { t } = useTranslation();
  const filledCount = rows.filter((row) => row.trim() !== "").length;
  const removeLabel = t("map.removeScale");

  return (
    <Stack spacing={1}>
      <InlineLabelWithHelp
        label={String(t(labelKey as never))}
        help={String(t(helpKey as never))}
      />
      <Stack spacing={1}>
        {rows.map((row, index) => (
          <Box key={index} sx={{ display: "flex", alignItems: "center" }}>
            <Box sx={{ flex: "0 1 50%", minWidth: 0 }}>
              <ScaleComboField
                ariaLabel={String(t(labelKey as never))}
                value={row}
                options={scaleRowOptions(rows, index, bounds)}
                onCommit={(text) => onChangeRow(index, text)}
              />
            </Box>
            <Tooltip title={removeLabel}>
              <span>
                <IconButton
                  size="small"
                  aria-label={removeLabel}
                  disabled={row.trim() !== "" && filledCount <= minRows}
                  onClick={() => onRemoveRow(index)}
                >
                  <DeleteOutlinedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        ))}
      </Stack>
      <Box>
        <Button size="small" startIcon={<AddIcon />} onClick={onAddRow}>
          {t("map.addScale")}
        </Button>
      </Box>
    </Stack>
  );
}

interface MapScaleFieldsProps {
  control: Control<FieldValues>;
  getValues: () => FieldValues;
  setValue: UseFormSetValue<FieldValues>;
  settingsSearchTerm: string;
  searchValues: FieldValues | undefined;
  /** The read-only resolution fields, shown below the scales. */
  children: ReactNode;
}

/** Scale rows and Start, Min and Max for projections that use scales. */
export default function MapScaleFields({
  control,
  getValues,
  setValue,
  settingsSearchTerm,
  searchValues,
  children,
}: MapScaleFieldsProps) {
  const { t } = useTranslation();
  const watched = useWatch({ control, name: SCALE_FIELD_NAMES }) as unknown[];
  const values = toScaleValues(watched);
  const errors = validateScales(values);
  const rowOptions = values.scales.filter((row) => row.trim() !== "");
  const bounds = scaleRowBounds(values);

  const writeOptions = (entries: object) => {
    for (const [key, value] of Object.entries(entries)) {
      setValue(`options.${key}`, value, { shouldDirty: true });
    }
  };

  const commit = (next: ScaleValues) => {
    const { resolutions, extraPrintResolutions } = getValues().options as {
      resolutions?: unknown;
      extraPrintResolutions?: unknown;
    };
    const result = applyScaleChange(next, {
      resolutions,
      extraPrintResolutions,
    });
    writeOptions(result.values);
    if (result.options) writeOptions(result.options);
  };

  const zoomFields = [
    {
      key: "startScale",
      labelKey: "map.startZoom",
      helpKey: "map.startScaleHelp",
      synonyms: ["zoom", "start", "scale", "skala"],
    },
    {
      key: "maxScale",
      labelKey: "map.maxZoom",
      helpKey: "map.maxScaleHelp",
      synonyms: ["zoom", "max", "scale", "skala"],
    },
    {
      key: "minScale",
      labelKey: "map.minZoom",
      helpKey: "map.minScaleHelp",
      synonyms: ["zoom", "min", "scale", "skala"],
    },
  ] as const;

  return (
    <FormFieldGrid columns={4}>
      {zoomFields.map(({ key, labelKey, helpKey, synonyms }) => (
        <SettingsSearchField
          key={key}
          labelKeys={[labelKey]}
          fields={[`options.${key}`]}
          synonyms={[...synonyms]}
          searchTerm={settingsSearchTerm}
          allValues={searchValues}
        >
          <FormFieldRow>
            <ScaleZoomField
              labelKey={labelKey}
              helpKey={helpKey}
              value={values[key]}
              options={rowOptions}
              onCommit={(text) => commit({ ...values, [key]: text })}
            />
          </FormFieldRow>
        </SettingsSearchField>
      ))}
      <SettingsSearchField
        labelKeys={["map.scales"]}
        fields={["options.scales"]}
        synonyms={["scale", "skala"]}
        searchTerm={settingsSearchTerm}
        allValues={searchValues}
      >
        <FormFieldRow span={2} newRow>
          <ScaleRowList
            labelKey="map.scales"
            helpKey="map.scalesHelp"
            rows={values.scales}
            bounds={bounds.scales}
            minRows={1}
            onChangeRow={(index, text) =>
              commit(changeScaleRow(values, index, text))
            }
            onRemoveRow={(index) => commit(removeScaleRow(values, index))}
            onAddRow={() =>
              setValue("options.scales", [...values.scales, ""], {
                shouldDirty: true,
              })
            }
          />
        </FormFieldRow>
      </SettingsSearchField>
      <SettingsSearchField
        labelKeys={["map.printScales"]}
        fields={["options.printScales"]}
        synonyms={["print", "scale", "skala"]}
        searchTerm={settingsSearchTerm}
        allValues={searchValues}
      >
        <FormFieldRow span={2}>
          <ScaleRowList
            labelKey="map.printScales"
            helpKey="map.printScalesHelp"
            rows={values.printScales}
            bounds={bounds.printScales}
            minRows={0}
            onChangeRow={(index, text) =>
              commit({
                ...values,
                printScales: values.printScales.map((row, i) =>
                  i === index ? text : row,
                ),
              })
            }
            onRemoveRow={(index) =>
              commit({
                ...values,
                printScales: values.printScales.filter((_, i) => i !== index),
              })
            }
            onAddRow={() =>
              setValue("options.printScales", [...values.printScales, ""], {
                shouldDirty: true,
              })
            }
          />
        </FormFieldRow>
      </SettingsSearchField>
      {errors.length > 0 && (
        <FormFieldRow fullWidth>
          <Alert severity="warning">
            {errors.map((error) => (
              <Box key={error}>{String(t(ERROR_KEYS[error] as never))}</Box>
            ))}
          </Alert>
        </FormFieldRow>
      )}
      {children}
    </FormFieldGrid>
  );
}
