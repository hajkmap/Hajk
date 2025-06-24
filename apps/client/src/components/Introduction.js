import React, { createRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Steps } from "intro.js-react";
import { useTheme } from "@mui/material/styles";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import PluginControlButton from "../components/PluginControlButton";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
} from "@mui/material";

import "intro.js/introjs.css";
import "intro.js/themes/introjs-modern.css";

import { functionalOk as functionalCookieOk } from "../models/Cookie";
import LocalStorageHelper from "utils/LocalStorageHelper";

const IntroSelectionScreen = ({ onSelect, onClose, layerSwitcherPlugin }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const currentLsSettings = LocalStorageHelper.get("layerswitcher");

  /*
  useEffect(() => {
    // Set state from localstorage on component load
    const currentLsSettings = LocalStorageHelper.get("layerswitcher");
    if (currentLsSettings.savedLayers?.length > 0) {
      setHandleFavorites(currentLsSettings.savedLayers);
    }
  }, [setHandleFavorites]);
*/
  console.log("handleFavorites", currentLsSettings.savedLayers?.length > 0);

  const handleClose = (_, reason) => {
    if (reason === "backdropClick" || reason === "escapeKeyDown") {
      // Prevent closing if the reason is a backdrop click or escape key press
      return;
    }

    if (functionalCookieOk()) {
      window.localStorage.setItem("introductionShown", 1);
    }
    onClose();
  };

  return (
    <Dialog
      open={true}
      onClose={handleClose}
      PaperProps={{
        sx: {
          ...(isDarkMode
            ? {
                // Modern theme (dark mode)
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                color: "#fff",
                "& .MuiDialogTitle-root": {
                  color: "#fff",
                  textAlign: "center",
                },
                "& .MuiButton-root": {
                  color: "#fff",
                  border: "1px solid #000",
                  borderRadius: "50px",
                  "&:hover": {
                    border: "1px solid #000",
                    backgroundColor: "transparent",
                  },
                },
                "& .MuiButton-contained": {
                  backgroundColor: "transparent",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                },
                "& .MuiDialogActions-root .MuiButton-root": {
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                },
              }
            : {
                // Flattener theme (light mode)
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                color: "#000",
                "& .MuiDialogTitle-root": {
                  color: "#000",
                  textAlign: "center",
                },
                "& .MuiButton-root": {
                  color: "#000",
                  border: "1px solid #000",
                  borderRadius: "50px",
                  "&:hover": {
                    border: "1px solid #fff",
                    backgroundColor: "transparent",
                  },
                },
                "& .MuiButton-contained": {
                  backgroundColor: "transparent",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.1)",
                  },
                },
                "& .MuiDialogActions-root .MuiButton-root": {
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.1)",
                  },
                },
              }),
        },
      }}
    >
      <DialogTitle sx={{ textAlign: "center", textDecoration: "underline" }}>
        Välj introduktion
      </DialogTitle>
      <DialogContent>
        <Button
          variant="contained"
          fullWidth
          onClick={() => onSelect("full")}
          sx={{
            mt: 2,
            mb: 1,
            height: "40px",
          }}
        >
          Hela introduktionen
        </Button>

        <Box component="span" sx={{ display: "inline-block", width: "100%" }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => onSelect("half")}
            sx={{
              mb: 1,
              height: "40px",
            }}
          >
            {layerSwitcherPlugin.options.title
              ? "Nytt i " + layerSwitcherPlugin.options.title
              : " Nytt i Visa"}
          </Button>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 1 }}>
        <Button onClick={handleClose}>Avbryt</Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * @summary Renders a guide that introduces new users to features present in Hajk.
 * @description The introduction will only be rendered once. This is achieved by setting
 * a flag in the browser's local storage.
 *
 * @returns React.Component
 */
class Introduction extends React.PureComponent {
  state = {
    forceShow: false, // Used to force showing the Intro, overrides the LocalStorage value
    initialStep: 0,
    stepsEnabled: true,
    steps: [],
    showSelection: false,
    currentStepIndex: 0,
    typingInterval: null,
    layerSwitcherPlugin: null,
  };

