import React, { createRef } from "react";
import { createPortal } from "react-dom";
import { Steps } from "intro.js-react";
import { useTheme } from "@mui/material/styles";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import PluginControlButton from "../PluginControlButton";
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
import { getFullIntroductionSteps } from "./steps/fullTourSteps";
import { getLayerSwitcherSteps } from "./steps/layerSwitcherSteps";
import { functionalOk as functionalCookieOk } from "../../models/Cookie";
import LocalStorageHelper from "utils/LocalStorageHelper";

// Utility: Wait until a selector becomes visible
const waitForElementVisible = (selector, maxTries = 20, delay = 100) =>
  new Promise((resolve) => {
    let tries = 0;
    const interval = setInterval(() => {
      const el = document.querySelector(selector);
      if (el && el.offsetParent !== null) {
        clearInterval(interval);
        resolve(true);
      } else if (++tries >= maxTries) {
        clearInterval(interval);
        console.warn(`Timeout waiting for ${selector}`);
        resolve(false);
      }
    }, delay);
  });

// Utility: Perform action, wait for something to appear, repeat
const chainActionsWithVisibility = async (steps) => {
  for (const step of steps) {
    if (step.action) step.action();
    if (step.waitFor) await waitForElementVisible(step.waitFor);
    if (step?.delay)
      await new Promise((resolve) => setTimeout(resolve, step?.delay));
  }
};

