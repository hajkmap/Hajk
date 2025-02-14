import DynamicFormContainer from "../../components/form-factory/dynamic-form-container";
import CONTAINER_TYPE from "../../components/form-factory/types/container-types";
import FormRenderer from "../../components/form-factory/form-renderer";
import { DefaultUseForm } from "../../components/form-factory/default-use-form";
import { createOnSubmitHandler } from "../../components/form-factory/form-utils";
import { Button, Grid2 as Grid } from "@mui/material";
import { useState } from "react";
import Page from "../../layouts/root/components/page";
import INPUT_TYPE from "../../components/form-factory/types/input-type";
import STATIC_TYPE from "../../components/form-factory/types/static-type";
import MapIcon from "@mui/icons-material/Map";
import MenuIcon from "@mui/icons-material/Menu";

import { useTranslation } from "react-i18next";

export default function CustomForm() {
  const { t } = useTranslation();

  const rootContainer = new DynamicFormContainer();

  const baseSettingsContainer = new DynamicFormContainer(
    t("map.baseSettings"),
    CONTAINER_TYPE.ACCORDION
  );
  rootContainer.addContainer(baseSettingsContainer);

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "projection",
    title: t("map.projection"),
    defaultValue: "EPSG:3006",
    gridColumns: 6,
    helpText: t("map.projectionHelp"),
  });

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.NUMBER,
    name: "startZoom",
    title: t("map.startZoom"),
    defaultValue: 1.33,
    gridColumns: 2,
    helpText: t("map.startZoomHelp"),
  });

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.NUMBER,
    name: "maxZoom",
    title: t("map.maxZoom"),
    defaultValue: 8,
    gridColumns: 2,
    helpText: t("map.maxZoomHelp"),
  });

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.NUMBER,
    name: "minZoom",
    title: t("map.minZoom"),
    defaultValue: 0,
    gridColumns: 2,
    helpText: t("map.minZoomHelp"),
  });

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "centerCoordinate",
    title: t("map.centerCoordinate"),
    defaultValue: "576357, 6386049",
    gridColumns: 6,
    helpText: t("map.centerCoordinateHelp"),
  });

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "origin",
    title: t("map.origin"),
    defaultValue: "0,0",
    gridColumns: 6,
    helpText: t("map.originHelp"),
  });

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "extent",
    title: t("map.extent"),
    defaultValue: "-1200000, 4700000, 2600000, 8500000",
    gridColumns: 6,
    helpText: t("map.extentHelp"),
  });

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "resolutions",
    title: t("map.resolutions"),
    defaultValue: "2048, 1024, 512, 256, 128, 64, 32, 16, 8",
    gridColumns: 6,
    helpText: t("map.resolutionsHelp"),
  });

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "printResolutions",
    title: t("map.printResolutions"),
    defaultValue: "",
    gridColumns: 6,
    helpText: t("map.printResolutionsHelp"),
  });

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "constrainOnlyCenter",
    title: t("map.constrainOnlyCenter"),
    defaultValue: false,
    gridColumns: 6,
    helpText: t("map.constrainOnlyCenterHelp"),
  });

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "constrainResolution",
    title: t("map.constrainResolution"),
    defaultValue: false,
    gridColumns: 6,
    helpText: t("map.constrainResolutionHelp"),
  });

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "constrainResolutionMobile",
    title: t("map.constrainResolutionMobile"),
    defaultValue: false,
    gridColumns: 6,
    helpText: t("map.constrainResolutionMobileHelp"),
  });

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "enableDownloadLink",
    title: t("map.enableDownloadLink"),
    defaultValue: false,
    gridColumns: 6,
    helpText: t("map.enableDownloadLinkHelp"),
  });

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "enableAppStateInHash",
    title: t("map.enableAppStateInHash"),
    defaultValue: true,
    gridColumns: 6,
    helpText: t("map.enableAppStateInHashHelp"),
  });

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "confirmOnWindowClose",
    title: t("map.confirmOnWindowClose"),
    defaultValue: true,
    gridColumns: 6,
    helpText: t("map.confirmOnWindowCloseHelp"),
  });

  const mapInteractionsContainer = new DynamicFormContainer(
    t("map.interactions"),
    CONTAINER_TYPE.ACCORDION
  );
  rootContainer.addContainer(mapInteractionsContainer);

  mapInteractionsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "altShiftDragRotate",
    title: t("map.altShiftDragRotate"),
    defaultValue: true,
    gridColumns: 6,
  });

  mapInteractionsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "onFocusOnly",
    title: t("map.onFocusOnly"),
    defaultValue: false,
    gridColumns: 6,
    helpText: t("map.onFocusOnlyHelp"),
  });

  mapInteractionsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "doubleClickZoom",
    title: t("map.doubleClickZoom"),
    defaultValue: true,
    gridColumns: 6,
  });

  mapInteractionsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "keyboard",
    title: t("map.keyboard"),
    defaultValue: true,
    gridColumns: 6,
  });

  mapInteractionsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "mouseWheelZoom",
    title: t("map.mouseWheelZoom"),
    defaultValue: true,
    gridColumns: 6,
  });

  mapInteractionsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "shiftDragZoom",
    title: t("map.shiftDragZoom"),
    defaultValue: true,
    gridColumns: 6,
  });

  mapInteractionsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "dragPan",
    title: t("map.dragPan"),
    defaultValue: true,
    gridColumns: 6,
  });

  mapInteractionsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "pinchRotate",
    title: t("map.pinchRotate"),
    defaultValue: true,
    gridColumns: 6,
  });

  mapInteractionsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "pinchZoom",
    title: t("map.pinchZoom"),
    defaultValue: true,
    gridColumns: 6,
  });

  mapInteractionsContainer.addStaticElement({
    type: STATIC_TYPE.DIVIDER,
  });

  mapInteractionsContainer.addInput({
    type: INPUT_TYPE.NUMBER,
    name: "zoomLevelDelta",
    title: t("map.zoomLevelDelta"),
    gridColumns: 6,
  });

  mapInteractionsContainer.addInput({
    type: INPUT_TYPE.NUMBER,
    name: "zoomAnimationDuration",
    title: t("map.zoomAnimationDuration"),
    gridColumns: 6,
  });

  const extraSettingsContainer = new DynamicFormContainer(
    t("map.extraSettings"),
    CONTAINER_TYPE.ACCORDION
  );
  rootContainer.addContainer(extraSettingsContainer);

  extraSettingsContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "logoLight",
    title: t("map.logoLight"),
    defaultValue: "/logoLight.png",
    gridColumns: 6,
    helpText: t("map.logoLightHelp"),
  });

  extraSettingsContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "logoDark",
    title: "",
    gridColumns: 6,
    helpText: t("map.logoDarkHelp"),
  });

  extraSettingsContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "legendOptions",
    title: t("map.legendOptions"),
    defaultValue: "",
    gridColumns: 6,
    helpText: t("map.legendOptionsHelp"),
  });

  extraSettingsContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "crossOrigin",
    title: t("map.crossOrigin"),
    defaultValue: "anonymous",
    gridColumns: 6,
    helpText: t("map.crossOriginHelp"),
  });

  const cookiesContainer = new DynamicFormContainer(
    t("map.cookies"),
    CONTAINER_TYPE.ACCORDION
  );
  rootContainer.addContainer(cookiesContainer);

  cookiesContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "showCookieNotice",
    title: t("map.showCookieNotice"),
    defaultValue: true,
    gridColumns: 6,
    helpText: t("map.showCookieNoticeHelp"),
  });

  cookiesContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "cookieUse3dPart",
    title: t("map.cookieUse3dPart"),
    defaultValue: false,
    gridColumns: 6,
    helpText: t("map.cookieUse3dPartHelp"),
  });

  cookiesContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "showCookieNoticeButton",
    title: t("map.showCookieNoticeButton"),
    defaultValue: true,
    gridColumns: 6,
    helpText: t("map.showCookieNoticeButtonHelp"),
  });

  cookiesContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "cookieLink",
    title: t("map.cookieLink"),
    defaultValue:
      "https://pts.se/sv/bransch/regler/lagar/lag-om-elektronisk-kommunikation/kakor-cookies/",
    gridColumns: 6,
    helpText: t("map.cookieLinkHelp"),
  });

  cookiesContainer.addInput({
    type: INPUT_TYPE.TEXTAREA,
    name: "cookieMessage",
    title: t("map.cookieMessage"),
    defaultValue:
      "Vi använder cookies för att följa upp användandet och ge en bra upplevelse av kartan. Du kan blockera cookies i webbläsaren men då visas detta meddelande igen.",
    gridColumns: 12,
    helpText: t("map.cookieMessageHelp"),
  });

  const extraMapControlsContainer = new DynamicFormContainer(
    t("map.extraMapControls"),
    CONTAINER_TYPE.ACCORDION
  );
  rootContainer.addContainer(extraMapControlsContainer);

  extraMapControlsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "mapselector",
    title: t("map.mapselector"),
    defaultValue: false,
    gridColumns: 6,
    helpText: t("map.mapselectorHelp"),
  });

  extraMapControlsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "mapcleaner",
    title: t("map.mapcleaner"),
    defaultValue: false,
    gridColumns: 6,
    helpText: t("map.mapcleanerHelp"),
  });

  extraMapControlsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "mapresetter",
    title: t("map.mapresetter"),
    defaultValue: false,
    gridColumns: 6,
    helpText: t("map.mapresetterHelp"),
  });

  extraMapControlsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "showThemeToggler",
    title: t("map.showThemeToggler"),
    defaultValue: true,
    gridColumns: 6,
    helpText: t("map.showThemeTogglerHelp"),
  });

  extraMapControlsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "showUserAvatar",
    title: t("map.showUserAvatar"),
    defaultValue: false,
    gridColumns: 6,
    helpText: t("map.showUserAvatarHelp"),
  });

  extraMapControlsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "showRecentlyUsedPlugins",
    title: t("map.showRecentlyUsedPlugins"),
    defaultValue: false,
    gridColumns: 6,
    helpText: t("map.showRecentlyUsedPluginsHelp"),
  });

  const introGuideContainer = new DynamicFormContainer(
    t("map.introGuide"),
    CONTAINER_TYPE.ACCORDION
  );
  rootContainer.addContainer(introGuideContainer);

  introGuideContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "introductionEnabled",
    title: t("map.introductionEnabled"),
    defaultValue: false,
    gridColumns: 6,
    helpText: t("map.introductionEnabledHelp"),
  });

  introGuideContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "introductionShowControlButton",
    title: t("map.introductionShowControlButton"),
    defaultValue: false,
    gridColumns: 6,
    helpText: t("map.introductionShowControlButtonHelp"),
  });

  introGuideContainer.addInput({
    type: INPUT_TYPE.TEXTAREA,
    name: "introductionSteps",
    title: t("map.introductionSteps"),
    defaultValue: "[]",
    gridColumns: 12,
    inputProps: { rows: 8 },
    helpText: t("map.introductionStepsHelp"),
  });

  const sidepanelContainer = new DynamicFormContainer(
    t("map.sidepanel"),
    CONTAINER_TYPE.ACCORDION
  );
  rootContainer.addContainer(sidepanelContainer);

  sidepanelContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "drawerStatic",
    title: t("map.drawerStatic"),
    defaultValue: false,
    gridColumns: 6,
    helpText: t("map.drawerStaticHelp"),
  });

  sidepanelContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "drawerVisible",
    title: t("map.drawerVisible"),
    defaultValue: true,
    gridColumns: 6,
    helpText: t("map.drawerVisibleHelp"),
  });

  sidepanelContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "drawerVisibleMobile",
    title: t("map.drawerVisibleMobile"),
    defaultValue: false,
    gridColumns: 6,
    helpText: t("map.drawerVisibleMobileHelp"),
  });

  sidepanelContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "drawerPermanent",
    title: t("map.drawerPermanent"),
    defaultValue: true,
    gridColumns: 6,
    helpText: t("map.drawerPermanentHelp"),
  });

  sidepanelContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "drawerContent",
    title: t("map.drawerContent"),
    defaultValue: "plugins",
    gridColumns: 6,
    helpText: t("map.drawerContentHelp"),
  });

  sidepanelContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "drawerTitle",
    title: t("map.drawerTitle"),
    defaultValue: "Kartverktyg",
    gridColumns: 6,
    helpText: t("map.drawerTitleHelp"),
  });

  sidepanelContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "drawerButtonTitle",
    title: t("map.drawerButtonTitle"),
    defaultValue: "Kartverktyg",
    gridColumns: 6,
    helpText: t("map.drawerButtonTitleHelp"),
  });

  sidepanelContainer.addInput({
    type: INPUT_TYPE.RADIO,
    name: "drawerButtonIcon",
    title: t("map.drawerButtonIcon"),
    defaultValue: "MapIcon",
    gridColumns: 6,
    helpText: t("map.drawerButtonIconHelp"),
    inputProps: {
      row: true,
    },
    optionList: [
      {
        title: <MapIcon style={{ verticalAlign: "middle" }} />,
        value: "MapIcon",
      },
      {
        title: <MenuIcon style={{ verticalAlign: "middle" }} />,
        value: "MenuIcon",
      },
    ],
  });

  const mapColorContainer = new DynamicFormContainer(
    t("map.colors"),
    CONTAINER_TYPE.ACCORDION
  );
  rootContainer.addContainer(mapColorContainer);

  mapColorContainer.addInput({
    type: INPUT_TYPE.SELECT,
    name: "preferredColorScheme",
    title: t("map.preferredColorScheme"),
    defaultValue: "user",
    gridColumns: 6,
    optionList: [
      { title: t("map.colorSchemeUser"), value: "user" },
      { title: t("map.colorSchemeLight"), value: "light" },
      { title: t("map.colorSchemeDark"), value: "dark" },
    ],
    helpText: t("map.preferredColorSchemeHelp"),
  });

  mapColorContainer.addStaticElement({
    type: STATIC_TYPE.DIVIDER,
  });

  mapColorContainer.addInput({
    type: INPUT_TYPE.COLOR_PICKER,
    name: "primaryColor",
    title: t("map.primaryColor"),
    defaultValue: "#333333",
    gridColumns: 6,
  });

  mapColorContainer.addInput({
    type: INPUT_TYPE.COLOR_PICKER,
    name: "secondaryColor",
    title: t("map.secondaryColor"),
    defaultValue: "#ffa000",
    gridColumns: 6,
  });

  const [formContainerData] = useState(rootContainer);
  const defaultValues = formContainerData.getDefaultValues();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, dirtyFields, isDirty },
    getValues,
  } = DefaultUseForm(defaultValues);

  const onSubmit = createOnSubmitHandler({
    handleSubmit,
    dirtyFields,
    onValid: (data, dirtyData) => {
      console.log("All Data: ", data);
      console.log("Dirty Data: ", dirtyData);
      console.log("Let's send some data to the server!!");
    },
    onInvalid: (errors) => {
      console.log("Errors: ", errors);
    },
  });

  return (
    <Page title={t("map.pageTitle")}>
      <form onSubmit={onSubmit}>
        <FormRenderer
          formControls={formContainerData}
          formGetValues={getValues}
          register={register}
          control={control}
          errors={errors}
        />
        <Grid container>
          <Grid sx={{ ml: "auto" }}>
            <Button type="submit" variant="contained" disabled={!isDirty}>
              {t("map.submitButton")}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Page>
  );
}
