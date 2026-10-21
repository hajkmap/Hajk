import { getLayerSwitcherSteps } from "./layerSwitcherSteps";
import { step } from "./step";
import i18n, { configText } from "src/i18n";

// Initial steps for the full tour (before layer switcher)
const getInitialSteps = (
  drawerButtonTitle,
  documenthandlerDrawerButtonTitle,
  documenthandler,
  _activeDrawerContent,
  _isDrawerPermanent
) => {
  const steps = [
    step("welcome"),
    step("toolPanel", {
      element: "#drawer-toggle-button-group",
      intro: () =>
        i18n.t("introduction.steps.toolPanel.intro", {
          // Same name as the drawer button itself (see App.jsx)
          name: configText("app.mapTools", drawerButtonTitle),
          documentHandler: documenthandler
            ? i18n.t("introduction.steps.toolPanel.documentHandlerIntro", {
                name: configText(
                  "documentHandler.drawerButtonTitle",
                  documenthandlerDrawerButtonTitle
                ),
              })
            : "",
        }),
    }),
  ];

  // Add Kartverktyg step
  steps.push(step("mapTools", { element: "#drawer-content" }));

  // Add remaining steps
  steps.push(
    step("lockDrawer", { element: "#toggle-drawer-permanent" }),
    // Show the Document Handler content after locking the drawer (when available)
    ...(documenthandler
      ? [step("documentHandler", { element: "#drawer-content" })]
      : []),
    step("searchBar", { element: "#search-bar" }),
    step("searchOptions", {
      element: "#search-options-button",
      position: "left",
    }),
    step("searchToolsMenu", {
      element: "#search-tools-menu",
      position: "left",
    }),
    step("mapControls", { element: "#controls-column" })
  );

  return steps;
};

export const getFullIntroductionSteps = (
  layerSwitcherPlugin,
  drawerButtonTitle,
  documenthandlerDrawerButtonTitle,
  documenthandler,
  activeDrawerContent,
  isDrawerPermanent
) => [
  ...getInitialSteps(
    drawerButtonTitle,
    documenthandlerDrawerButtonTitle,
    documenthandler,
    activeDrawerContent,
    isDrawerPermanent
  ),
  ...getLayerSwitcherSteps(layerSwitcherPlugin),
];
