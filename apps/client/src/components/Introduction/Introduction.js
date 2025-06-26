import React, { createRef, useEffect, useState } from "react";
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

    const isDrawOrderView = this.showDrawOrderView;

    let steps =
      type === "full"
        ? getFullIntroductionSteps(this.layerSwitcherPlugin)
        : getLayerSwitcherSteps(this.layerSwitcherPlugin);

    if (!isDrawOrderView) {
      steps = steps.filter(
        (step) =>
          step.element !== "#draw-order-tab" &&
          step.element !== "#draw-order-switch" &&
          step.element !== ".draw-order-list"
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
            menuButton.click();
          });
          return;
        }
      }

      // Handle back to layer list view transition
      // note to myself, same logic can be used to handle going back from favorites and quickaccess (teman)
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
        step?.element === "#layerslist-container"
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
        handleTransition(() => {}, 200);
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
      step?.element === "#layerGroup-accordion-arrow-button" ||
      step?.element === "#layerswitcher-actions-menu"
    ) {
      const closeEvent = new CustomEvent("closeLayersMenu");
      document.dispatchEvent(closeEvent);
      return;
    }
    // Handle quick access close menu transitions
    if (
      (step?.element === "#favorites-menu-button" &&
        previousStep?.element === "#quick-access-menu-content" &&
        goingForward) ||
      step?.element === "#quick-access-menu-button"
    ) {
      const closeEvent = new CustomEvent("closeQuickAccessMenu");
      document.dispatchEvent(closeEvent);
      return;
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
      step?.title === "Slut" ||
      step?.element === "#favorites-list-options-button"
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
