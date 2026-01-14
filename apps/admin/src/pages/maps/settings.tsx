import { useRef, useState } from "react";
import { useParams } from "react-router";
import Page from "../../layouts/root/components/page";
import { useTranslation } from "react-i18next";
import {
  Grid2 as Grid,
  TextField,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  ButtonGroup,
  Box,
} from "@mui/material";
import { Controller, FieldValues, useForm } from "react-hook-form";
import {
  useMapByName,
  MapMutation,
  useUpdateMap,
  useMaps,
} from "../../api/maps";
import { SquareSpinnerComponent } from "../../components/progress/square-progress";
import FormActionPanel from "../../components/form-action-panel";
import { toast } from "react-toastify";
import { HttpError } from "../../lib/http-error";
import FormContainer from "../../components/form-components/form-container";
import FormPanel from "../../components/form-components/form-panel";
import FormAccordion from "../../components/form-components/form-accordion";
import {
  LayerSwitcherDnD,
  TreeItemData,
  ToolPlacementDnD,
} from "../../components/layerswitcher-dnd";
import { useLayers } from "../../api/layers";
import { useGroups } from "../../api/groups";
import { useTools } from "../../api/tools";
import { TreeItems } from "dnd-kit-sortable-tree";
import ActiveAdminsBadge from "../../components/active-admins-badge";
import mapBackgroundImage from "../../../public/mapbackground.png";

