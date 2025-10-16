import { useParams, useNavigate } from "react-router";
import Page from "../../layouts/root/components/page";
import { useTranslation } from "react-i18next";
import {
  Typography,
  TextField,
  Checkbox,
  FormGroup,
  FormControlLabel,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import StyledDataGrid from "../../components/data-grid";
import { useMapsByToolName, useTools } from "../../api/tools";
import { Map } from "../../api/maps";
import FormActionPanel from "../../components/form-action-panel";
import FormContainer from "../../components/form-components/form-container";
import FormPanel from "../../components/form-components/form-panel";
import FormAccordion from "../../components/form-components/form-accordion";
import { Controller, FieldValues, useForm } from "react-hook-form";
import { useRef } from "react";
import { toast } from "react-toastify";

export default function ToolSettings() {
  const { t } = useTranslation();
  const { toolName } = useParams<{ toolName: string }>();
  const navigate = useNavigate();
  const {
    data: maps,
    isLoading: mapsLoading,
    isError: mapsError,
  } = useMapsByToolName(toolName ?? "");
  const { data: tools, isLoading: toolsLoading } = useTools();
  const formRef = useRef<HTMLFormElement | null>(null);

  const tool = (tools ?? []).find((t) => t.type === toolName);

  const { control } = useForm<FieldValues>({
    defaultValues: {
      type: tool?.type ?? "",
      // Spread options into flat fields like options.key
      ...(tool?.options
        ? Object.fromEntries(
            Object.entries(tool.options).map(([k, v]) => [
              `options.${k}`,
              String(v ?? ""),
            ])
          )
        : {}),
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const loading = mapsLoading || toolsLoading;
  const handleExternalSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  return (
    console.log(tool),
    (
      <Page title={toolName ?? t("common.tools")}>
        <FormActionPanel
          updateStatus="idle"
          onUpdate={handleExternalSubmit}
          saveButtonText={t("common.dialog.saveBtn")}
        >
          {loading ? (
            <Typography variant="h6">{t("common.loading")}</Typography>
          ) : !tool ? (
            <Typography variant="h6">{t("common.notFound")}</Typography>
          ) : (
            <FormContainer
              onSubmit={(e) => {
                e.preventDefault();
                toast.info(t("common.notImplemented"));
              }}
              noValidate={false}
              formRef={formRef}
            >
              <FormPanel title={t("common.information")}>
                <Grid container>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="type"
                      control={control}
                      defaultValue={tool?.type ?? ""}
                      render={({ field }) => (
                        <TextField
                          label={t("tools.type")}
                          fullWidth
                          InputProps={{ readOnly: true }}
                          {...field}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="options.title"
                      control={control}
                      defaultValue={tool?.options?.title ?? ""}
                      render={({ field }) => (
                        <TextField
                          label={t("tools.title")}
                          fullWidth
                          {...field}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="options.description"
                      control={control}
                      defaultValue={tool?.options?.description ?? ""}
                      render={({ field }) => (
                        <TextField
                          label={t("tools.description")}
                          fullWidth
                          {...field}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </FormPanel>

              <FormAccordion title={t("tools.usedInHajk")}>
                <Grid container>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="options.usedInHajk"
                      control={control}
                      defaultValue={tool?.options?.usedInHajk ?? ""}
                      render={({ field }) => (
                        <TextField
                          label={t("tools.usedInHajk")}
                          fullWidth
                          {...field}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="options.drawOrderViewInfoText"
                      control={control}
                      defaultValue={tool?.options?.drawOrderViewInfoText ?? ""}
                      render={({ field }) => (
                        <TextField
                          multiline
                          rows={4}
                          label={t("tools.drawOrderViewInfoText")}
                          fullWidth
                          {...field}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormGroup>
                      <Controller
                        name="options.active"
                        control={control}
                        defaultValue={Boolean(tool?.options?.active)}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={!!field.value}
                                onChange={(_, checked) =>
                                  field.onChange(checked)
                                }
                              />
                            }
                            label={t("tools.active")}
                          />
                        )}
                      />
                    </FormGroup>
                  </Grid>
                </Grid>
              </FormAccordion>

              <FormAccordion title={t("tools.showSettings")}>
                <Grid container>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormGroup>
                      <Controller
                        name="options.visibleAtStart"
                        control={control}
                        defaultValue={Boolean(tool?.options?.visibleAtStart)}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={!!field.value}
                                onChange={(_, checked) =>
                                  field.onChange(checked)
                                }
                              />
                            }
                            label={t("tools.visibleAtStart")}
                          />
                        )}
                      />
                      <Controller
                        name="options.showBreadCrumbs"
                        control={control}
                        defaultValue={Boolean(tool?.options?.showBreadCrumbs)}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={!!field.value}
                                onChange={(_, checked) =>
                                  field.onChange(checked)
                                }
                              />
                            }
                            label={t("tools.showBreadCrumbs")}
                          />
                        )}
                      />
                      <Controller
                        name="options.showIcon"
                        control={control}
                        defaultValue={Boolean(tool?.options?.showIcon)}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={!!field.value}
                                onChange={(_, checked) =>
                                  field.onChange(checked)
                                }
                              />
                            }
                            label={t("tools.showIcon")}
                          />
                        )}
                      />
                    </FormGroup>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormGroup>
                      <Controller
                        name="options.showFilter"
                        control={control}
                        defaultValue={Boolean(tool?.options?.showFilter)}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={!!field.value}
                                onChange={(_, checked) =>
                                  field.onChange(checked)
                                }
                              />
                            }
                            label={t("tools.showFilter")}
                          />
                        )}
                      />
                      <Controller
                        name="options.showQuickAccess"
                        control={control}
                        defaultValue={Boolean(tool?.options?.showQuickAccess)}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={!!field.value}
                                onChange={(_, checked) =>
                                  field.onChange(checked)
                                }
                              />
                            }
                            label={t("tools.showQuickAccess")}
                          />
                        )}
                      />
                      <Controller
                        name="options.showDrawOrderView"
                        control={control}
                        defaultValue={Boolean(tool?.options?.showDrawOrderView)}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={!!field.value}
                                onChange={(_, checked) =>
                                  field.onChange(checked)
                                }
                              />
                            }
                            label={t("tools.showDrawOrderView")}
                          />
                        )}
                      />
                    </FormGroup>
                  </Grid>
                </Grid>
              </FormAccordion>

              <FormAccordion title={t("tools.displaySettings")}>
                <Grid container>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormGroup>
                      <Controller
                        name="options.backgroundSwitcherBlack"
                        control={control}
                        defaultValue={Boolean(
                          tool?.options?.backgroundSwitcherBlack
                        )}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={!!field.value}
                                onChange={(_, checked) =>
                                  field.onChange(checked)
                                }
                              />
                            }
                            label={t("tools.backgroundSwitcherBlack")}
                          />
                        )}
                      />
                      <Controller
                        name="options.backgroundSwitcherWhite"
                        control={control}
                        defaultValue={Boolean(
                          tool?.options?.backgroundSwitcherWhite
                        )}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={!!field.value}
                                onChange={(_, checked) =>
                                  field.onChange(checked)
                                }
                              />
                            }
                            label={t("tools.backgroundSwitcherWhite")}
                          />
                        )}
                      />
                      <Controller
                        name="options.cqlFilterVisible"
                        control={control}
                        defaultValue={Boolean(tool?.options?.cqlFilterVisible)}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={!!field.value}
                                onChange={(_, checked) =>
                                  field.onChange(checked)
                                }
                              />
                            }
                            label={t("tools.cqlFilterVisible")}
                          />
                        )}
                      />
                      <Controller
                        name="options.dropdownThemeMaps"
                        control={control}
                        defaultValue={Boolean(tool?.options?.dropdownThemeMaps)}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={!!field.value}
                                onChange={(_, checked) =>
                                  field.onChange(checked)
                                }
                              />
                            }
                            label={t("tools.dropdownThemeMaps")}
                          />
                        )}
                      />
                      <Controller
                        name="options.enableOSM"
                        control={control}
                        defaultValue={Boolean(tool?.options?.enableOSM)}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={!!field.value}
                                onChange={(_, checked) =>
                                  field.onChange(checked)
                                }
                              />
                            }
                            label={t("tools.enableOSM")}
                          />
                        )}
                      />
                      <Controller
                        name="options.enableQuickAccessPresets"
                        control={control}
                        defaultValue={Boolean(
                          tool?.options?.enableQuickAccessPresets
                        )}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={!!field.value}
                                onChange={(_, checked) =>
                                  field.onChange(checked)
                                }
                              />
                            }
                            label={t("tools.enableQuickAccessPresets")}
                          />
                        )}
                      />
                    </FormGroup>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormGroup>
                      <Controller
                        name="options.enableSystemLayersSwitch"
                        control={control}
                        defaultValue={Boolean(
                          tool?.options?.enableSystemLayersSwitch
                        )}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={!!field.value}
                                onChange={(_, checked) =>
                                  field.onChange(checked)
                                }
                              />
                            }
                            label={t("tools.enableSystemLayersSwitch")}
                          />
                        )}
                      />
                      <Controller
                        name="options.enableTransparencySlider"
                        control={control}
                        defaultValue={Boolean(
                          tool?.options?.enableTransparencySlider
                        )}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={!!field.value}
                                onChange={(_, checked) =>
                                  field.onChange(checked)
                                }
                              />
                            }
                            label={t("tools.enableTransparencySlider")}
                          />
                        )}
                      />
                      <Controller
                        name="options.enableUserQuickAccessFavorites"
                        control={control}
                        defaultValue={Boolean(
                          tool?.options?.enableUserQuickAccessFavorites
                        )}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={!!field.value}
                                onChange={(_, checked) =>
                                  field.onChange(checked)
                                }
                              />
                            }
                            label={t("tools.enableUserQuickAccessFavorites")}
                          />
                        )}
                      />
                      <Controller
                        name="options.legendForceTransparency"
                        control={control}
                        defaultValue={Boolean(
                          tool?.options?.legendForceTransparency
                        )}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={!!field.value}
                                onChange={(_, checked) =>
                                  field.onChange(checked)
                                }
                              />
                            }
                            label={t("tools.legendForceTransparency")}
                          />
                        )}
                      />
                      <Controller
                        name="options.legendTryHiDPI"
                        control={control}
                        defaultValue={Boolean(tool?.options?.legendTryHiDPI)}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={!!field.value}
                                onChange={(_, checked) =>
                                  field.onChange(checked)
                                }
                              />
                            }
                            label={t("tools.legendTryHiDPI")}
                          />
                        )}
                      />
                      <Controller
                        name="options.lockDrawOrderBaselayer"
                        control={control}
                        defaultValue={Boolean(
                          tool?.options?.lockDrawOrderBaselayer
                        )}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={!!field.value}
                                onChange={(_, checked) =>
                                  field.onChange(checked)
                                }
                              />
                            }
                            label={t("tools.lockDrawOrderBaselayer")}
                          />
                        )}
                      />
                    </FormGroup>
                  </Grid>
                </Grid>
              </FormAccordion>

              <FormAccordion title={t("tools.textSettings")}>
                <Grid container>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="options.instruction"
                      control={control}
                      defaultValue={tool?.options?.instruction ?? ""}
                      render={({ field }) => (
                        <TextField
                          label={t("tools.instruction")}
                          fullWidth
                          multiline
                          rows={3}
                          {...field}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="options.quickAccessTopicsInfoText"
                      control={control}
                      defaultValue={
                        tool?.options?.quickAccessTopicsInfoText ?? ""
                      }
                      render={({ field }) => (
                        <TextField
                          label={t("tools.quickAccessTopicsInfoText")}
                          fullWidth
                          multiline
                          rows={3}
                          {...field}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="options.userQuickAccessFavoritesInfoText"
                      control={control}
                      defaultValue={
                        tool?.options?.userQuickAccessFavoritesInfoText ?? ""
                      }
                      render={({ field }) => (
                        <TextField
                          label={t("tools.userQuickAccessFavoritesInfoText")}
                          fullWidth
                          multiline
                          rows={3}
                          {...field}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="options.themeMapHeaderCaption"
                      control={control}
                      defaultValue={tool?.options?.themeMapHeaderCaption ?? ""}
                      render={({ field }) => (
                        <TextField
                          label={t("tools.themeMapHeaderCaption")}
                          fullWidth
                          {...field}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </FormAccordion>

              <FormAccordion title={t("tools.layoutSettings")}>
                <Grid container>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="options.position"
                      control={control}
                      defaultValue={tool?.options?.position ?? ""}
                      render={({ field }) => (
                        <TextField
                          label={t("tools.position")}
                          fullWidth
                          {...field}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="options.target"
                      control={control}
                      defaultValue={tool?.options?.target ?? ""}
                      render={({ field }) => (
                        <TextField
                          label={t("tools.target")}
                          fullWidth
                          {...field}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="options.height"
                      control={control}
                      defaultValue={tool?.options?.height ?? ""}
                      render={({ field }) => (
                        <TextField
                          label={t("tools.height")}
                          fullWidth
                          {...field}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="options.width"
                      control={control}
                      defaultValue={tool?.options?.width ?? ""}
                      render={({ field }) => (
                        <TextField
                          label={t("tools.width")}
                          fullWidth
                          {...field}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </FormAccordion>

              <FormAccordion title={t("tools.otherSettings")}>
                <Grid container>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormGroup>
                      <Controller
                        name="options.minMaxZoomAlertOnToggleOnly"
                        control={control}
                        defaultValue={Boolean(
                          tool?.options?.minMaxZoomAlertOnToggleOnly
                        )}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={!!field.value}
                                onChange={(_, checked) =>
                                  field.onChange(checked)
                                }
                              />
                            }
                            label={t("tools.minMaxZoomAlertOnToggleOnly")}
                          />
                        )}
                      />
                      <Controller
                        name="options.visibleAtStartMobile"
                        control={control}
                        defaultValue={Boolean(
                          tool?.options?.visibleAtStartMobile
                        )}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={!!field.value}
                                onChange={(_, checked) =>
                                  field.onChange(checked)
                                }
                              />
                            }
                            label={t("tools.visibleAtStartMobile")}
                          />
                        )}
                      />
                    </FormGroup>
                  </Grid>
                </Grid>
              </FormAccordion>

              <FormPanel title={t("tools.usedInMaps")}>
                {mapsError ? (
                  <Typography variant="body1">{t("common.error")}</Typography>
                ) : (
                  <Grid size={12}>
                    <StyledDataGrid<Map>
                      rows={maps ?? []}
                      columns={[
                        { field: "name", headerName: t("map.name"), flex: 1 },
                        {
                          field: "locked",
                          headerName: t("map.locked"),
                          flex: 0.5,
                        },
                      ]}
                      onRowClick={({ row }) => {
                        const name: string = row.name;
                        if (name) {
                          void navigate(`/maps/${name}`);
                        }
                      }}
                    />
                  </Grid>
                )}
              </FormPanel>
            </FormContainer>
          )}
        </FormActionPanel>
      </Page>
    )
  );
}