  predefinedSteps = [
    {
      title: "Välkommen",
      intro:
        "Här kommer en kort guide som visar dig runt i applikationen. <br /><br />Häng med!",
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
        "Sökrutan hittar du här.<br /><br /> Med hjälp av sökverktyget hittar du enkelt till rätt ställe i kartan.",
    },
    {
      title: "Fler sökverktyg",
      element: '[name="searchOptions"]',
      intro: "Under den här knappen hittar du fler avancerade sökalternativ.",
    },
    {
      title: "Kartkontroller",
      element: "#controls-column",
      intro:
        "Längst ut i den högra delen av skärmen finns olika kontroller som du använder för att navigera i kartan.",
    },
    {
      title: "Lagerlista",
      element: "#layerslist-container",
      intro:
        "Här finns lagerlistan där du kan se alla lager som är tillgängliga i kartan. <br><br> Du kan söka efter lager, tända/släcka lager och se information om varje lager.",
    },
    {
      title: "Sök lager",
      element: "#layer-list-filter",
      intro:
        "Mata in text för att söka efter lager. <br><br> Sökresultat visas i lagerlistan nedan.",
      position: () =>
        this.layerSwitcherPlugin.options.position === "right"
          ? "left"
          : "right",
    },
    {
      title: "Öppna meny bredvid sökfält",
      element: "#layerswitcher-actions-menu",
      intro:
        "Klicka på kebabmenyn. <br><br> Menyn innehåller funktioner som: dölj alla aktiva lager, scrolla till toppen av lagerlistan, scrolla till botten av lagerlistan.",
      position: () =>
        this.layerSwitcherPlugin.options.position === "right"
          ? "left"
          : "right",
    },
    {
      title: "Sök meny",
      element: "#layerswitcher-actions-menu-content",
      intro:
        "<b>Dölj alla aktiva lager:</b> Klicka på knappen för att dölja <b>ALLA</b> aktiva lager. <br><br> <b>Scrolla till toppen:</b> Klicka på knappen för att scrolla till toppen av lagerlistan. <br><br> <b>Scrolla till botten:</b> Klicka på knappen för att scrolla till botten av lagerlistan.",
    },
    {
      title: "Lagergrupp",
      element: "#layerGroup-accordion-arrow-button",
      intro:
        "Pil indikerar lagergrupp. Klicka för att se underliggande lager. <br/><br/> Notera att lagergruppnamns med <b>fetstil</b> innehåller tända lager.",
    },
    {
      title: "Tänd lager",
      element: "#toggle-layer-item",
      intro:
        "Klicka för att tända/släcka lager. Lagernamn med <b>fetsil</b> visar att lagret är tänt.",
      position: () =>
        this.layerSwitcherPlugin.options.position === "right"
          ? "left"
          : "bottom",
    },
    {
      title: "Lagerinformation",
      element: "#show-layer-details",
      intro: "Klicka för att se mer information om ett lager.",
    },
    {
      title: "Teckenförklaring",
      element: "#toggle-legend-icon",
      intro: "Knappen visar teckenförklaring.",
    },
    {
      title: "Lagerinformations vy",
      element: "#layer-item-details-info",
      intro: "Här visas eventuell information om ett lager.",
    },
    {
      title: "Opacitet",
      element: "#layer-details-opacity-slider",
      intro: "Reglage för att ändra opacitet för ett lager.",
    },
    {
      title: "Lägg till/ta bort lager i snabbåtkomst",
      element: "#layer-details-quick-access-button",
      intro:
        "Knappen lägger till/tar bort ett lager från snabbåtkomst menyn i lagervyn.",
    },
    {
      title: "Flikar i lagerhanteraren",
      element: "#layer-switcher-tab-panel",
      intro: () =>
        `Klicka här för att växla mellan olika vyer: <br><br> - Kartlager <br> - Bakgrund <br>${this.layerSwitcherPlugin.options.showDrawOrderView ? "- Ritordning: Här kan du ändra ritordning på tända lager i kartan" : ""}`,
    },
    {
      title: "Ritordning",
      element: "#draw-order-tab",
      intro:
        "Klicka på Ritordnings-fliken för att se och ändra ritordningen för lagren.",
      position: () =>
        this.layerSwitcherPlugin.options.position === "right"
          ? "left"
          : "right",
    },
    {
      title: "Aktivera systemlager",
      element: "#draw-order-switch",
      intro:
        "Klicka för att visa systemlager i lagerlistan och ändra ritordning av lager genererade av verktyg.",
    },
    {
      title: "Lista över systemlager",
      element: ".draw-order-list",
      intro:
        "Här kan du se och ändra ritordningen för systemlager. <br><br> Dra och släpp lager för att ändra ritordningen.",
    },
    {
      title: "Snabbåtkomst",
      element: "#quick-access-view",
      intro: "Lista och menyer för åtkomst och underhåll av sparade lager.",
    },
    {
      title: "Snabbåtkomst meny",
      element: "#quick-access-menu-button",
      intro:
        "Klicka på kebabmenyn i snabbåtkomst.<br><br> Menyn innehåller funktioner som: <br> - Lägg till tända lager <br> - Rensa allt",
    },
    {
      title: "Fler val",
      element: "#quick-access-menu-content",
      intro:
        "Lägg till tända lager: Klicka för att lägga till alla tända lager i snabbåtkomst. <br><br> Rensa allt: Klicka för att rensa alla lager i snabbåtkomst.",
    },
    {
      title: "Mina favoriter",
      element: "#favorites-menu-button",
      intro:
        "Klicka på favoriter-knappen. <br><br> Menyn innehåller funktioner som att spara till favoriter, redigera favoriter och ladda favoriter.",
    },
    {
      title: "Mina favoriter meny",
      element: "#favorites-menu",
      intro:
        "Knappen öppnar en meny med verktyg för att gruppera och spara lager i snabbåtkomst (mina favoriter): <br><br> - <b>Spara till favoriter:</b> Sparar en grupp som innehåller ett eller flera lager. Titel och beskrivning av denna grupp kan tillämpas, <i>observera att favoriter endast sparas tillfälligt och lokalt för dig</i>. <br><br> - <b>Redigera favoriter:</b> Hantera sparade lager. <br><br> - <b>Ladda favorit:</b> Vid laddning ersätts lagren i snabbåtkomst. Alla tända lager i kartan släcks och ersätts med favoritens tända lager.",
    },
    {
      title: "Redigera favoriter",
      element: "#edit-favorites",
      intro: "Knappen öppnar en separat vy för att hantera sparade favoriter.",
    },
    {
      title: "Importera favoriter",
      element: "#import-favorites-button",
      intro: "Klicka för att importera favoriter från en .json-fil.",
    },
    {
      title: "Lista över favoriter",
      element: ".favorites-list-view",
      intro:
        "Här kan du se och hantera dina sparade favoriter. Klicka för att skriva över befintliga lager med favoriterna.",
    },
    {
      title: "Favoriter flerval",
      element: "#favorites-list-options-button",
      intro:
        "Klicka på kebabmenyn i favoriter-listan. <br><br> Menyn innehåller funtioner som t.ex: information om favoriten, redigera favoriten, ta bort favoriten och exportera favoriten som en .json fil.",
    },
    {
      title: "Favoriter flerval meny",
      element: "#favorites-list-options-menu",
      intro:
        "<b> - Redigera:</b> Redigera titel och beskrivning för favoriter <br><br> <b> - Ta bort:</b> Tar bort favoriten från listan <br><br> <b> - Exportera:</b> Exporterar favoriten som en .json fil",
    },
    {
      title: "Slut",
      intro: "Detta är slutet.",
    },
  ];

