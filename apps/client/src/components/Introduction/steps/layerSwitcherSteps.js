import LocalStorageHelper from "utils/LocalStorageHelper";
import { step } from "./step";
import i18n, { configText } from "src/i18n";

export const getLayerSwitcherSteps = (layerSwitcherPlugin) => {
  const title = configText(
    "layerSwitcher.title",
    layerSwitcherPlugin.options.title
  );

  return [
    step("hajk4", {
      intro: i18n.t("introduction.steps.hajk4.intro", { title }),
    }),
    step("layerList", { element: "#layerslist-container" }),
    step("layerSearch", { element: "#layer-list-filter" }),
    step("actionsMenuButton", {
      element: "#layerswitcher-actions-menu-button",
    }),
    step("actionsMenu", { element: "#layerswitcher-actions-menu" }),
    step("layerGroup", { element: "#layerGroup-accordion-arrow-button" }),
    step("toggleLayer", { element: "#toggle-layer-item", position: "bottom" }),
    step("layerDetails", { element: "#show-layer-details" }),
    step("legend", { element: "#toggle-legend-icon" }),
    step("layerInfo", { element: "#layer-item-details-info" }),
    step("opacity", { element: "#layer-details-opacity-slider" }),
    step("quickAccessButton", {
      element: "#layer-details-quick-access-button",
    }),
    step("tabs", {
      title: i18n.t("introduction.steps.tabs.title", { title }),
      element: "#layer-switcher-tab-panel",
      intro: () =>
        i18n.t("introduction.steps.tabs.intro", {
          drawOrder: layerSwitcherPlugin.options.showDrawOrderView
            ? i18n.t("introduction.steps.tabs.drawOrder")
            : "",
        }),
    }),
    step("drawOrder", { element: "#draw-order-tab" }),
    step("systemLayers", { element: "#draw-order-switch" }),
    step("systemLayerList", { element: "#draw-order-list" }),
    step("quickAccess", { element: "#quick-access-view" }),
    step("quickAccessMenuButton", { element: "#quick-access-menu-button" }),
    step("quickAccessMenu", { element: "#quick-access-menu-content" }),
    step("favorites", {
      element: "#favorites-menu-button",
      intro: () => {
        const savedLayers =
          LocalStorageHelper.get("layerswitcher").savedLayers?.length || 0;

        return i18n.t("introduction.steps.favorites.intro", {
          note:
            savedLayers === 0
              ? i18n.t("introduction.steps.favorites.noFavorites")
              : "",
        });
      },
    }),
    step("favoritesMenu", { element: "#favorites-menu" }),
    step("editFavorites", { element: "#edit-favorites" }),
    step("importFavorites", { element: "#import-favorites-button" }),
    step("favoritesList", { element: "#favorites-list-view" }),
    step("favoritesOptions", { element: "#favorites-list-options-button" }),
    step("favoritesOptionsMenu", { element: "#favorites-list-options-menu" }),
    step("themes", {
      element: "#quick-access-theme-button",
      intro: () =>
        i18n.t("introduction.steps.themes.intro", {
          note:
            layerSwitcherPlugin.options.quickAccessPresets?.length === 0
              ? i18n.t("introduction.steps.themes.noThemes")
              : "",
        }),
    }),
    step("themeList", { element: "#quick-access-presets-view" }),
    step("done", { element: "#introduction-icon", position: "left" }),
  ];
};
