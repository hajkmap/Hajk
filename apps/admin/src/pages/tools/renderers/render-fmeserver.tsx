import { useId, useState } from "react";
import {
  TextField,
  Checkbox,
  FormControlLabel,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Stack,
  Box,
  Typography,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import {
  Control,
  Controller,
  FieldValues,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import FormPanel from "../../../components/form-components/form-panel";
import FormFieldGrid, {
  FormFieldRow,
} from "../../../components/form-components/form-field-grid";
import { useTranslation } from "react-i18next";
import { Tool } from "../../../api/tools";
import {
  useFmeServerConnection,
  useFmeSuggestions,
} from "../../../api/fme-server";
import {
  FmeConnectionStatus,
  FmeProductHealthIcon,
} from "../components/fmeserver/fme-health";
import {
  FmeProductSourceFields,
  FmeSuggestField,
} from "../components/fmeserver/fme-product-fields";

// Used as the isDirty baseline in settings.tsx. drawFillColor/drawStrokeColor
// are plain CSS rgba() strings (MapViewModel.js), not {r,g,b,a} objects like
// print/infoclick use. title/description are hardcoded in FmeServer.jsx's
// `custom` prop, so — like streetview — they're not exposed here.
export const fmeserverDefaults: Record<string, unknown> = {
  visibleAtStart: false,
  instruction: "",
  visibleForGroups: [],
  drawFillColor: "rgba(255,255,255,0.07)",
  drawStrokeColor: "rgba(74,74,74,0.5)",
  groupDisplayName: "Grupp",
  productGroups: [],
  products: [],
};

interface FmeServerRendererProps {
  tool: Tool;
  control?: Control<FieldValues>;
}

interface NewProduct {
  group: string;
  name: string;
  repository: string;
  workspace: string;
  geoAttribute: string;
  infoUrl: string;
  maxArea: string;
  promptForEmail: boolean;
}

const EMPTY_NEW: NewProduct = {
  group: "",
  name: "",
  repository: "",
  workspace: "",
  geoAttribute: "",
  infoUrl: "",
  maxArea: "",
  promptForEmail: false,
};

interface GroupSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  groups: string[];
  missingText: string;
  emptyText: string;
}

// The client only shows products whose group is in productGroups, so a free
// text field here would let a typo hide a product silently. Legacy used a
// select + warning for the same reason.
function GroupSelect({
  label,
  value,
  onChange,
  groups,
  missingText,
  emptyText,
}: GroupSelectProps) {
  const labelId = useId();
  const missing = value !== "" && !groups.includes(value);
  const empty = groups.length === 0;
  // Keep a saved-but-unlisted group visible instead of blanking it out.
  const items = missing ? [...groups, value] : groups;

  return (
    <FormControl sx={{ flex: 1 }} error={missing} disabled={empty && !missing}>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        labelId={labelId}
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {items.map((g) => (
          <MenuItem key={g} value={g}>
            {g}
          </MenuItem>
        ))}
      </Select>
      {(missing || empty) && (
        <FormHelperText>{missing ? missingText : emptyText}</FormHelperText>
      )}
    </FormControl>
  );
}

export default function FmeServerRenderer({
  tool,
  control: parentControl,
}: FmeServerRendererProps) {
  const { t } = useTranslation();

  const { control: localControl } = useForm<FieldValues>({
    defaultValues: {
      type: tool?.type ?? "fmeserver",
      options: { ...fmeserverDefaults, ...tool?.options },
    },
  });

  // Use the parent form's control when provided (keeps these fields in the
  // page's single save flow); otherwise fall back to a local, standalone form.
  const control = parentControl ?? localControl;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options.products",
  });

  // Live value of the comma list above, so the group selects follow edits
  // without a save in between.
  const watchedGroups: unknown = useWatch({
    control,
    name: "options.productGroups",
  });
  const groupOptions = Array.isArray(watchedGroups)
    ? (watchedGroups as string[]).filter(Boolean)
    : [];

  const [newP, setNewP] = useState<NewProduct>(EMPTY_NEW);

  const addProduct = () => {
    if (!newP.group.trim() || !newP.name.trim()) return;
    append({
      group: newP.group.trim(),
      name: newP.name.trim(),
      repository: newP.repository.trim(),
      workspace: newP.workspace.trim(),
      geoAttribute: newP.geoAttribute.trim(),
      infoUrl: newP.infoUrl.trim(),
      maxArea: newP.maxArea === "" ? -1 : Number(newP.maxArea),
      promptForEmail: newP.promptForEmail,
    });
    setNewP(EMPTY_NEW);
  };

  // Fetched once here and passed down — a hook per product row would refetch
  // every time a row is added. Its repository names feed the suggestions.
  const { data: fmeConnection } = useFmeServerConnection();
  const fmeConnected = fmeConnection?.status === "ok";
  const fmeRepositories = fmeConnection?.repositories ?? [];
  const newSuggestions = useFmeSuggestions(
    fmeRepositories,
    newP.repository,
    newP.workspace,
  );

  return (
    <>
      <FormPanel title={t("common.information")}>
        <FormFieldGrid>
          <FormFieldRow>
            <Controller
              name="options.visibleAtStart"
              control={control}
              defaultValue={Boolean(tool?.options?.visibleAtStart)}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t("tools.visibleAtStart")}
                />
              )}
            />
          </FormFieldRow>

          <FormFieldRow>
            <Controller
              name="options.instruction"
              control={control}
              defaultValue={tool?.options?.instruction ?? ""}
              render={({ field }) => (
                <TextField
                  label={t("tools.instruction")}
                  fullWidth
                  multiline
                  rows={4}
                  value={
                    typeof field.value === "string" && field.value
                      ? atob(field.value)
                      : ""
                  }
                  onChange={(e) => field.onChange(btoa(e.target.value))}
                />
              )}
            />
          </FormFieldRow>

          <FormFieldRow>
            <Controller
              name="options.visibleForGroups"
              control={control}
              defaultValue={
                Array.isArray(tool?.options?.visibleForGroups)
                  ? (tool.options.visibleForGroups as string[]).join(",")
                  : ""
              }
              render={({ field }) => (
                <TextField
                  label={t("tools.visibleForGroups")}
                  fullWidth
                  value={
                    Array.isArray(field.value)
                      ? (field.value as string[]).join(",")
                      : ((field.value as string) ?? "")
                  }
                  onChange={(e) =>
                    field.onChange(
                      e.target.value
                        ? e.target.value.split(",").map((s) => s.trim())
                        : [],
                    )
                  }
                />
              )}
            />
          </FormFieldRow>

          <FormFieldRow>
            <Controller
              name="options.groupDisplayName"
              control={control}
              defaultValue={
                tool?.options?.groupDisplayName ??
                fmeserverDefaults.groupDisplayName
              }
              render={({ field }) => (
                <TextField
                  label={t("tools.fmeserver.groupDisplayName")}
                  fullWidth
                  {...field}
                />
              )}
            />
          </FormFieldRow>

          <FormFieldRow>
            <Controller
              name="options.productGroups"
              control={control}
              defaultValue={
                Array.isArray(tool?.options?.productGroups)
                  ? (tool.options.productGroups as string[]).join(",")
                  : ""
              }
              render={({ field }) => (
                <TextField
                  label={t("tools.fmeserver.productGroups")}
                  fullWidth
                  value={
                    Array.isArray(field.value)
                      ? (field.value as string[]).join(",")
                      : ((field.value as string) ?? "")
                  }
                  onChange={(e) =>
                    field.onChange(
                      e.target.value
                        ? e.target.value.split(",").map((s) => s.trim())
                        : [],
                    )
                  }
                />
              )}
            />
          </FormFieldRow>

          <FormFieldRow>
            <Stack direction="row" spacing={2}>
              <Controller
                name="options.drawFillColor"
                control={control}
                defaultValue={
                  tool?.options?.drawFillColor ??
                  fmeserverDefaults.drawFillColor
                }
                render={({ field }) => (
                  <TextField
                    label={t("tools.fmeserver.drawFillColor")}
                    sx={{ flex: 1 }}
                    {...field}
                  />
                )}
              />
              <Controller
                name="options.drawStrokeColor"
                control={control}
                defaultValue={
                  tool?.options?.drawStrokeColor ??
                  fmeserverDefaults.drawStrokeColor
                }
                render={({ field }) => (
                  <TextField
                    label={t("tools.fmeserver.drawStrokeColor")}
                    sx={{ flex: 1 }}
                    {...field}
                  />
                )}
              />
            </Stack>
          </FormFieldRow>
        </FormFieldGrid>
      </FormPanel>

      <FormPanel title={t("tools.fmeserver.productsList")}>
        <FormFieldGrid>
          <FmeConnectionStatus />
          {fields.map((item, index) => (
            <Box
              key={item.id}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                p: 2,
              }}
            >
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <Controller
                  name={`options.products.${index}.group`}
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <GroupSelect
                      label={t("tools.fmeserver.productGroup")}
                      value={typeof field.value === "string" ? field.value : ""}
                      onChange={field.onChange}
                      groups={groupOptions}
                      missingText={t("tools.fmeserver.productGroupMissing")}
                      emptyText={t("tools.fmeserver.addProductGroupsFirst")}
                    />
                  )}
                />
                <Controller
                  name={`options.products.${index}.name`}
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      label={t("tools.fmeserver.productName")}
                      sx={{ flex: 1 }}
                      {...field}
                    />
                  )}
                />
                <FmeProductHealthIcon
                  control={control}
                  index={index}
                  enabled={fmeConnected}
                />
                <IconButton
                  onClick={() => remove(index)}
                  aria-label={t("common.delete")}
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
              <FmeProductSourceFields
                control={control}
                index={index}
                repositories={fmeRepositories}
              />
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <Controller
                  name={`options.products.${index}.infoUrl`}
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      label={t("tools.fmeserver.productInfoUrl")}
                      sx={{ flex: 2 }}
                      {...field}
                    />
                  )}
                />
                <Controller
                  name={`options.products.${index}.maxArea`}
                  control={control}
                  defaultValue={-1}
                  render={({ field }) => (
                    <TextField
                      label={t("tools.fmeserver.productMaxArea")}
                      type="number"
                      sx={{ flex: 1 }}
                      {...field}
                      onChange={(e) =>
                        field.onChange(Number(e.target.value))
                      }
                    />
                  )}
                />
              </Stack>
              <Controller
                name={`options.products.${index}.promptForEmail`}
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!field.value}
                        onChange={(_, checked) => field.onChange(checked)}
                      />
                    }
                    label={t("tools.fmeserver.productPromptForEmail")}
                  />
                )}
              />
            </Box>
          ))}

          <Box
            sx={{
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 1,
              p: 2,
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t("common.add")}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <GroupSelect
                label={t("tools.fmeserver.productGroup")}
                value={newP.group}
                onChange={(group) => setNewP({ ...newP, group })}
                groups={groupOptions}
                missingText={t("tools.fmeserver.productGroupMissing")}
                emptyText={t("tools.fmeserver.addProductGroupsFirst")}
              />
              <TextField
                label={t("tools.fmeserver.productName")}
                value={newP.name}
                onChange={(e) => setNewP({ ...newP, name: e.target.value })}
                sx={{ flex: 1 }}
              />
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <FmeSuggestField
                label={t("tools.fmeserver.productRepository")}
                value={newP.repository}
                onChange={(repository) =>
                  setNewP((p) => ({ ...p, repository }))
                }
                options={fmeRepositories}
              />
              <FmeSuggestField
                label={t("tools.fmeserver.productWorkspace")}
                value={newP.workspace}
                onChange={(workspace) => setNewP((p) => ({ ...p, workspace }))}
                options={newSuggestions.workspaces}
              />
              <FmeSuggestField
                label={t("tools.fmeserver.productGeoAttribute")}
                value={newP.geoAttribute}
                onChange={(geoAttribute) =>
                  setNewP((p) => ({ ...p, geoAttribute }))
                }
                options={newSuggestions.parameters}
              />
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <TextField
                label={t("tools.fmeserver.productInfoUrl")}
                value={newP.infoUrl}
                onChange={(e) =>
                  setNewP({ ...newP, infoUrl: e.target.value })
                }
                sx={{ flex: 2 }}
              />
              <TextField
                label={t("tools.fmeserver.productMaxArea")}
                type="number"
                value={newP.maxArea}
                onChange={(e) =>
                  setNewP({ ...newP, maxArea: e.target.value })
                }
                sx={{ flex: 1 }}
              />
            </Stack>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newP.promptForEmail}
                    onChange={(_, checked) =>
                      setNewP({ ...newP, promptForEmail: checked })
                    }
                  />
                }
                label={t("tools.fmeserver.productPromptForEmail")}
              />
              <Button
                startIcon={<AddIcon />}
                onClick={addProduct}
                variant="outlined"
              >
                {t("common.add")}
              </Button>
            </Stack>
          </Box>
        </FormFieldGrid>
      </FormPanel>
    </>
  );
}
