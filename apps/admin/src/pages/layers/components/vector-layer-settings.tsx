import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Typography,
} from "@mui/material";
import {
  Controller,
  type Control,
  type FieldValues,
  type UseFormRegister,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import FormAccordion from "../../../components/form-components/form-accordion";
import FormFieldGrid, {
  FormFieldRow,
} from "../../../components/form-components/form-field-grid";
import FormPanel from "../../../components/form-components/form-panel";
import {
  InlineLabelWithHelp,
  SelectWithHelp,
  TextFieldWithHelp,
} from "../../../components/form-components/field-label-with-help";
import { SettingsSearchField } from "../../../components/form-components/searchable-field";
import SearchablePanel from "../../../components/form-components/searchable-panel";

interface VectorLayerSettingsProps {
  control: Control<FieldValues>;
  register: UseFormRegister<FieldValues>;
  searchTerm: string;
  allValues: FieldValues | undefined;
}

export default function VectorLayerSettings({
  control,
  register,
  searchTerm,
  allValues,
}: VectorLayerSettingsProps) {
  const { t } = useTranslation();
  const search = { searchTerm, allValues };

  return (
    <SearchablePanel
      panelTitleKeywords={[t("layers.vector.settings")]}
      keywords={["vektor", "vector", "sld", "filter", "dataformat"]}
      fields={[
        "options.dataFormat",
        "options.content",
        "options.sldUrl",
        "options.sldText",
        "options.sldStyle",
        "options.icon",
        "options.fillColor",
        "options.lineColor",
        "options.filterable",
        "options.filterAttribute",
        "options.filterComparer",
        "options.filterValue",
      ]}
      searchTerm={searchTerm}
      allValues={allValues}
    >
      <FormPanel title={t("layers.vector.settings")}>
        <FormFieldGrid>
          <SettingsSearchField
            labelKeys={["layers.vector.dataFormat"]}
            fields={["options.dataFormat"]}
            {...search}
          >
            <FormFieldRow>
              <Controller
                name="options.dataFormat"
                control={control}
                render={({ field }) => (
                  <SelectWithHelp
                    labelKey="layers.vector.dataFormat"
                    helpKey="layers.vector.dataFormatHelp"
                    {...field}
                    value={(field.value as string) || "WFS"}
                  >
                    <MenuItem value="WFS">WFS</MenuItem>
                    <MenuItem value="GeoJSON">GeoJSON</MenuItem>
                  </SelectWithHelp>
                )}
              />
            </FormFieldRow>
          </SettingsSearchField>
          <SettingsSearchField
            labelKeys={["layers.vector.content"]}
            fields={["options.content"]}
            {...search}
          >
            <FormFieldRow>
              <TextFieldWithHelp
                labelKey="layers.vector.content"
                helpKey="layers.vector.contentHelp"
                fullWidth
                {...register("options.content")}
              />
            </FormFieldRow>
          </SettingsSearchField>
        </FormFieldGrid>

        <FormAccordion title={t("layers.vector.style")} bordered>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t("layers.vector.styleIntro")}
          </Typography>
          <FormFieldGrid>
            <SettingsSearchField
              labelKeys={["layers.vector.sldUrl"]}
              fields={["options.sldUrl"]}
              {...search}
            >
              <FormFieldRow fullWidth>
                <TextFieldWithHelp
                  labelKey="layers.vector.sldUrl"
                  helpKey="layers.vector.sldUrlHelp"
                  fullWidth
                  {...register("options.sldUrl")}
                />
              </FormFieldRow>
            </SettingsSearchField>
            <SettingsSearchField
              labelKeys={["layers.vector.sldText"]}
              fields={["options.sldText"]}
              {...search}
            >
              <FormFieldRow fullWidth>
                <TextFieldWithHelp
                  labelKey="layers.vector.sldText"
                  helpKey="layers.vector.sldTextHelp"
                  fullWidth
                  multiline
                  minRows={4}
                  {...register("options.sldText")}
                />
              </FormFieldRow>
            </SettingsSearchField>
            <SettingsSearchField
              labelKeys={["layers.vector.sldStyle"]}
              fields={["options.sldStyle"]}
              {...search}
            >
              <FormFieldRow>
                <TextFieldWithHelp
                  labelKey="layers.vector.sldStyle"
                  helpKey="layers.vector.sldStyleHelp"
                  fullWidth
                  {...register("options.sldStyle")}
                />
              </FormFieldRow>
            </SettingsSearchField>
            <SettingsSearchField
              labelKeys={["layers.vector.icon"]}
              fields={["options.icon"]}
              {...search}
            >
              <FormFieldRow>
                <TextFieldWithHelp
                  labelKey="layers.vector.icon"
                  helpKey="layers.vector.iconHelp"
                  fullWidth
                  {...register("options.icon")}
                />
              </FormFieldRow>
            </SettingsSearchField>
            <SettingsSearchField
              labelKeys={["layers.vector.symbolXOffset"]}
              fields={["options.symbolXOffset"]}
              {...search}
            >
              <FormFieldRow>
                <TextFieldWithHelp
                  labelKey="layers.vector.symbolXOffset"
                  helpKey="layers.vector.iconHelp"
                  fullWidth
                  {...register("options.symbolXOffset")}
                />
              </FormFieldRow>
            </SettingsSearchField>
            <SettingsSearchField
              labelKeys={["layers.vector.symbolYOffset"]}
              fields={["options.symbolYOffset"]}
              {...search}
            >
              <FormFieldRow>
                <TextFieldWithHelp
                  labelKey="layers.vector.symbolYOffset"
                  helpKey="layers.vector.iconHelp"
                  fullWidth
                  {...register("options.symbolYOffset")}
                />
              </FormFieldRow>
            </SettingsSearchField>
            <Choice
              name="options.pointSize"
              labelKey="layers.vector.pointSize"
              control={control}
              search={search}
              options={[
                ["", "layers.vector.sizeEmpty"],
                ["4", "layers.vector.pointSmall"],
                ["8", "layers.vector.pointMedium"],
                ["16", "layers.vector.pointLarge"],
                ["32", "layers.vector.pointLarger"],
                ["64", "layers.vector.pointLargest"],
              ]}
            />
            <Choice
              name="options.lineWidth"
              labelKey="layers.vector.lineWidth"
              control={control}
              search={search}
              options={[
                ["", "layers.vector.sizeEmpty"],
                ["1", "layers.vector.lineThin"],
                ["3", "layers.vector.lineNormal"],
                ["5", "layers.vector.lineThick"],
                ["8", "layers.vector.lineThicker"],
              ]}
            />
            <Choice
              name="options.lineStyle"
              labelKey="layers.vector.lineStyle"
              control={control}
              search={search}
              options={[
                ["", "layers.vector.sizeEmpty"],
                ["solid", "layers.vector.lineSolid"],
                ["dash", "layers.vector.lineDash"],
                ["dot", "layers.vector.lineDot"],
              ]}
            />
            <SettingsSearchField
              labelKeys={["layers.vector.fillColor"]}
              fields={["options.fillColor"]}
              {...search}
            >
              <FormFieldRow>
                <TextFieldWithHelp
                  labelKey="layers.vector.fillColor"
                  helpKey="layers.vector.fillColorHelp"
                  fullWidth
                  {...register("options.fillColor")}
                />
              </FormFieldRow>
            </SettingsSearchField>
            <SettingsSearchField
              labelKeys={["layers.vector.lineColor"]}
              fields={["options.lineColor"]}
              {...search}
            >
              <FormFieldRow>
                <TextFieldWithHelp
                  labelKey="layers.vector.lineColor"
                  helpKey="layers.vector.lineColorHelp"
                  fullWidth
                  {...register("options.lineColor")}
                />
              </FormFieldRow>
            </SettingsSearchField>
          </FormFieldGrid>
        </FormAccordion>

        <FormAccordion title={t("layers.vector.filter")} bordered>
          <FormFieldGrid>
            <SettingsSearchField
              labelKeys={["layers.vector.filterable"]}
              fields={["options.filterable"]}
              {...search}
            >
              <FormFieldRow>
                <Controller
                  name="options.filterable"
                  control={control}
                  render={({ field }) => (
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={field.value === true}
                            onChange={(event) =>
                              field.onChange(event.target.checked)
                            }
                          />
                        }
                        label={
                          <InlineLabelWithHelp
                            label={t("layers.vector.filterable")}
                            help={t("layers.vector.filterableHelp")}
                          />
                        }
                      />
                    </FormGroup>
                  )}
                />
              </FormFieldRow>
            </SettingsSearchField>
            <SettingsSearchField
              labelKeys={["layers.vector.filterAttribute"]}
              fields={["options.filterAttribute"]}
              {...search}
            >
              <FormFieldRow>
                <TextFieldWithHelp
                  labelKey="layers.vector.filterAttribute"
                  helpKey="layers.vector.filterableHelp"
                  fullWidth
                  {...register("options.filterAttribute")}
                />
              </FormFieldRow>
            </SettingsSearchField>
            <Choice
              name="options.filterComparer"
              labelKey="layers.vector.filterComparer"
              helpKey="layers.vector.filterableHelp"
              control={control}
              search={search}
              options={[
                ["lt", "layers.vector.filterLt"],
                ["gt", "layers.vector.filterGt"],
                ["eq", "layers.vector.filterEq"],
                ["not", "layers.vector.filterNot"],
              ]}
            />
            <SettingsSearchField
              labelKeys={["layers.vector.filterValue"]}
              fields={["options.filterValue"]}
              {...search}
            >
              <FormFieldRow>
                <TextFieldWithHelp
                  labelKey="layers.vector.filterValue"
                  helpKey="layers.vector.filterableHelp"
                  fullWidth
                  {...register("options.filterValue")}
                />
              </FormFieldRow>
            </SettingsSearchField>
          </FormFieldGrid>
        </FormAccordion>
      </FormPanel>
    </SearchablePanel>
  );
}

function Choice({
  name,
  labelKey,
  helpKey = "layers.vector.styleIntro",
  control,
  search,
  options,
}: {
  name: string;
  labelKey: string;
  helpKey?: string;
  control: Control<FieldValues>;
  search: { searchTerm: string; allValues: FieldValues | undefined };
  options: [string, string][];
}) {
  const { t } = useTranslation();
  return (
    <SettingsSearchField labelKeys={[labelKey]} fields={[name]} {...search}>
      <FormFieldRow>
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <SelectWithHelp
              labelKey={labelKey}
              helpKey={helpKey}
              {...field}
              value={typeof field.value === "string" ? field.value : ""}
            >
              {options.map(([value, key]) => (
                <MenuItem key={value || "empty"} value={value}>
                  {t(key)}
                </MenuItem>
              ))}
              {typeof field.value === "string" &&
                field.value.length > 0 &&
                !options.some(([value]) => value === field.value) && (
                  <MenuItem value={field.value}>{field.value}</MenuItem>
                )}
            </SelectWithHelp>
          )}
        />
      </FormFieldRow>
    </SettingsSearchField>
  );
}