  predefinedStepsTwo = [
    {
      title: "Hajk 4",
      intro:
        "Detta är en introduktion till Hajk 4, främst för att visa hur den nya lagerhanteraren fungerar. <br><br> Observera att du inte kan utföra några åtgärder som att klicka på knappar under introduktionen, detta är enbart för att illustrera hur den nya lagerhanteraren fungerar.",
    },
    {
      title: "Lagerlista",
      element: "#layerslist-container",
      intro:
        "Här finns lagerlistan där du kan se alla lager som är tillgängliga i kartan. <br><br> Du kan söka efter lager, tända/släcka lager och se information om varje lager.",
    },
    {
      title: "Sök lager",
      element: "#layer-list-filter",
      intro:
        "Mata in text för att söka efter lager. <br><br> Sökresultat visas i lagerlistan nedan.",
      position: () =>
        this.layerSwitcherPlugin.options.position === "right"
          ? "left"
          : "right",
    },
    {
      title: "Öppna meny bredvid sökfält",
      element: "#layerswitcher-actions-menu",
      intro:
        "Klicka på kebabmenyn. <br><br> Menyn innehåller funktioner som: dölj alla aktiva lager, scrolla till toppen av lagerlistan, scrolla till botten av lagerlistan.",
      position: () =>
        this.layerSwitcherPlugin.options.position === "right"
          ? "left"
          : "right",
    },
    {
      title: "Sök meny",
      element: "#layerswitcher-actions-menu-content",
      intro:
        "<b>Dölj alla aktiva lager:</b> Klicka på knappen för att dölja <b>ALLA</b> aktiva lager. <br><br> <b>Scrolla till toppen:</b> Klicka på knappen för att scrolla till toppen av lagerlistan. <br><br> <b>Scrolla till botten:</b> Klicka på knappen för att scrolla till botten av lagerlistan.",
    },
    {
      title: "Lagergrupp",
      element: "#layerGroup-accordion-arrow-button",
      intro:
        "Pil indikerar lagergrupp. Klicka för att se underliggande lager. <br/><br/> Notera att lagergruppnamns med <b>fetstil</b> innehåller tända lager.",
    },
    {
      title: "Tänd lager",
      element: "#toggle-layer-item",
      intro:
        "Klicka för att tända/släcka lager. Lagernamn med <b>fetsil</b> visar att lagret är tänt.",
      position: () =>
        this.layerSwitcherPlugin.options.position === "right"
          ? "left"
          : "bottom",
    },
    {
      title: "Lagerinformation",
      element: "#show-layer-details",
      intro: "Klicka för att se mer information om ett lager.",
    },
    {
      title: "Teckenförklaring",
      element: "#toggle-legend-icon",
      intro: "Knappen visar teckenförklaring.",
    },
    {
      title: "Lagerinformations vy",
      element: "#layer-item-details-info",
      intro: "Här visas eventuell information om ett lager.",
    },
    {
      title: "Opacitet",
      element: "#layer-details-opacity-slider",
      intro: "Reglage för att ändra opacitet för ett lager.",
    },
    {
      title: "Lägg till/ta bort lager i snabbåtkomst",
      element: "#layer-details-quick-access-button",
      intro:
        "Knappen lägger till/tar bort ett lager från snabbåtkomst menyn i lagervyn.",
    },
    {
      title: "Flikar i lagerhanteraren",
      element: "#layer-switcher-tab-panel",
      intro: () =>
        `Klicka här för att växla mellan olika vyer: <br><br> - Kartlager <br> - Bakgrund <br>${this.layerSwitcherPlugin.options.showDrawOrderView ? "- Ritordning: Här kan du ändra ritordning på tända lager i kartan" : ""}`,
    },
    {
      title: "Ritordning",
      element: "#draw-order-tab",
      intro:
        "Klicka på Ritordnings-fliken för att se och ändra ritordningen för lagren.",
      position: () =>
        this.layerSwitcherPlugin.options.position === "right"
          ? "left"
          : "right",
    },
    {
      title: "Aktivera systemlager",
      element: "#draw-order-switch",
      intro:
        "Klicka för att visa systemlager i lagerlistan och ändra ritordning av lager genererade av verktyg.",
    },
    {
      title: "Lista över systemlager",
      element: ".draw-order-list",
      intro:
        "Här kan du se och ändra ritordningen för systemlager. <br><br> Dra och släpp lager för att ändra ritordningen.",
    },
    {
      title: "Snabbåtkomst",
      element: "#quick-access-view",
      intro: "Lista och menyer för åtkomst och underhåll av sparade lager.",
    },
    {
      title: "Snabbåtkomst meny",
      element: "#quick-access-menu-button",
      intro:
        "Klicka på kebabmenyn i snabbåtkomst.<br><br> Menyn innehåller funktioner som: <br> - Lägg till tända lager <br> - Rensa allt",
    },
    {
      title: "Fler val",
      element: "#quick-access-menu-content",
      intro:
        "Lägg till tända lager: Klicka för att lägga till alla tända lager i snabbåtkomst. <br><br> Rensa allt: Klicka för att rensa alla lager i snabbåtkomst.",
    },
    {
      title: "Mina favoriter",
      element: "#favorites-menu-button",
      intro:
        "Klicka på favoriter-knappen. <br><br> Menyn innehåller funktioner som att spara till favoriter, redigera favoriter och ladda favoriter.",
    },
    {
      title: "Mina favoriter meny",
      element: "#favorites-menu",
      intro:
        "Knappen öppnar en meny med verktyg för att gruppera och spara lager i snabbåtkomst (mina favoriter): <br><br> - <b>Spara till favoriter:</b> Sparar en grupp som innehåller ett eller flera lager. Titel och beskrivning av denna grupp kan tillämpas, <i>observera att favoriter endast sparas tillfälligt och lokalt för dig</i>. <br><br> - <b>Redigera favoriter:</b> Hantera sparade lager. <br><br> - <b>Ladda favorit:</b> Vid laddning ersätts lagren i snabbåtkomst. Alla tända lager i kartan släcks och ersätts med favoritens tända lager.",
    },
    {
      title: "Redigera favoriter",
      element: "#edit-favorites",
      intro: "Knappen öppnar en separat vy för att hantera sparade favoriter.",
    },
    {
      title: "Importera favoriter",
      element: "#import-favorites-button",
      intro: "Klicka för att importera favoriter från en .json-fil.",
    },
    {
      title: "Lista över favoriter",
      element: ".favorites-list-view",
      intro:
        "Här kan du se och hantera dina sparade favoriter. Klicka för att skriva över befintliga lager med favoriterna.",
    },
    {
      title: "Favoriter flerval",
      element: "#favorites-list-options-button",
      intro:
        "Klicka på kebabmenyn i favoriter-listan. <br><br> Menyn innehåller funtioner som t.ex: information om favoriten, redigera favoriten, ta bort favoriten och exportera favoriten som en .json fil.",
    },
    {
      title: "Favoriter flerval meny",
      element: "#favorites-list-options-menu",
      intro:
        "<b> - Redigera:</b> Redigera titel och beskrivning för favoriter <br><br> <b> - Ta bort:</b> Tar bort favoriten från listan <br><br> <b> - Exportera:</b> Exporterar favoriten som en .json fil",
    },
    {
      title: "Slut",
      intro: "Detta är slutet.",
    },
  ];