const IntroSelectionScreen = ({ onSelect, onClose, layerSwitcherPlugin }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

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
      slotProps={{
        paper: {
          sx: {
            "& .MuiButton-root": {
              color: isDarkMode
                ? theme.palette.text.primary
                : theme.palette.grey[900],
              backgroundColor: isDarkMode
                ? theme.palette.grey[900]
                : theme.palette.background.default,
              border: `1px solid ${isDarkMode ? "#fff" : "#000"}`,
              borderRadius: "50px",
              "&:hover": {
                backgroundColor: theme.palette.grey[500],
              },
            },
          },
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
            onClick={() => onSelect("layerSwitcher")}
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

  constructor(props) {
    super(props);
    this.stepsRef = createRef();
    this.layerSwitcherPlugin = this.props.layerSwitcherPlugin;
    this.showDrawOrderView =
      this.props.layerSwitcherPlugin.options.showDrawOrderView;
    this.showFavorites =
      this.props.layerSwitcherPlugin.options.enableUserQuickAccessFavorites;
    this.showQuickAccessPresets =
      this.props.layerSwitcherPlugin.options.enableQuickAccessPresets;
    this.quickAccessList =
      this.props.layerSwitcherPlugin.options.quickAccessPresets;
    this.isDarkMode = this.props.isDarkMode;
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
        const isValidStep = (step) =>
          step.element === undefined ||
          document.querySelector(step.element) !== null;
        // We must have at least 2 elements in the array in order to properly show intro guide
        const steps =
          introductionSteps.length >= 2
            ? this.#tryParsingSteps(introductionSteps)
            : getFullIntroductionSteps(this.layerSwitcherPlugin);

        const filteredSteps = steps.filter(isValidStep);

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
      return getFullIntroductionSteps(this.layerSwitcherPlugin);
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

    // Determine which steps to show based on settings for layerswicher in admin.
    const isDrawOrderEnabled = this.showDrawOrderView;
    const isFavoritesEnabled = this.showFavorites;
    const isFavoritesListEmpty = LocalStorageHelper.get("layerswitcher");
    const isQuickAccessPresetsEnabled = this.showQuickAccessPresets;
    let steps =
      type === "full"
        ? getFullIntroductionSteps(this.layerSwitcherPlugin)
        : getLayerSwitcherSteps(this.layerSwitcherPlugin);

    if (type === "full") {
      steps = steps.filter((step) => step.title !== "Hajk 4");
    }

    if (!isDrawOrderEnabled) {
      steps = steps.filter(
        (step) =>
          step.element !== "#draw-order-tab" &&
          step.element !== "#draw-order-switch" &&
          step.element !== ".draw-order-list"
      );
    }
    if (!isFavoritesEnabled) {
      steps = steps.filter(
        (step) =>
          step.element !== "#favorites-menu-button" &&
          step.element !== "#favorites-menu" &&
          step.element !== "#edit-favorites" &&
          step.element !== "#import-favorites-button" &&
          step.element !== ".favorites-list-view" &&
          step.element !== "#favorites-list-options-button" &&
          step.element !== "#favorites-list-options-menu"
      );
    }
    if (isFavoritesListEmpty.savedLayers?.length === 0) {
      steps = steps.filter(
        (step) =>
          step.element !== "#favorites-menu" &&
          step.element !== "#edit-favorites" &&
          step.element !== "#import-favorites-button" &&
          step.element !== ".favorites-list-view" &&
          step.element !== "#favorites-list-options-button" &&
          step.element !== "#favorites-list-options-menu"
      );
    }
    if (!isQuickAccessPresetsEnabled) {
      steps = steps.filter(
        (step) =>
          step.element !== "#quick-access-theme-button" &&
          step.element !== "#quick-access-presets-view"
      );
    }
    if (this.quickAccessList.length === 0) {
      steps = steps.filter(
        (step) => step.element !== "#quick-access-presets-view"
      );
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
    const isDrawerPermanent =
      window.localStorage.getItem("drawerPermanent") === "true";

    // Skip drawer transitions if drawer is permanent
    if (isDrawerPermanent) {
      return false;
    }

    // Open drawer transitions
    if (
      (previousStep?.element === "header > div:first-child" &&
        currentStep?.element === "#drawer-content") ||
      (previousStep?.element === "#drawer-content" &&
        currentStep?.element === "#toggle-drawer-permanent")
    ) {
      this.props.globalObserver.publish("core.drawerContentChanged", "plugins");
      return true;
    }

    // Close drawer transitions
    if (
      (previousStep?.title === "Välkommen" &&
        currentStep?.element === "header > div:first-child") ||
      (previousStep?.element === "#toggle-drawer-permanent" &&
        currentStep?.element === ".MuiAutocomplete-inputRoot")
    ) {
      this.props.globalObserver.publish("core.hideDrawer");
      return true;
    }

    return false;
  };

  handleSearchOptionsMenuTransition = (step) => {
    if (step?.element === "#search-tools-menu") {
      const menuButton = document.querySelector("#search-options-button");
      if (menuButton) {
        menuButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      }
      return true;
    }
    return false;
  };

  handleLayerSwitcherMenuTransition = (step) => {
    if (step?.element === "#layerswitcher-actions-menu") {
      const menuButton = document.querySelector(
        "#layerswitcher-actions-menu-button"
      );
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
      step?.element === "#layerGroup-accordion-arrow-button" ||
      step?.element === "#toggle-layer-item" ||
      step?.element === "#show-layer-details" ||
      step?.element === "#layer-item-details-info" ||
      step?.element === "#layer-details-opacity-slider" ||
      step?.element === "#quick-access-view" ||
      step?.element === "#layer-details-quick-access-button" ||
      step?.element === "#edit-favorites"
    ) {
      document.dispatchEvent(new CustomEvent("expandFirstGroup"));
      return true;
    }

    return false;
  };

  handleFavoritesMenuTransition = (step) => {
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

  handleQuickAccessThemeTransition = (step, previousStep, goingForward) => {
    if (
      step?.element === "#quick-access-presets-view" &&
      previousStep?.element === "#quick-access-theme-button" &&
      goingForward
    ) {
      const menuButton = document.querySelector("#quick-access-theme-button");

      if (menuButton) {
        menuButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      }

      return true;
    }

    return false;
  };

  handleQuickAccessThemeBackTransition = (
    step,
    previousStep,
    goingBackward
  ) => {
    if (
      (step?.element === "#quick-access-theme-button" &&
        previousStep?.element === "#favorites-list-options-menu" &&
        goingBackward) ||
      (step?.element === "#quick-access-theme-button" &&
        previousStep?.element === "#quick-access-menu-content" &&
        goingBackward) ||
      (step?.element === "#quick-access-theme-button" &&
        previousStep?.element === "#favorites-menu-button" &&
        goingBackward)
    ) {
      const menuButton = document.querySelector("#quick-access-back-button");

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
      if (step?.element === "#layer-list-filter") {
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
        (previousStep?.element === "#layer-list-filter" && goingForward) ||
        (nextStep?.element === "#layer-list-filter" && goingBackward)
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
        (step?.element === "#layerslist-container" && goingForward) ||
        (step?.element === "#show-layer-details" && goingBackward) ||
        (step?.element === "#quick-access-view" && goingForward)
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
        step?.element === "#draw-order-tab" ||
        step?.element === ".draw-order-list"
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
          (previousStep?.element === "header > div:first-child" &&
            step?.element === "#drawer-content" &&
            goingForward) ||
          (step?.element === "#toggle-drawer-permanent" &&
            nextStep?.element === ".MuiAutocomplete-inputRoot" &&
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
            menuButton.dispatchEvent(
              new MouseEvent("click", { bubbles: true })
            );
          });
          return;
        }
      }

      if (step?.element === "#favorites-list-options-menu") {
        chainActionsWithVisibility([
          {
            action: () =>
              document.dispatchEvent(new CustomEvent("favoritesShowButton")),
            waitFor: "#favorites-list-options-button",
          },
          {
            action: () =>
              document
                .querySelector("#favorites-list-options-button")
                ?.dispatchEvent(new MouseEvent("click", { bubbles: true })),
            waitFor: "#favorites-list-options-menu",
            delay: 150,
          },
        ]).then(() => {
          updateStepElement();
          resolve();
        });

        return;
      }

      // Handle back to layer list view transition
      if (
        step?.element === "#show-layer-details" ||
        step?.element === "#layerslist-container" ||
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
        step?.element === "#edit-favorites" ||
        step?.element === "#layerslist-container" ||
        (step?.element === "#quick-access-theme-button" &&
          previousStep?.element === "#favorites-list-options-menu" &&
          goingForward)
      ) {
        if (step?.element === "#quick-access-theme-button") {
          document.dispatchEvent(new CustomEvent("closeFavoritesListMenu"));
        }

        document.dispatchEvent(new CustomEvent("favoritesBackButton"));
        didWaitForFavoritesBack = true;

        chainActionsWithVisibility([
          {
            waitFor: "#layerslist-container",
          },
        ]).then(() => {
          updateStepElement();

          if (this.handleFavoritesMenuTransition(step)) {
            handleTransition(() => {}, 300);
          } else {
            resolve();
          }
        });

        return;
      }

      if (step?.element === "#layer-details-quick-access-button") {
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

      // Handle search options menu transitions
      if (this.handleSearchOptionsMenuTransition(step)) {
        handleTransition(() => {}, 200);
        return;
      }

      // Handle menu content transitions
      if (this.handleLayerSwitcherMenuTransition(step)) {
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

      // Handle quick access theme menu transitions
      if (
        this.handleQuickAccessThemeTransition(step, previousStep, goingForward)
      ) {
        handleTransition(() => {}, 150);
        return;
      }

      if (
        this.handleQuickAccessThemeBackTransition(
          step,
          previousStep,
          goingBackward
        )
      ) {
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

    const isDarkMode = this.props.isDarkMode;

    const introContainerBox = document.querySelector(".introjs-click-through");
    if (introContainerBox) {
      introContainerBox.style.boxShadow = isDarkMode
        ? "rgba(255, 255, 255, 0.8) 0px 0px 1px 2px, rgba(33, 33, 33, 0.5) 0px 0px 0px 5000px"
        : undefined;
    } else {
      console.log("introjs-click-through class not yet mounted");
    }

    const step = this.state.steps[stepIndex];
    const previousStep = this.state.steps[stepIndex - 1];
    const isFavoritesEnabled = this.showFavorites;
    const goingForward = stepIndex > this.state.currentStepIndex;
    const goingBackward = stepIndex < this.state.currentStepIndex;

    // Handle close search options menu transitions
    if (
      step?.element === "#controls-column" ||
      step?.element === "#search-options-button"
    ) {
      const closeEvent = new CustomEvent("closeSearchOptionsMenu");
      document.dispatchEvent(closeEvent);
      return;
    }

    if (
      step?.element === "#layerGroup-accordion-arrow-button" ||
      step?.element === "#layerswitcher-actions-menu-button"
    ) {
      // Handle close layers menu transitions
      const closeEvent = new CustomEvent("closeLayersMenu");
      document.dispatchEvent(closeEvent);
      return;
    }
    // Handle quick access close menu transitions
    if (
      (step?.element === "#favorites-menu-button" &&
        previousStep?.element === "#quick-access-menu-content" &&
        goingForward) ||
      step?.element === "#quick-access-menu-button" ||
      (step?.element === "#quick-access-theme-button" && !isFavoritesEnabled) ||
      step?.title === "Slut"
    ) {
      const closeEvent = new CustomEvent("closeQuickAccessMenu");
      document.dispatchEvent(closeEvent);
    }
    // Handle favorites close menu transitions
    if (
      step?.element === "#import-favorites-button" ||
      (step?.element === "#favorites-menu-button" &&
        previousStep?.element === "#quick-access-menu-content" &&
        goingBackward)
    ) {
      const closeEvent = new CustomEvent("closeFavoritesMenu");
      document.dispatchEvent(closeEvent);
      return;
    }

    if (
      step?.element === "#favorites-list-options-button" ||
      step?.title === "Slut"
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
    const processedSteps = steps.map((step) => {
      // Get the position from the step (either function or direct value)
      let position =
        typeof step.position === "function" ? step.position() : step.position;

      // If no position is specified and this is a layer switcher step (has an element),
      // set default position based on layerSwitcherPlugin position
      if (!position && step.element && this.layerSwitcherPlugin) {
        position =
          this.layerSwitcherPlugin.options.position === "right"
            ? "left"
            : "right";
      }

      return {
        ...step,
        position: position,
        intro: typeof step.intro === "function" ? step.intro() : step.intro,
      };
    });

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
