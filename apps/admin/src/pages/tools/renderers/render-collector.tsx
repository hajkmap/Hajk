import {
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import {
  Control,
  Controller,
  FieldValues,
  UseFormSetValue,
  useForm,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import FormAccordion from "../../../components/form-components/form-accordion";
import FormFieldGrid from "../../../components/form-components/form-field-grid";
import { useLayers } from "../../../api/layers";
import { Tool } from "../../../api/tools";
import LayerPicker from "../components/layer-picker";
import { collectorDefaults } from "./tool-option-defaults";
import {
  CheckboxOption,
  GroupsOption,
  TextOption,
} from "./tool-option-fields";

interface CollectorPage {
  id: string;
  order: number;
  header: string;
  text: string;
}

interface CollectorRendererProps {
  tool: Tool;
  control?: Control<FieldValues>;
  setValue?: UseFormSetValue<FieldValues>;
}

/** Window placement is set per map. The form pages are HTML the client renders. */
export default function CollectorRenderer({
  tool,
  control: parentControl,
  setValue: parentSetValue,
}: CollectorRendererProps) {
  const { t } = useTranslation();
  const { control: localControl, setValue: localSetValue } =
    useForm<FieldValues>({
      defaultValues: {
        type: tool?.type ?? "collector",
        options: { ...collectorDefaults, ...tool?.options },
      },
    });
  const control = parentControl ?? localControl;
  const setValue = parentSetValue ?? localSetValue;

  return (
    <>
      <FormAccordion title={t("tools.generalSettings")} defaultExpanded>
        <FormFieldGrid>
          <CheckboxOption
            control={control}
            name="options.visibleAtStart"
            labelKey="tools.visibleAtStart"
          />
          <GroupsOption control={control} />
          <TextOption
            control={control}
            name="options.url"
            labelKey="tools.collector.url"
          />
          <TextOption
            control={control}
            name="options.headerText"
            labelKey="tools.collector.headerText"
          />
          <TextOption
            control={control}
            name="options.abstract"
            labelKey="tools.collector.abstract"
            helpKey="tools.collector.abstractHelp"
          />
          <CheckboxOption
            control={control}
            name="options.wkt"
            labelKey="tools.collector.wkt"
            helpKey="tools.collector.wktHelp"
          />
        </FormFieldGrid>
      </FormAccordion>

      <FormAccordion title={t("tools.collector.afterSubmit")} defaultExpanded>
        <FormFieldGrid>
          <CheckboxOption
            control={control}
            name="options.showThankYou"
            labelKey="tools.collector.showThankYou"
          />
          <TextOption
            control={control}
            name="options.thankYou"
            labelKey="tools.collector.thankYou"
            multiline
          />
          <CheckboxOption
            control={control}
            name="options.collectAgain"
            labelKey="tools.collector.collectAgain"
            helpKey="tools.collector.collectAgainHelp"
          />
        </FormFieldGrid>
      </FormAccordion>

      <FormAccordion title={t("tools.collector.service")} defaultExpanded>
        <Controller
          name="options.serviceId"
          control={control}
          render={({ field }) => (
            <EditingServiceChoice
              value={field.value != null ? String(field.value) : ""}
              onChange={(serviceId, featureType) => {
                field.onChange(serviceId);
                setValue("options.featureType", featureType, {
                  shouldDirty: true,
                });
                setValue("options.featureNS", "", { shouldDirty: true });
              }}
            />
          )}
        />
      </FormAccordion>

      <FormAccordion title={t("tools.collector.form")} defaultExpanded>
        <Controller
          name="options.form"
          control={control}
          render={({ field }) => (
            <FormPages value={pagesOf(field.value)} onChange={field.onChange} />
          )}
        />
      </FormAccordion>
    </>
  );
}

function pagesOf(value: unknown): CollectorPage[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const page =
      item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    return {
      id: page.id != null ? String(page.id) : String(index),
      order: index,
      header: typeof page.header === "string" ? page.header : "",
      text: typeof page.text === "string" ? page.text : "",
    };
  });
}

function EditingServiceChoice({
  value,
  onChange,
}: {
  value: string;
  onChange: (serviceId: string, featureType: string) => void;
}) {
  const { t } = useTranslation();
  const { data: layers = [], isLoading, isError } = useLayers();

  const editingLayers = layers
    .filter((layer) => layer.layerKind === "editing")
    .sort((a, b) => a.name.localeCompare(b.name, "sv"));
  const options = editingLayers.map((layer) => ({
    id: layer.id,
    name: layer.name,
    secondary: layer.internalName,
  }));

  return (
    <FormFieldGrid>
      <Typography variant="body2" color="text.secondary">
        {t("tools.collector.serviceHint")}
      </Typography>
      <LayerPicker
        single
        options={options}
        selectedIds={value ? [value] : []}
        onChange={(ids) => {
          const id = ids[0] ?? "";
          const layer = editingLayers.find((entry) => entry.id === id);
          onChange(id, layer?.selectedLayers?.[0]?.split(":").pop() ?? "");
        }}
        isLoading={isLoading}
        error={isError ? t("tools.collector.layersLoadFailed") : undefined}
        emptyText={t("tools.collector.noServices")}
      />
    </FormFieldGrid>
  );
}

function FormPages({
  value,
  onChange,
}: {
  value: CollectorPage[];
  onChange: (pages: CollectorPage[]) => void;
}) {
  const { t } = useTranslation();
  const update = (pages: CollectorPage[]) =>
    onChange(pages.map((page, order) => ({ ...page, order })));
  const patch = (index: number, changes: Partial<CollectorPage>) =>
    update(
      value.map((page, current) =>
        current === index ? { ...page, ...changes } : page,
      ),
    );
  const move = (index: number, offset: number) => {
    const pages = [...value];
    const [page] = pages.splice(index, 1);
    pages.splice(index + offset, 0, page);
    update(pages);
  };

  return (
    <FormFieldGrid>
      <Typography variant="body2" color="text.secondary">
        {t("tools.collector.pageTextHelp")}
      </Typography>
      {value.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            p: 3,
            textAlign: "center",
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          {t("tools.collector.noPages")}
        </Typography>
      ) : null}
      {value.map((page, index) => (
        <Box
          key={page.id}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            p: 2,
          }}
        >
          <Stack
            direction="row"
            sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}
          >
            <Typography variant="subtitle2">
              {t("tools.collector.pageNumber", { number: index + 1 })}
            </Typography>
            <Stack direction="row">
              <Tooltip title={t("tools.collector.movePageUp")}>
                <span>
                  <IconButton
                    size="small"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={t("tools.collector.movePageDown")}>
                <span>
                  <IconButton
                    size="small"
                    disabled={index === value.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={t("tools.collector.removePage")}>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() =>
                    update(value.filter((_, current) => current !== index))
                  }
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
          <Stack spacing={2}>
            <TextField
              label={t("tools.collector.pageHeader")}
              fullWidth
              value={page.header}
              onChange={(event) => patch(index, { header: event.target.value })}
            />
            <TextField
              label={t("tools.collector.pageText")}
              fullWidth
              multiline
              minRows={4}
              maxRows={16}
              value={page.text}
              onChange={(event) => patch(index, { text: event.target.value })}
              slotProps={{
                input: { sx: { fontFamily: "monospace", fontSize: 13 } },
              }}
            />
          </Stack>
        </Box>
      ))}
      <Box>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() =>
            update([
              ...value,
              { id: crypto.randomUUID(), order: value.length, header: "", text: "" },
            ])
          }
        >
          {t("tools.collector.addPage")}
        </Button>
      </Box>
    </FormFieldGrid>
  );
}