  constructor(props) {
    super(props);
    this.stepsRef = createRef();
    this.layerSwitcherPlugin = this.props.layerSwitcherPlugin;
    this.showDrawOrderView =
      this.props.layerSwitcherPlugin.options.showDrawOrderView;
    this.appModel = this.props.appModel;
    console.log(
      "enableQuickAccessPresets",
      this.props.layerSwitcherPlugin.options.enableQuickAccessPresets
    );
    console.log(
      "enableUserQuickAccessFavorites",
      this.props.layerSwitcherPlugin.options.enableUserQuickAccessFavorites
    );
    console.log("this.appModel", this.appModel);
    /**
     * When appLoaded is fired, let's filter through the provided 'steps'.
     * We must remove any steps that don't have corresponding DOM elements.
     * Otherwise, we would show intro steps even for non-existing elements,
     * which wouldn't be nice.
     */
    this.props.globalObserver.subscribe("core.appLoaded", () => {
      // Allow a short wait so that everything renders first
      setTimeout(() => {
        // First check if we have any steps in our config
        const { introductionSteps = [] } = this.props;
        // We must have at least 2 elements in the array in order to properly show intro guide
        const steps =
          introductionSteps.length >= 2
            ? this.#tryParsingSteps(introductionSteps)
            : this.predefinedSteps;

        const filteredSteps = steps.filter((s) => {
          return (
            s.element === undefined ||
            document.querySelector(s?.element) !== null
          );
        });
        this.setState({ steps: filteredSteps });

        // Show selection screen if introduction hasn't been shown before
        if (parseInt(window.localStorage.getItem("introductionShown")) !== 1) {
          this.setState({ showSelection: true });
        }
      }, 100);
    });

    this.props.globalObserver.subscribe(
      "core.showIntroduction",
      this.showIntroduction
    );
  }

