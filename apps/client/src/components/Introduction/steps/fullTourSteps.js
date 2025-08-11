import { getLayerSwitcherSteps } from "./layerSwitcherSteps";

// Initial steps for the full tour (before layer switcher)
const getInitialSteps = () => [
  {
    title: "Välkommen",
    intro:
      "Här kommer en kort guide som visar dig runt i applikationen. <br /><br />Följ med!",
  },
  {
    title: "Verktygspanel",
    element: "header > div:first-child",
    intro: "Med hjälp av knappen här uppe tar du fram verktygspanelen.",
  },
  {
    title: "Kartverktyg",
    element: "#drawer-content",
    intro: "Här hittar du olika verktyg för att interagera med kartan.",
  },
  {
    title: "Lås fast verktygspanelen",
    element: "#toggle-drawer-permanent",
    intro: "Klicka på knappen för att låsa fast verktygspanelen.",
  },
  {
    title: "Sökruta",
    element: ".MuiAutocomplete-inputRoot",
    intro:
      "Sökrutan hittar du här.<br /><br /> Med hjälp av sökverktyget hittar du enkelt till rätt plats i kartan.",
  },
  {
    title: "Fler sökalternativ",
    element: "#search-options-button",
    intro: "Under den här knappen hittar du fler avancerade sökalternativ.",
    position: "left",
  },
  {
    title: "Meny för fler sökverktyg",
    element: "#search-tools-menu",
    intro:
      "Här kan du välja mellan olika sökverktyg och inställningar för sökningen. <br><br> Du kan även öppna en separat meny för att hantera sökinställningar.",
    position: "left",
  },
  {
    title: "Kartkontroller",
    element: "#controls-column",
    intro:
      "Längst ut i den högra delen av skärmen finns olika kontroller som du använder för att navigera i kartan.",
  },
];

export const getFullIntroductionSteps = (layerSwitcherPlugin) => [
  ...getInitialSteps(),
  ...getLayerSwitcherSteps(layerSwitcherPlugin),
];