export default function MapSettings() {
  const { t } = useTranslation();
  const { mapId } = useParams();
  const { data: maps } = useMaps();
  const mapName = maps?.find((m) => m.id == mapId)?.name;
  const { data: map, isLoading, isError } = useMapByName(mapName ?? "");
  const { mutateAsync: updateMap, status: updateStatus } = useUpdateMap();
  const { palette } = useTheme();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [activeTab, setActiveTab] = useState<"menu" | "settings" | "tools">(
    "settings"
  );
  const { data: layers = [] } = useLayers();
  const { data: groups = [] } = useGroups();
  const { data: tools = [] } = useTools();

  // Drop zone states
  const [backgroundLayersDZ, setBackgroundLayersDZ] = useState<
    TreeItems<TreeItemData>
  >([]);
  const [groupLayersDZ, setGroupLayersDZ] = useState<TreeItems<TreeItemData>>(
    []
  );
  const [drawerDZ, setDrawerDZ] = useState<TreeItems<TreeItemData>>([]);
  const [controlDZ, setControlDZ] = useState<TreeItems<TreeItemData>>([]);
  const [widgetLeftDZ, setWidgetLeftDZ] = useState<TreeItems<TreeItemData>>([]);
  const [widgetRightDZ, setWidgetRightDZ] = useState<TreeItems<TreeItemData>>(
    []
  );

  const backgroundImage = mapBackgroundImage;

  const handleExternalSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  const defaultValues = {} as FieldValues;
  const { register, handleSubmit, control } = useForm<FieldValues>({
    defaultValues,
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const handleUpdateMap = async (mapData: MapMutation) => {
    try {
      const payload = {
        name: mapData.name ?? "",
        locked: mapData.locked ?? false,
        options: mapData.options ?? {},
      };

      await updateMap({
        mapName: map?.name ?? "",
        data: payload,
      });
      toast.success(t("maps.updateMapSuccess", { name: mapData.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    } catch (error) {
      console.error("Failed to update map:", error);
      toast.error(t("maps.updateMapFailed", { name: map?.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    }
  };

  if (isLoading) {
    return <SquareSpinnerComponent />;
  }
  if (!map) {
    throw new HttpError(404, "Map not found");
  }
  if (isError) return <div>Error fetching map details.</div>;

  return (
    <Page title={t("common.settings")}>
      {/* Multi-admin warning - showDebug=true for testing */}
      <Box sx={{ mb: 2 }}>
        <ActiveAdminsBadge
          resourceType="map"
          resourceId={mapId ?? ""}
          showDebug
        />
      </Box>
      <ButtonGroup sx={{ mb: 2 }}>
        <Button
          variant={activeTab === "menu" ? "contained" : "outlined"}
          onClick={() => setActiveTab("menu")}
        >
          {t("common.layerGroups")}
        </Button>
        <Button
          variant={activeTab === "settings" ? "contained" : "outlined"}
          onClick={() => setActiveTab("settings")}
        >
          {t("common.settings")}
        </Button>
        <Button
          variant={activeTab === "tools" ? "contained" : "outlined"}
          onClick={() => setActiveTab("tools")}
        >
          {t("common.tools")}
        </Button>
      </ButtonGroup>
      <FormActionPanel
        updateStatus={updateStatus}
        onUpdate={handleExternalSubmit}
        saveButtonText="Spara"
        createdBy={map?.createdBy}
        createdDate={map?.createdDate}
        lastSavedBy={map?.lastSavedBy}
        lastSavedDate={map?.lastSavedDate}
      >
        {activeTab === "settings" && (
          <FormContainer
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit((data: FieldValues) => {
                const toNumber = (v: unknown) =>
                  typeof v === "string" && v.trim() !== ""
                    ? Number(v)
                    : (v as number | undefined);

                const normalized: MapMutation = {
                  id: 0,
                  name: (data.name as string) ?? "",
                  locked: (data.locked as boolean) ?? false,
                  options: {
                    projection:
                      (data["options.projection"] as string) ?? "EPSG:3006",
                    startZoom: String(
                      toNumber(data["options.startZoom"]) ?? 1.33
                    ),
                    maxZoom: String(toNumber(data["options.maxZoom"]) ?? 8),
                    minZoom: String(toNumber(data["options.minZoom"]) ?? 0),
                    centerCoordinate:
                      (data["options.centerCoordinate"] as string) ??
                      "576357, 6386049",
                    origin: (data["options.origin"] as string) ?? "0,0",
                    extent:
                      (data["options.extent"] as string) ??
                      "-1200000, 4700000, 2600000, 8500000",
                    resolutions:
                      (data["options.resolutions"] as string) ??
                      "2048, 1024, 512, 256, 128, 64, 32, 16, 8",
                    printResolutions:
                      (data["options.printResolutions"] as string) ?? "",
                    constrainResolution: String(
                      Boolean(data["options.constrainResolution"])
                    ),
                    constrainOnlyCenter: String(
                      Boolean(data["options.constrainOnlyCenter"])
                    ),
                    constrainResolutionMobile: String(
                      Boolean(data["options.constrainResolutionMobile"])
                    ),
                    enableDownloadLink: String(
                      Boolean(data["options.enableDownloadLink"])
                    ),
                    enableAppStateInHash: String(
                      Boolean(data["options.enableAppStateInHash"])
                    ),
                    confirmOnWindowClose: String(
                      Boolean(data["options.confirmOnWindowClose"])
                    ),
                    logoLight:
                      (data["options.logoLight"] as string) ?? "/logoLight.png",
                    logoDark: (data["options.logoDark"] as string) ?? "",
                    legendOptions:
                      (data["options.legendOptions"] as string) ?? "",
                    crossOrigin:
                      (data["options.crossOrigin"] as string) ?? "anonymous",
                    mapselector: String(Boolean(data["options.mapselector"])),
                    mapcleaner: String(Boolean(data["options.mapcleaner"])),
                    mapresetter: String(Boolean(data["options.mapresetter"])),
                    showThemeToggler: String(
                      Boolean(data["options.showThemeToggler"])
                    ),
                    showUserAvatar: String(
                      Boolean(data["options.showUserAvatar"])
                    ),
                    showRecentlyUsedPlugins: String(
                      Boolean(data["options.showRecentlyUsedPlugins"])
                    ),
                    altShiftDragRotate: String(
                      Boolean(data["options.altShiftDragRotate"])
                    ),
                    onFocusOnly: String(Boolean(data["options.onFocusOnly"])),
                    doubleClickZoom: String(
                      Boolean(data["options.doubleClickZoom"])
                    ),
                    keyboard: String(Boolean(data["options.keyboard"])),
                    mouseWheelZoom: String(
                      Boolean(data["options.mouseWheelZoom"])
                    ),
                    shiftDragZoom: String(
                      Boolean(data["options.shiftDragZoom"])
                    ),
                    dragPan: String(Boolean(data["options.dragPan"])),
                    pinchRotate: String(Boolean(data["options.pinchRotate"])),
                    pinchZoom: String(Boolean(data["options.pinchZoom"])),
                    zoomLevelDelta: String(
                      toNumber(data["options.zoomLevelDelta"]) ?? ""
                    ),
                    zoomAnimationDuration: String(
                      toNumber(data["options.zoomAnimationDuration"]) ?? ""
                    ),
                    preferredColorScheme:
                      (data["options.preferredColorScheme"] as string) ??
                      "user",
                    primaryColor:
                      (data["options.primaryColor"] as string) ?? "#333333",
                    secondaryColor:
                      (data["options.secondaryColor"] as string) ?? "#ffa000",
                    drawerStatic: String(Boolean(data["options.drawerStatic"])),
                    drawerVisible: String(
                      Boolean(data["options.drawerVisible"])
                    ),
                    drawerVisibleMobile: String(
                      Boolean(data["options.drawerVisibleMobile"])
                    ),
                    drawerPermanent: String(
                      Boolean(data["options.drawerPermanent"])
                    ),
                    drawerContent:
                      (data["options.drawerContent"] as string) ?? "plugins",
                    drawerTitle:
                      (data["options.drawerTitle"] as string) ?? "Kartverktyg",
                    drawerButtonTitle:
                      (data["options.drawerButtonTitle"] as string) ??
                      "Kartverktyg",
                    drawerButtonIcon:
                      (data["options.drawerButtonIcon"] as string) ?? "MapIcon",
                    showCookieNotice: String(
                      Boolean(data["options.showCookieNotice"])
                    ),
                    cookieUse3dPart: String(
                      Boolean(data["options.cookieUse3dPart"])
                    ),
                    showCookieNoticeButton: String(
                      Boolean(data["options.showCookieNoticeButton"])
                    ),
                    cookieLink:
                      (data["options.cookieLink"] as string) ??
                      "https://pts.se/sv/bransch/regler/lagar/lag-om-elektronisk-kommunikation/kakor-cookies/",
                    cookieMessage:
                      (data["options.cookieMessage"] as string) ??
                      "Vi använder cookies för att följa upp användandet och ge en bra upplevelse av kartan. Du kan blockera cookies i webbläsaren men då visas detta meddelande igen.",
                    introductionEnabled: String(
                      Boolean(data["options.introductionEnabled"])
                    ),
                    introductionShowControlButton: String(
                      Boolean(data["options.introductionShowControlButton"])
                    ),
                    introductionSteps:
                      (data["options.introductionSteps"] as string) ?? "[]",
                  } as Record<string, string>,
                };

                void handleUpdateMap(normalized);
              })(e);
            }}
            formRef={formRef}
            noValidate={false}
          >
            <FormPanel title={t("map.baseSettings")}>
              <Grid container>
                <Grid size={{ xs: 12, md: 10 }}>
                  <TextField
                    label={t("map.projection")}
                    fullWidth
                    defaultValue={map?.options?.projection ?? "EPSG:3006"}
                    {...register("options.projection")}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 10 }}>
                  <TextField
                    label={t("map.startZoom")}
                    fullWidth
                    type="number"
                    defaultValue={map?.options?.startZoom ?? 1.33}
                    {...register("options.startZoom")}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 10 }}>
                  <TextField
                    label={t("map.maxZoom")}
                    fullWidth
                    type="number"
                    defaultValue={map?.options?.maxZoom ?? 8}
                    {...register("options.maxZoom")}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 10 }}>
                  <TextField
                    label={t("map.minZoom")}
                    fullWidth
                    type="number"
                    defaultValue={map?.options?.minZoom ?? 0}
                    {...register("options.minZoom")}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 10 }}>
                  <TextField
                    label={t("map.centerCoordinate")}
                    fullWidth
                    defaultValue={
                      map?.options?.centerCoordinate ?? "576357, 6386049"
                    }
                    {...register("options.centerCoordinate")}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 10 }}>
                  <TextField
                    label={t("map.origin")}
                    fullWidth
                    defaultValue={map?.options?.origin ?? "0,0"}
                    {...register("options.origin")}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 10 }}>
                  <TextField
                    label={t("map.extent")}
                    fullWidth
                    defaultValue={
                      map?.options?.extent ??
                      "-1200000, 4700000, 2600000, 8500000"
                    }
                    {...register("options.extent")}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 10 }}>
                  <TextField
                    label={t("map.resolutions")}
                    fullWidth
                    defaultValue={
                      map?.options?.resolutions ??
                      "2048, 1024, 512, 256, 128, 64, 32, 16, 8"
                    }
                    {...register("options.resolutions")}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 10 }}>
                  <TextField
                    label={t("map.printResolutions")}
                    fullWidth
                    defaultValue={map?.options?.printResolutions ?? ""}
                    {...register("options.printResolutions")}
                  />
                </Grid>
              </Grid>
            </FormPanel>

            <FormAccordion title={t("map.extraSettings")}>
              <Grid container>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(
                            map?.options?.constrainResolution
                          )}
                          {...register("options.constrainResolution")}
                        />
                      }
                      label={t("map.constrainResolution")}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(
                            map?.options?.constrainOnlyCenter
                          )}
                          {...register("options.constrainOnlyCenter")}
                        />
                      }
                      label={t("map.constrainOnlyCenter")}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(
                            map?.options?.constrainResolutionMobile
                          )}
                          {...register("options.constrainResolutionMobile")}
                        />
                      }
                      label={t("map.constrainResolutionMobile")}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(
                            map?.options?.enableDownloadLink
                          )}
                          {...register("options.enableDownloadLink")}
                        />
                      }
                      label={t("map.enableDownloadLink")}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(
                            map?.options?.enableAppStateInHash
                          )}
                          {...register("options.enableAppStateInHash")}
                        />
                      }
                      label={t("map.enableAppStateInHash")}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(
                            map?.options?.confirmOnWindowClose
                          )}
                          {...register("options.confirmOnWindowClose")}
                        />
                      }
                      label={t("map.confirmOnWindowClose")}
                    />
                  </FormGroup>
                </Grid>
                <Grid size={{ xs: 12, md: 10 }}>
                  <TextField
                    label={t("map.logoLight")}
                    fullWidth
                    defaultValue={map?.options?.logoLight ?? "/logoLight.png"}
                    {...register("options.logoLight")}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 10 }}>
                  <TextField
                    label={t("map.logoDark")}
                    fullWidth
                    defaultValue={map?.options?.logoDark ?? ""}
                    {...register("options.logoDark")}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 10 }}>
                  <TextField
                    label={t("map.legendOptions")}
                    fullWidth
                    defaultValue={map?.options?.legendOptions ?? ""}
                    {...register("options.legendOptions")}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 10 }}>
                  <TextField
                    label={t("map.crossOrigin")}
                    fullWidth
                    defaultValue={map?.options?.crossOrigin ?? "anonymous"}
                    {...register("options.crossOrigin")}
                  />
                </Grid>
              </Grid>
            </FormAccordion>

            <FormAccordion title={t("map.extraMapControls")}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(map?.options?.mapselector)}
                          {...register("options.mapselector")}
                        />
                      }
                      label={t("map.mapselector")}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(map?.options?.mapcleaner)}
                          {...register("options.mapcleaner")}
                        />
                      }
                      label={t("map.mapcleaner")}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(map?.options?.mapresetter)}
                          {...register("options.mapresetter")}
                        />
                      }
                      label={t("map.mapresetter")}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(
                            map?.options?.showThemeToggler
                          )}
                          {...register("options.showThemeToggler")}
                        />
                      }
                      label={t("map.showThemeToggler")}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(map?.options?.showUserAvatar)}
                          {...register("options.showUserAvatar")}
                        />
                      }
                      label={t("map.showUserAvatar")}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(
                            map?.options?.showRecentlyUsedPlugins
                          )}
                          {...register("options.showRecentlyUsedPlugins")}
                        />
                      }
                      label={t("map.showRecentlyUsedPlugins")}
                    />
                  </FormGroup>
                </Grid>
              </Grid>
            </FormAccordion>

            <FormAccordion title={t("map.interactions")}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(
                            map?.options?.altShiftDragRotate
                          )}
                          {...register("options.altShiftDragRotate")}
                        />
                      }
                      label={t("map.altShiftDragRotate")}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(map?.options?.onFocusOnly)}
                          {...register("options.onFocusOnly")}
                        />
                      }
                      label={t("map.onFocusOnly")}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(
                            map?.options?.doubleClickZoom
                          )}
                          {...register("options.doubleClickZoom")}
                        />
                      }
                      label={t("map.doubleClickZoom")}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(map?.options?.keyboard)}
                          {...register("options.keyboard")}
                        />
                      }
                      label={t("map.keyboard")}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(map?.options?.mouseWheelZoom)}
                          {...register("options.mouseWheelZoom")}
                        />
                      }
                      label={t("map.mouseWheelZoom")}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(map?.options?.shiftDragZoom)}
                          {...register("options.shiftDragZoom")}
                        />
                      }
                      label={t("map.shiftDragZoom")}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(map?.options?.dragPan)}
                          {...register("options.dragPan")}
                        />
                      }
                      label={t("map.dragPan")}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(map?.options?.pinchRotate)}
                          {...register("options.pinchRotate")}
                        />
                      }
                      label={t("map.pinchRotate")}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(map?.options?.pinchZoom)}
                          {...register("options.pinchZoom")}
                        />
                      }
                      label={t("map.pinchZoom")}
                    />
                  </FormGroup>
                </Grid>
                <Grid size={{ xs: 12, md: 10 }}>
                  <TextField
                    label={t("map.zoomLevelDelta")}
                    fullWidth
                    type="number"
                    defaultValue={map?.options?.zoomLevelDelta ?? ""}
                    {...register("options.zoomLevelDelta")}
                  />
                  <TextField
                    label={t("map.zoomAnimationDuration")}
                    fullWidth
                    type="number"
                    defaultValue={map?.options?.zoomAnimationDuration ?? ""}
                    {...register("options.zoomAnimationDuration")}
                  />
                </Grid>
              </Grid>
            </FormAccordion>

            <FormAccordion title={t("map.colors")}>
              <Grid container>
                <Grid size={{ xs: 12, md: 10 }}>
                  <FormControl fullWidth>
                    <InputLabel id="preferredColorScheme-label">
                      {t("map.preferredColorScheme")}
                    </InputLabel>
                    <Controller
                      name="options.preferredColorScheme"
                      control={control}
                      defaultValue={
                        map?.options?.preferredColorScheme ?? "user"
                      }
                      render={({ field }) => (
                        <Select
                          labelId="preferredColorScheme-label"
                          label={t("map.preferredColorScheme")}
                          {...field}
                        >
                          <MenuItem value="user">
                            {t("map.colorSchemeUser")}
                          </MenuItem>
                          <MenuItem value="light">
                            {t("map.colorSchemeLight")}
                          </MenuItem>
                          <MenuItem value="dark">
                            {t("map.colorSchemeDark")}
                          </MenuItem>
                        </Select>
                      )}
                    />
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 10 }}>
                  <TextField
                    label={t("map.primaryColor")}
                    fullWidth
                    defaultValue={map?.options?.primaryColor ?? "#333333"}
                    {...register("options.primaryColor")}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 10 }}>
                  <TextField
                    label={t("map.secondaryColor")}
                    fullWidth
                    defaultValue={map?.options?.secondaryColor ?? "#ffa000"}
                    {...register("options.secondaryColor")}
                  />
                </Grid>
              </Grid>
            </FormAccordion>

            <FormAccordion title={t("map.sidepanel")}>
              <Grid container>
                <FormGroup>
                  <Grid size={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(map?.options?.drawerStatic)}
                          {...register("options.drawerStatic")}
                        />
                      }
                      label={t("map.drawerStatic")}
                    />
                  </Grid>
                  <Grid size={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(map?.options?.drawerVisible)}
                          {...register("options.drawerVisible")}
                        />
                      }
                      label={t("map.drawerVisible")}
                    />
                  </Grid>
                  <Grid size={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(
                            map?.options?.drawerVisibleMobile
                          )}
                          {...register("options.drawerVisibleMobile")}
                        />
                      }
                      label={t("map.drawerVisibleMobile")}
                    />
                  </Grid>
                  <Grid size={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(
                            map?.options?.drawerPermanent
                          )}
                          {...register("options.drawerPermanent")}
                        />
                      }
                      label={t("map.drawerPermanent")}
                    />
                  </Grid>
                </FormGroup>
              </Grid>
              <Grid size={{ xs: 12, md: 10 }}>
                <TextField
                  label={t("map.drawerContent")}
                  fullWidth
                  defaultValue={map?.options?.drawerContent ?? "plugins"}
                  {...register("options.drawerContent")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 10 }}>
                <TextField
                  label={t("map.drawerTitle")}
                  fullWidth
                  defaultValue={map?.options?.drawerTitle ?? "Kartverktyg"}
                  {...register("options.drawerTitle")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 10 }}>
                <TextField
                  label={t("map.drawerButtonTitle")}
                  fullWidth
                  defaultValue={
                    map?.options?.drawerButtonTitle ?? "Kartverktyg"
                  }
                  {...register("options.drawerButtonTitle")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 10 }}>
                <FormControl fullWidth>
                  <InputLabel id="drawerButtonIcon-label">
                    {t("map.drawerButtonIcon")}
                  </InputLabel>
                  <Controller
                    name="options.drawerButtonIcon"
                    control={control}
                    defaultValue={map?.options?.drawerButtonIcon ?? "MapIcon"}
                    render={({ field }) => (
                      <Select
                        labelId="drawerButtonIcon-label"
                        label={t("map.drawerButtonIcon")}
                        {...field}
                      >
                        <MenuItem value="MapIcon">MapIcon</MenuItem>
                        <MenuItem value="MenuIcon">MenuIcon</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
            </FormAccordion>

            <FormAccordion title={t("map.cookies")}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(
                            map?.options?.showCookieNotice
                          )}
                          {...register("options.showCookieNotice")}
                        />
                      }
                      label={t("map.showCookieNotice")}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(
                            map?.options?.cookieUse3dPart
                          )}
                          {...register("options.cookieUse3dPart")}
                        />
                      }
                      label={t("map.cookieUse3dPart")}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(
                            map?.options?.showCookieNoticeButton
                          )}
                          {...register("options.showCookieNoticeButton")}
                        />
                      }
                      label={t("map.showCookieNoticeButton")}
                    />
                  </FormGroup>
                </Grid>
                <Grid size={{ xs: 12, md: 10 }}>
                  <TextField
                    label={t("map.cookieLink")}
                    fullWidth
                    defaultValue={
                      map?.options?.cookieLink ??
                      "https://pts.se/sv/bransch/regler/lagar/lag-om-elektronisk-kommunikation/kakor-cookies/"
                    }
                    {...register("options.cookieLink")}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 10 }}>
                  <TextField
                    label={t("map.cookieMessage")}
                    fullWidth
                    multiline
                    rows={3}
                    defaultValue={
                      map?.options?.cookieMessage ??
                      "Vi använder cookies för att följa upp användandet och ge en bra upplevelse av kartan. Du kan blockera cookies i webbläsaren men då visas detta meddelande igen."
                    }
                    {...register("options.cookieMessage")}
                  />
                </Grid>
              </Grid>
            </FormAccordion>

            <FormAccordion title={t("map.introGuide")}>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(
                            map?.options?.introductionEnabled
                          )}
                          {...register("options.introductionEnabled")}
                        />
                      }
                      label={t("map.introductionEnabled")}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          defaultChecked={Boolean(
                            map?.options?.introductionShowControlButton
                          )}
                          {...register("options.introductionShowControlButton")}
                        />
                      }
                      label={t("map.introductionShowControlButton")}
                    />
                  </FormGroup>
                </Grid>
                <Grid size={{ xs: 12, md: 10 }}>
                  <TextField
                    label={t("map.introductionSteps")}
                    fullWidth
                    multiline
                    rows={8}
                    defaultValue={map?.options?.introductionSteps ?? "[]"}
                    {...register("options.introductionSteps")}
                  />
                </Grid>
              </Grid>
            </FormAccordion>
          </FormContainer>
        )}

        {activeTab === "menu" && (
          <>
            <LayerSwitcherDnD
              layers={layers}
              dropZones={[
                {
                  id: "layers",
                  title: t("common.layers"),
                  items: backgroundLayersDZ,
                  onItemsChange: setBackgroundLayersDZ,
                },
              ]}
            />
            <LayerSwitcherDnD
              groups={groups}
              dropZones={[
                {
                  id: "groups",
                  title: t("common.layerGroups"),
                  items: groupLayersDZ,
                  onItemsChange: setGroupLayersDZ,
                },
              ]}
            />
          </>
        )}

        {activeTab === "tools" && (
          <ToolPlacementDnD
            tools={tools.map((tool) => ({ id: tool.id, name: tool.type }))}
            drawerItems={drawerDZ}
            onDrawerItemsChange={setDrawerDZ}
            widgetLeftItems={widgetLeftDZ}
            onWidgetLeftItemsChange={setWidgetLeftDZ}
            widgetRightItems={widgetRightDZ}
            onWidgetRightItemsChange={setWidgetRightDZ}
            controlButtonItems={controlDZ}
            onControlButtonItemsChange={setControlDZ}
            backgroundImage={backgroundImage}
          />
        )}
      </FormActionPanel>
    </Page>
  );
}