  #tryParsingSteps(steps) {
    try {
      for (const step of steps) {
        if (!step?.title || !step?.intro) {
          throw Error(
            "Introduction steps missing necessary properties. Please ensure that each step contains at least the 'title' and 'intro' property."
          );
        }
      }
      return steps;
    } catch (error) {
      console.error(error.message);
      return this.predefinedSteps;
    }
  }

  showIntroduction() {
    this.setState({
      initialStep: 0,
      stepsEnabled: true,
      forceShow: true,
      showSelection: true,
    });
  }

  handleIntroSelection = (type) => {
    this.props.globalObserver.publish("layerswitcher.showWindow");

    this.setState({
      showSelection: false,
    });

    const isDrawOrderView = this.showDrawOrderView;

    let steps =
      type === "full" ? this.predefinedSteps : this.predefinedStepsTwo;

    if (!isDrawOrderView) {
      steps = steps.filter((step) => step.title !== "Ritordning");
    }

    this.setState({
      steps: steps,
      forceShow: true,
      stepsEnabled: true,
    });
  };

  handleSelectionClose = () => {
    this.setState({
      showSelection: false,
      forceShow: false,
      stepsEnabled: false,
    });
  };

  disableSteps = () => {
    // Clear any existing typing interval
    if (this.state.typingInterval) {
      clearInterval(this.state.typingInterval);
      this.setState({ typingInterval: null });

      // Clear the search field
      const searchField = document.querySelector("#layer-list-filter input");
      if (searchField) {
        searchField.value = "";
        searchField.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }

    // Upon completion/closing, set a flag that won't show this guide again.
    // Remember that the user must allow for functional cookies for this to be possible.
    // If the user has chosen to allow only the required cookies, the introduction will
    // show on every page load.
    if (functionalCookieOk()) {
      window.localStorage.setItem("introductionShown", 1);
    }

    // Reset the state
    this.setState({
      forceShow: false,
      initialStep: 0,
      showSelection: false,
    });
  };

  // Render a control button that allows the user to invoke the guide on demand
  renderControlButton() {
    return createPortal(
      <PluginControlButton
        icon={<AutoStoriesIcon />}
        onClick={() => {
          this.showIntroduction();
        }}
        title="Introduktionsguide"
        abstract="Öppna guidad tour"
      />,
      document.getElementById("plugin-control-buttons")
    );
  }

  handleDrawerTransition = (previousStep, currentStep) => {
    // Open drawer transitions
    if (
      (previousStep?.title === "Verktygspanel" &&
        currentStep?.title === "Kartverktyg") ||
      (previousStep?.title === "Kartverktyg" &&
        currentStep?.title === "Lås fast verktygspanelen")
    ) {
      this.props.globalObserver.publish("core.drawerContentChanged", "plugins");
      return true;
    }

    // Close drawer transitions
    if (
      (previousStep?.title === "Välkommen" &&
        currentStep?.title === "Verktygspanel") ||
      (previousStep?.title === "Lås fast verktygspanelen" &&
        currentStep?.title === "Sökruta")
    ) {
      this.props.globalObserver.publish("core.hideDrawer");
      return true;
    }

    return false;
  };

  handleMenuContentTransition = (step) => {
    if (step?.element === "#layerswitcher-actions-menu-content") {
      const menuButton = document.querySelector("#layerswitcher-actions-menu");
      if (menuButton) {
        menuButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      }
      return true;
    }
    return false;
  };

  handleQuickAccessMenuTransition = (step) => {
    if (step?.element === "#quick-access-menu-content") {
      const menuButton = document.querySelector("#quick-access-menu-button");
      if (menuButton) {
        menuButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      }
      return true;
    }
    return false;
  };

  handleCustomEvents = (step) => {
    if (
      step?.title === "Lagergrupp" ||
      step?.title === "Tänd lager" ||
      step?.title === "Lagerinformation" ||
      step?.title === "Lagerinformations vy" ||
      step?.title === "Opacitet" ||
      step?.title === "Snabbåtkomst" ||
      step?.title === "Lägg till/ta bort lager i snabbåtkomst" ||
      step?.title === "Redigera favoriter"
    ) {
      document.dispatchEvent(new CustomEvent("expandFirstGroup"));
      return true;
    }

    return false;
  };

  handleFavoritesMenuTransition = (step) => {
    // Handle going forward to "Mina favoriter meny" (element #favorites-menu)
    if (
      step?.element === "#favorites-menu" ||
      step?.element === "#edit-favorites"
    ) {
      const menuButton = document.querySelector("#favorites-menu-button");

      if (menuButton) {
        menuButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      }
      return true;
    }

    return false;
  };

  handleFavoritesListMenuTransition = (step) => {
    if (step?.element === "#favorites-list-options-menu") {
      const menuButton = document.querySelector(
        "#favorites-list-options-button"
      );

      if (menuButton) {
        menuButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      }
      return true;
    }

    return false;
  };

  /* Runs before the step UI changes, and must return a promise so that we can delay transititions, perform asynchronous operations
   (e.g. open menus, etc.)
   Waiting for a drawer/menu to render before moving to the next step
  Dynamically adjusting UI or DOM before intro.js highlights the next element
  Preventing race conditions between transitions and UI updates
  */
  handleBeforeStepChange = (nextIndex) => {
    return new Promise((resolve) => {
      const step = this.state.steps[nextIndex];
      const previousStep = this.state.steps[nextIndex - 1];
      const nextStep = this.state.steps[nextIndex + 1];
      const currentIndex = this.state.currentStepIndex;

      const goingBackward = nextIndex < currentIndex;
      const goingForward = nextIndex > currentIndex;
      let didWaitForFavoritesBack = false;

      // Helper function to handle element updates
      const updateStepElement = () => {
        if (this.stepsRef.current) {
          this.stepsRef.current.updateStepElement(nextIndex);
        }
      };

      // Helper function to handle transitions with delay
      const handleTransition = (action, delay = 0) => {
        action();
        setTimeout(() => {
          updateStepElement();
          resolve();
        }, delay);
      };

      // Handle search field demonstration
      if (step?.title === "Sök lager") {
        const searchField = document.querySelector("#layer-list-filter input");
        if (searchField) {
          // Clear any existing value and interval
          searchField.value = "";
          if (this.state.typingInterval) {
            clearInterval(this.state.typingInterval);
          }

          // Function to type one character
          const typeChar = () => {
            const texts = [
              "Badplatser",
              "Lekplatser",
              "Gymnasieskolor",
              "Sevärdheter",
            ];
            let textIndex = 0;
            let charIndex = 0;

            return () => {
              // If we've finished typing the current text
              if (charIndex >= texts[textIndex].length) {
                // Move to next text or back to first text
                textIndex = (textIndex + 1) % texts.length;
                charIndex = 0;
                searchField.value = "";
              }

              searchField.value += texts[textIndex][charIndex];
              searchField.dispatchEvent(new Event("input", { bubbles: true }));
              charIndex++;
            };
          };

          // Start the typing loop
          const interval = setInterval(typeChar(), 200);
          this.setState({ typingInterval: interval });

          updateStepElement();
          resolve();
          return;
        }
      }
      // Clear typing interval when moving to next step
      if (
        (previousStep?.title === "Sök lager" && goingForward) ||
        (nextStep?.title === "Sök lager" && goingBackward)
      ) {
        if (this.state.typingInterval) {
          clearInterval(this.state.typingInterval);
          this.setState({ typingInterval: null });

          // Clear the search field
          const searchField = document.querySelector(
            "#layer-list-filter input"
          );
          if (searchField) {
            searchField.value = "";
            searchField.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }
      }

      // Handle Kartlager tab switch
      if (
        (step?.title === "Lagerlista" && goingForward) ||
        (step?.title === "Lagerinformation" && goingBackward) ||
        (step?.title === "Snabbåtkomst" && goingForward)
      ) {
        const tabs = document.querySelector(
          "#layer-switcher-tab-panel .MuiTabs-root"
        );
        if (tabs) {
          const activeTab = tabs.querySelector(".Mui-selected");
          if (activeTab && activeTab.textContent !== "Kartlager") {
            const firstTab = tabs.querySelector(".MuiTab-root");
            if (firstTab) {
              firstTab.click();
              resolve();
              return;
            }
          }
        }
      }

      // Handle Ritordning tab switch
      if (
        (step?.title === "Ritordning" &&
          previousStep?.title === "Flikar i lagerhanteraren" &&
          goingForward) ||
        (step?.title === "Lista över systemlager" &&
          previousStep?.title === "Aktivera systemlager" &&
          goingBackward)
      ) {
        const tabs = document.querySelector(
          "#layer-switcher-tab-panel .MuiTabs-root"
        );
        if (tabs) {
          const tabElements = tabs.querySelectorAll(".MuiTab-root");
          const ritordningTab = Array.from(tabElements).find(
            (tab) => tab.textContent === "Ritordning"
          );
          if (ritordningTab) {
            ritordningTab.click();
            resolve();
            return;
          }
        }
      }
      // Handle drawer transitions
      if (this.handleDrawerTransition(previousStep, step)) {
        const needsDelay =
          (previousStep?.title === "Verktygspanel" &&
            step?.title === "Kartverktyg" &&
            goingForward) ||
          (step?.title === "Lås fast verktygspanelen" &&
            nextStep?.title === "Sökruta" &&
            goingBackward);

        if (needsDelay) {
          setTimeout(resolve, 250);
        } else {
          resolve();
        }
        return;
      }

      // Handle layer details view transition
      if (step?.element === "#toggle-legend-icon") {
        const menuButton = document.querySelector("#show-layer-details");
        if (menuButton) {
          handleTransition(() => {
            menuButton.dispatchEvent(
              new MouseEvent("click", { bubbles: true })
            );
          });
          return;
        }
      }

      // Handle edit favorites transition
      if (step?.element === "#import-favorites-button") {
        const menuButton = document.querySelector("#edit-favorites");
        if (menuButton) {
          handleTransition(() => {
            menuButton.click();
          });
          return;
        }
      }

      // Handle back to layer list view transition
      // note to myself, same logic can be used to handle going back from favorites and quickaccess (teman)
      if (
        (previousStep?.title === "Tänd lager" &&
          step?.title === "Lagerinformation" &&
          goingBackward) ||
        (step?.title === "Lagerlista" &&
          previousStep?.title === "Hajk 4" &&
          goingForward) ||
        step?.element === "#layer-switcher-tab-panel"
      ) {
        const menuButton = document.querySelector(
          "#layer-item-details-back-button"
        );

        if (menuButton) {
          handleTransition(() => {
            menuButton.dispatchEvent(
              new MouseEvent("click", { bubbles: true })
            );
          }, 150);
          return;
        }
      }

      if (
        (step?.title === "Redigera favoriter" &&
          previousStep?.title === "Mina favoriter meny" &&
          goingBackward) ||
        (step?.title === "Lagerlista" &&
          previousStep?.title === "Hajk 4" &&
          goingForward)
      ) {
        document.dispatchEvent(new CustomEvent("favoritesBackButton"));
        didWaitForFavoritesBack = true;

        const waitForLagerlistaVisible = () => {
          const el = document.querySelector("#layerslist-container");
          return el && el.offsetParent !== null;
        };

        const maxTries = 20;
        let tries = 0;

        const waitInterval = setInterval(() => {
          if (waitForLagerlistaVisible()) {
            clearInterval(waitInterval);
            updateStepElement();

            // After waiting, check if other transitions apply
            if (this.handleFavoritesMenuTransition(step)) {
              handleTransition(() => {}, 300);
            } else {
              resolve();
            }
          } else if (++tries >= maxTries) {
            clearInterval(waitInterval);
            console.log("Timeout waiting for Lagerlista to render");
            updateStepElement();
            resolve();
          }
        }, 100);

        return; // Delay until Lagerlista visible
      }

      if (
        previousStep?.title === "Opacitet" &&
        step?.title === "Lägg till/ta bort lager i snabbåtkomst" &&
        goingBackward
      ) {
        // Handle going back to layer details view transition
        const menuButton = document.querySelector("#show-layer-details");
        if (menuButton) {
          handleTransition(() => {
            menuButton.dispatchEvent(
              new MouseEvent("click", { bubbles: true })
            );
          });
          return;
        }
      }

      // Handle menu content transitions
      if (this.handleMenuContentTransition(step)) {
        handleTransition(() => {}, 200);
        return;
      }

      // Handle quick access menu transitions
      if (this.handleQuickAccessMenuTransition(step)) {
        handleTransition(() => {}, 150);
        return;
      }

      // Handle layer events
      if (this.handleCustomEvents(step)) {
        updateStepElement();
        resolve();
        return;
      }

      // If no custom back handling needed, proceed with favorites menu transition
      if (
        !didWaitForFavoritesBack &&
        this.handleFavoritesMenuTransition(step)
      ) {
        handleTransition(() => {}, 300);
        return;
      }

      if (this.handleFavoritesListMenuTransition(step)) {
        handleTransition(() => {}, 150);
        return;
      }

      // Default case - no special handling needed
      resolve();
    });
  };

  //Runs after intro.js has moved to the new step - the DOM is already updated and the highlight is active.
  handleStepChange = (stepIndex) => {
    this.setState({ currentStepIndex: stepIndex });

    const step = this.state.steps[stepIndex];
    const previousStep = this.state.steps[stepIndex - 1];

    const goingForward = stepIndex > this.state.currentStepIndex;
    const goingBackward = stepIndex < this.state.currentStepIndex;

    // Handle search close menu transitions
    if (
      (previousStep?.title === "Sök meny" &&
        step?.title === "Lagergrupp" &&
        goingForward) ||
      (previousStep?.title === "Sök lager" &&
        step?.title === "Öppna meny bredvid sökfält" &&
        goingBackward)
    ) {
      const closeEvent = new CustomEvent("closeLayersMenu");
      document.dispatchEvent(closeEvent);
      return;
    }
    // Handle quick access close menu transitions
    if (
      (previousStep?.title === "Fler val" &&
        step?.title === "Mina favoriter" &&
        goingForward) ||
      (previousStep?.title === "Snabbåtkomst" &&
        step?.title === "Snabbåtkomst meny" &&
        goingBackward)
    ) {
      const closeEvent = new CustomEvent("closeQuickAccessMenu");
      document.dispatchEvent(closeEvent);
      return;
    }
    // Handle favorites close menu transitions
    if (
      (previousStep?.title === "Redigera favoriter" &&
        step?.title === "Importera favoriter" &&
        goingForward) ||
      (previousStep?.title === "Fler val" &&
        step?.title === "Mina favoriter" &&
        goingBackward)
    ) {
      const closeEvent = new CustomEvent("closeFavoritesMenu");
      document.dispatchEvent(closeEvent);
      return;
    }

    if (
      (previousStep?.title === "Favoriter flerval meny" &&
        step?.title === "Slut" &&
        goingForward) ||
      (previousStep?.title === "Lista över favoriter" &&
        step?.title === "Favoriter flerval" &&
        goingBackward)
    ) {
      const closeEvent = new CustomEvent("closeFavoritesListMenu");
      document.dispatchEvent(closeEvent);
      return;
    }
  };

  render() {
    const { introductionEnabled, introductionShowControlButton } = this.props;
    const { initialStep, steps, stepsEnabled, showSelection } = this.state;

    // Process steps to evaluate position functions and intro functions
    const processedSteps = steps.map((step) => ({
      ...step,
      position:
        typeof step.position === "function" ? step.position() : step.position,
      intro: typeof step.intro === "function" ? step.intro() : step.intro,
    }));

    return introductionEnabled ? (
      <>
        {introductionShowControlButton && this.renderControlButton()}
        {showSelection && (
          <IntroSelectionScreen
            onSelect={this.handleIntroSelection}
            onClose={this.handleSelectionClose}
            layerSwitcherPlugin={this.layerSwitcherPlugin}
          />
        )}
        {!showSelection &&
          steps.length >= 2 &&
          // Show only once per browser, or override if forced by a user action.
          (parseInt(window.localStorage.getItem("introductionShown")) !== 1 ||
            this.state.forceShow === true) && (
            <Steps
              ref={this.stepsRef}
              enabled={stepsEnabled}
              steps={processedSteps}
              initialStep={initialStep}
              onExit={this.disableSteps}
              onBeforeChange={(nextStepIndex) =>
                this.handleBeforeStepChange(nextStepIndex)
              }
              onAfterChange={this.handleStepChange}
              options={{
                highlightClass: "introjs-click-through",
                exitOnOverlayClick: false,
                nextLabel: "Nästa",
                prevLabel: "Föregående",
                doneLabel: "Klart!",
                showBullets: false,
                showProgress: true,
              }}
            />
          )}
      </>
    ) : null;
  }
}

export default Introduction;
