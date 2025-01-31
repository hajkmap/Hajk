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
import { OpenInNew as OpenInNewIcon } from "@mui/icons-material";

export default function CustomForm() {
  const rootContainer = new DynamicFormContainer();

  const baseSettingsContainer = new DynamicFormContainer(
    "Grundinställningar för kartvisning",
    CONTAINER_TYPE.ACCORDION
  );
  rootContainer.addContainer(baseSettingsContainer);

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "projection",
    title: "Projektion",
    defaultValue: "EPSG:3007",
    gridColumns: 6,
    helpText:
      "Används som OpenLayers View 'projection'-parameter, ex 'EPSG:3008'",
  });

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.NUMBER,
    name: "startZoom",
    title: "Startzoom",
    defaultValue: 0,
    gridColumns: 2,
    helpText: "Används som OpenLayers View 'zoom'-parameter, ex '2'",
  });

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.NUMBER,
    name: "maxZoom",
    title: "Max-zoomnivå",
    defaultValue: 10,
    gridColumns: 2,
    helpText: "Används som OpenLayers View 'maxZoom'-parameter, ex '20'",
  });

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.NUMBER,
    name: "minZoom",
    title: "Min-zoomnivå",
    defaultValue: 0,
    gridColumns: 2,
    helpText: "Används som OpenLayers View 'minZoom'-parameter, ex '0'",
  });

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "centerCoordinate",
    title: "Centrumkoordinat",
    defaultValue: "172586,6340107",
    gridColumns: 6,
    helpText:
      "Används som OpenLayers View 'center'-parameter, ex '110600,6283796'",
  });

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "origin",
    title: "Origin",
    defaultValue: "150000,6315000",
    gridColumns: 6,
    helpText: "Används som OpenLayers View 'origin'-parameter, ex '0,0'",
  });

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "extent",
    title: "Extent",
    defaultValue: "150000,6315000,200000,6360000",
    gridColumns: 6,
    helpText: "Används som OpenLayers View 'extent'-parameter, ex '1,2,3,4'",
  });

  baseSettingsContainer.addStaticElement({
    type: STATIC_TYPE.SPACER,
    gridColumns: 6,
  });

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "resolutions",
    title: "Upplösningar",
    defaultValue: "84.0001,56,28,14,5.6,2.8,1.4,0.56,0.28,0.14,0.056",
    gridColumns: 6,
    helpText:
      "Används som OpenLayers View 'resolutions'-parameter, ex '4096,2048,1024,512'",
  });

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "printResolutions",
    title: "Upplösningar (Extra för utskrift)",
    defaultValue: "0.028",
    gridColumns: 6,
    helpText:
      "Extra upplösningar som läggs på befintliga upplösningar vid utskrift",
  });

  baseSettingsContainer.addStaticElement({
    type: STATIC_TYPE.DIVIDER,
  });

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "constrainOnlyCenter",
    title: "Lätta på extent",
    defaultValue: true,
    gridColumns: 6,
    helpText:
      "Styr ol.Views 'constrainOnlyCenter'-parameter. Om sant kommer endast centrumkoordinaten att begränsas till extent.",
  });

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "constrainResolution",
    title: "Lås zoom till satta upplösningar för datorer",
    defaultValue: true,
    gridColumns: 6,
    helpText:
      "Styr ol.Views 'constrainResolution'-parameter. Om sant kommer det endast gå att zooma mellan satta resolutions.",
  });

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "constrainResolutionMobile",
    title: "Lås zoom till satta upplösningar för mobiltelefoner",
    defaultValue: false,
    gridColumns: 6,
    helpText:
      "Styr ol.Views 'constrainResolution'-parameter. Om sant kommer det endast gå att zooma mellan satta resolutions.",
  });

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "enableDownloadLink",
    title: "Tillåt nedladdning av WMS-lager",
    defaultValue: false,
    gridColumns: 6,
    helpText:
      "Om aktivt kommer en nedladdningsknapp att visas bredvid varje lager i Lagerhanteraren.",
  });

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "enableAppStateInHash",
    title: "Beta: aktivera liveuppdatering av hashparametrar i URL-fältet",
    defaultValue: true,
    gridColumns: 6,
    helpText:
      "Kartans status hålls ständigt uppdaterad, som en del av URL:ens #-parametrar.",
  });

  baseSettingsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "confirmOnWindowClose",
    title: "Beta: fråga användaren om Hajk verkligen ska stängas",
    defaultValue: true,
    gridColumns: 6,
    helpText:
      "Om aktivt kommer en konfirmationsruta att visas om ändringar i Hajk finns (ex. pågående ritning eller mätning).",
  });

  const mapInteractionsContainer = new DynamicFormContainer(
    "Kartinteraktioner",
    CONTAINER_TYPE.ACCORDION
  );
  rootContainer.addContainer(mapInteractionsContainer);

  mapInteractionsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "altShiftDragRotate",
    title: "Whether Alt-Shift-drag rotate is desired",
    defaultValue: true,
    gridColumns: 6,
  });

  mapInteractionsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "onFocusOnly",
    title: "Interact only when the map has the focus",
    defaultValue: false,
    gridColumns: 6,
    helpText:
      "This affects the MouseWheelZoom and DragPan interactions and is useful when page scroll is desired for maps that do not have the browsers focus.",
  });

  mapInteractionsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "doubleClickZoom",
    title: "Whether double click zoom is desired",
    defaultValue: true,
    gridColumns: 6,
  });

  mapInteractionsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "keyboard",
    title: "Whether keyboard interaction is desired",
    defaultValue: true,
    gridColumns: 6,
  });

  mapInteractionsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "mouseWheelZoom",
    title: "Whether mousewheel zoom is desired",
    defaultValue: true,
    gridColumns: 6,
  });

  mapInteractionsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "shiftDragZoom",
    title: "Whether Shift-drag zoom is desired",
    defaultValue: true,
    gridColumns: 6,
  });

  mapInteractionsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "dragPan",
    title: "Whether drag pan is desired",
    defaultValue: true,
    gridColumns: 6,
  });

  mapInteractionsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "pinchRotate",
    title: "Whether pinch rotate is desired",
    defaultValue: true,
    gridColumns: 6,
  });

  mapInteractionsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "pinchZoom",
    title: "Whether pinch zoom is desired",
    defaultValue: true,
    gridColumns: 6,
  });

  mapInteractionsContainer.addStaticElement({
    type: STATIC_TYPE.DIVIDER,
  });

  mapInteractionsContainer.addInput({
    type: INPUT_TYPE.NUMBER,
    name: "zoomLevelDelta",
    title: "Zoom level delta when using keyboard or double click zoom",
    gridColumns: 6,
  });

  mapInteractionsContainer.addInput({
    type: INPUT_TYPE.NUMBER,
    name: "zoomAnimationDuration",
    title: "Duration of the zoom animation in milliseconds",
    gridColumns: 6,
  });

  const extraSettingsContainer = new DynamicFormContainer(
    "Extra inställningar",
    CONTAINER_TYPE.ACCORDION
  );
  rootContainer.addContainer(extraSettingsContainer);

  extraSettingsContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "logoLight",
    title: "Logo för ljust tema",
    defaultValue: "/assets/varbergs-kommun-logo.svg",
    gridColumns: 6,
    helpText:
      "Sökväg till logga att använda i <img>-taggen. Kan vara relativ Hajk-root eller absolut.",
  });

  extraSettingsContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "logoDark",
    title: "Logo för mörkt tema",
    defaultValue: "/assets/varbergs-kommun-logo-vit.svg",
    gridColumns: 6,
    helpText:
      "Sökväg till logga att använda i <img>-taggen. Kan vara relativ Hajk-root eller absolut.",
  });

  extraSettingsContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "legendOptions",
    title: "Legend options",
    defaultValue: "dummy:1&WIDTH=32&HEIGHT=32",
    gridColumns: 6,
    helpText:
      "Lägg till på legend requests. Exempel: 'dummy:1&WIDTH=32&HEIGHT=32'",
  });

  extraSettingsContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "crossOrigin",
    title: "Cross origin-parameter",
    defaultValue: "anonymous",
    gridColumns: 6,
    helpText:
      "Ställer in vilket värde som används för 'crossOrigin'. Om osäker, används 'anonymous'.",
  });

  const cookiesContainer = new DynamicFormContainer(
    "Cookies",
    CONTAINER_TYPE.ACCORDION
  );
  rootContainer.addContainer(cookiesContainer);

  cookiesContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "showCookieNotice",
    title: "Visa cookies-meddelande",
    defaultValue: true,
    gridColumns: 6,
    helpText:
      "Om aktivt kommer ett meddelande angående hantering av cookies visas för nya användare.",
  });

  cookiesContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "cookieUse3dPart",
    title: "Visa alternativ för 3:e part cookies",
    defaultValue: false,
    gridColumns: 6,
    helpText:
      "Om aktiv kommer en checkbox angående 3:e part cookies visas för nya användare.",
  });

  cookiesContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "showCookieNoticeButton",
    title: "Visa knapp för cookies-meddelande",
    defaultValue: true,
    gridColumns: 6,
    helpText:
      "Om aktivt kommer en knapp som visar cookies-meddelande att visas under zoom-knapparna.",
  });

  cookiesContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "cookieLink",
    title: "Cookies-länk",
    defaultValue: "/cookies",
    gridColumns: 6,
    helpText: "Valfri URL som öppnas med knappen 'Mer information'.",
  });

  cookiesContainer.addInput({
    type: INPUT_TYPE.TEXTAREA,
    name: "cookieMessage",
    title: "Cookies-meddelande",
    defaultValue:
      "Vi använder cookies för att följa upp användandet och ge en bra upplevelse av kartan.",
    gridColumns: 12,
    helpText: "Ange meddelande för cookies.",
  });

  const extraMapControlsContainer = new DynamicFormContainer(
    "Extra kontroller/knappar",
    CONTAINER_TYPE.ACCORDION
  );
  rootContainer.addContainer(extraMapControlsContainer);

  extraMapControlsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "mapselector",
    title: "Visa kartväljare",
    defaultValue: false,
    gridColumns: 6,
    helpText:
      "Om aktiv kommer en väljare med andra tillgängliga kartor att visas för användaren.",
  });

  extraMapControlsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "mapcleaner",
    title: "Visa knapp för att rensa kartan",
    defaultValue: true,
    gridColumns: 6,
    helpText:
      "Om aktiv kommer en väljare med andra tillgängliga kartor att visas för användaren.",
  });

  extraMapControlsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "mapresetter",
    title: "Visa en hemknapp som återställer kartans innehåll till startläge",
    defaultValue: false,
    gridColumns: 6,
    helpText:
      "Om aktiv kommer en hemknapp som återställer kartan att visas för användaren.",
  });

  extraMapControlsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "showThemeToggler",
    title: "Visa knapp för att byta mellan ljust och mörkt tema",
    defaultValue: true,
    gridColumns: 6,
    helpText: "Om aktiv kommer en knapp som möjliggör temaväxling att visas.",
  });

  extraMapControlsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "showUserAvatar",
    title: "Visa en knapp med användarens initialer intill zoomknapparna",
    defaultValue: false,
    gridColumns: 6,
    helpText:
      "Om AD-kopplingen är aktiv kommer en avatar-ikon bestående av användarens initialer att visas bland kartkontrollerna.",
  });

  extraMapControlsContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "showRecentlyUsedPlugins",
    title: "Visa en snabbväljare med de senast använda verktygen",
    defaultValue: false,
    gridColumns: 6,
    helpText:
      "En liten knapp som vid hover/touch visar de senast använda verktygen och låter användaren aktivera dessa.",
  });

  const introGuideContainer = new DynamicFormContainer(
    "Introduktionsguide",
    CONTAINER_TYPE.ACCORDION
  );
  rootContainer.addContainer(introGuideContainer);

  introGuideContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "introductionEnabled",
    title:
      "Starta introduktionsguiden automatiskt första gången användaren besöker kartan",
    defaultValue: false,
    gridColumns: 6,
    helpText:
      "Om aktivt kommer en introduktionsguide att visas för användaren vid första besöket.",
  });

  introGuideContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "introductionShowControlButton",
    title:
      "Visa en knapp i kartan som låter användaren att starta guiden manuellt",
    defaultValue: false,
    gridColumns: 6,
    helpText: "Om aktivt kommer en knapp att visas intill zoom-knapparna.",
  });

  introGuideContainer.addInput({
    type: INPUT_TYPE.TEXTAREA,
    name: "introductionSteps",
    title: "Steg som visas i introduktionsguiden",
    defaultValue: "[]",
    gridColumns: 12,
    inputProps: { rows: 8 },
    helpText:
      "JSON-objekt som specificerar vilka element som highlightas i introduktionsguiden. Kan lämnas tomt för att highlighta standardobjekt.",
  });

  introGuideContainer.addElement(
    <div>
      <Button
        size="small"
        href="https://github.com/HiDeoo/intro.js-react#step"
        target="_blank"
        startIcon={<OpenInNewIcon />}
      >
        Se exempel på hur man skapar steg.
      </Button>
    </div>,
    12
  );

  const sidepanelContainer = new DynamicFormContainer(
    "Sidopanel",
    CONTAINER_TYPE.ACCORDION
  );
  rootContainer.addContainer(sidepanelContainer);

  sidepanelContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "drawerStatic",
    title: "Låt sidopanelen vara permanent synlig och låst",
    defaultValue: false,
    gridColumns: 6,
    helpText: "Om aktiv kommer sidopanelen vara permanent synlig och låst.",
  });

  sidepanelContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "drawerVisible",
    title: "Starta med sidopanelen synlig",
    defaultValue: true,
    gridColumns: 6,
    helpText: "Om aktiv kommer sidopanelen att vara synlig när kartan laddat.",
  });

  sidepanelContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "drawerVisibleMobile",
    title: "Starta med sidopanelen synlig i mobilläge",
    defaultValue: false,
    gridColumns: 6,
    helpText:
      "Om aktiv kommer sidopanelen att vara öppen men inte låst vid skärmens kant vid start.",
  });

  sidepanelContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "drawerPermanent",
    title: "Låt sidopanelen vara låst vid start",
    defaultValue: true,
    gridColumns: 6,
    helpText:
      "Om aktiv kommer sidopanelen att vara låst vid skärmens kant vid start (gäller ej mobila enheter).",
  });

  sidepanelContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "drawerContent",
    title: "Aktiv drawer innehåll",
    defaultValue: "plugins",
    gridColumns: 6,
    helpText: "Styr vilket drawer-innehåll som ska vara aktivt vid start.",
  });

  sidepanelContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "drawerTitle",
    title: "Titel sidopanel",
    defaultValue: "Kartverktyg",
    gridColumns: 6,
    helpText: "Titel på verktygets panel som visas högst upp i sidopanelen.",
  });

  sidepanelContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    name: "drawerButtonTitle",
    title: "Titel aktiveringsknapp",
    defaultValue: "Kartverktyg",
    gridColumns: 6,
    helpText: "Text på knappen som öppnar verktyget.",
  });

  sidepanelContainer.addInput({
    type: INPUT_TYPE.RADIO,
    name: "drawerButtonIcon",
    title: "Ikon aktiveringsknapp",
    defaultValue: "MapIcon",
    gridColumns: 6,
    helpText:
      "Ikon på knappen som öppnar verktyget. Välj mellan fördefinierade alternativ.",
  });

  const mapColorContainer = new DynamicFormContainer(
    "Färger",
    CONTAINER_TYPE.ACCORDION
  );
  rootContainer.addContainer(mapColorContainer);

  mapColorContainer.addInput({
    type: INPUT_TYPE.SELECT,
    name: "preferredColorScheme",
    title: "Ljus/mörkt färgtema",
    defaultValue: "user",
    gridColumns: 6,
    optionList: [
      { title: "Låt användaren bestämma (default)", value: "user" },
      { title: "Ljust", value: "light" },
      { title: "Mörkt", value: "dark" },
    ],
    helpText: "Avgör om användarens preferenser gällande färgtema följs.",
  });

  mapColorContainer.addStaticElement({
    type: STATIC_TYPE.DIVIDER,
  });

  mapColorContainer.addInput({
    type: INPUT_TYPE.COLOR_PICKER,
    name: "primaryColor",
    title: "Huvudfärg",
    defaultValue: "#ff0000",
    gridColumns: 6,
  });

  mapColorContainer.addInput({
    type: INPUT_TYPE.COLOR_PICKER,
    name: "secondaryColor",
    title: "Komplementfärg",
    defaultValue: { r: 0, g: 255, b: 0, a: 1 },
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
    <Page title="Kartinställningar">
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
              Submit
            </Button>
          </Grid>
        </Grid>
      </form>
    </Page>
  );
}
