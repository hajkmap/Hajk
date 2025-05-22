import React, { useEffect, createRef } from "react";
import { createPortal } from "react-dom";
import { Steps } from "intro.js-react";
import { useTheme } from "@mui/material/styles";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import PluginControlButton from "../components/PluginControlButton";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

import "intro.js/introjs.css";
import "intro.js/themes/introjs-modern.css";

import { functionalOk as functionalCookieOk } from "../models/Cookie";

const IntroSelectionScreen = ({ onSelect, onClose }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const [showHalfIntro, setShowHalfIntro] = React.useState(true);

  useEffect(() => {
    const layerSwitcher = document.getElementById("layer-switcher-view-root");
    if (layerSwitcher) {
      const isVisible = layerSwitcher.style.display !== "none";
      setShowHalfIntro(isVisible);
    }
  }, []);

  const handleClose = (event, reason) => {
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
        {showHalfIntro && (
          <Button
            variant="contained"
            fullWidth
            onClick={() => onSelect("half")}
            sx={{
              mb: 1,
              height: "40px",
            }}
          >
            Hajk 4 (kortare)
          </Button>
        )}
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
      title: "Fönster",
      element: '#windows-container > div[style*="display: block"]', // My favorite selector. Selects the first visible Window, so if there's a plugin Window open, we can add intro text to it.
      intro:
        "Varje verktyg ritar ut ett eget fönster. Du kan flytta på fönstret och ändra dess storlek genom att dra i fönstrets sidor.",
    },
    {
      title: "Kartlager",
      element: ".MuiTabs-flexContainer :nth-child(1)",
      intro:
        "Varje verktyg ritar ut ett eget fönster. Du kan flytta på fönstret och ändra dess storlek genom att dra i fönstrets sidor.",
    },
    {
      title: "Bakgrund",
      element: ".MuiTabs-flexContainer :nth-child(2)",
      intro:
        "Varje verktyg ritar ut ett eget fönster. Du kan flytta på fönstret och ändra dess storlek genom att dra i fönstrets sidor.",
    },
    {
      title: "Ritordning",
      element: ".MuiTabs-flexContainer :nth-child(3)",
      intro:
        "Varje verktyg ritar ut ett eget fönster. Du kan flytta på fönstret och ändra dess storlek genom att dra i fönstrets sidor.",
    },
    {
      title: "Sök lager",
      element: "#layer-list-filter",
      intro: "Sök på lager.",
    },
    {
      title: "Öppna meny",
      element: "#layerswitcher-actions-menu",
      intro: "Olika val.",
      position: "top",
    },
    {
      title: "Meny",
      element: "#layerswitcher-actions-menu-content",
      intro: "Olika val.",
    },
    {
      title: "Snabbåtkomst",
      element: "#quick-access-view",
      intro: "Meny för åtkomst av sparade lager.",
    },
    {
      title: "Snabbåtkomst meny",
      element: "#quick-access-actions-menu",
      intro:
        "Varje verktyg ritar ut ett eget fönster. Du kan flytta på fönstret och ändra dess storlek genom att dra i fönstrets sidor.",
    },
    {
      title: "Fler val",
      element: "#quick-access-actions-menu-content",
      intro: "Olika val.",
    },
    {
      title: "Widget-knapp",
      element: "#left-column > div > button",
      intro:
        "Det här är en Widget-knapp. Genom att klicka på den öppnar du det verktyget som knappen är kopplad till. <br><br>Det var det hela. Hoppas du kommer tycka om att använda Hajk!",
    },
  ];

  predefinedStepsTwo = [
    {
      title: "Hajk 4",
      intro:
        "Detta är en introduktion till Hajk 4, främst för att visa hur den nya lagerhanteraren fungerar.",
    },
    {
      title: "Fönster",
      element: "#layer-switcher-view-root",
      intro:
        "Här ser du lagerhanteraren. Den är uppdelad i tre delar: <br><br> - Filtrering <br> - Kategorisering <br> - Sökning",
    },
    {
      title: "Sök lager",
      element: "#layer-list-filter",
      intro: "Sök på lager.",
    },
    {
      title: "Öppna meny",
      element: "#layerswitcher-actions-menu",
      intro: "Olika val.",
      position: "top",
    },
    {
      title: "Meny",
      element: "#layerswitcher-actions-menu-content",
      intro: "Olika val.",
    },
    {
      title: "Snabbåtkomst",
      element: "#quick-access-view",
      intro: "Meny för åtkomst av sparade lager.",
    },
  ];

  constructor(props) {
    super(props);
    this.stepsRef = createRef();

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
    this.setState({ showSelection: false });
    if (type === "full") {
      this.setState({
        steps: this.predefinedSteps,
        forceShow: true,
        stepsEnabled: true,
      });
    } else if (type === "half") {
      this.setState({
        steps: this.predefinedStepsTwo,
        forceShow: true,
        stepsEnabled: true,
      });
    }
  };

  handleSelectionClose = () => {
    this.setState({
      showSelection: false,
      forceShow: false,
      stepsEnabled: false,
    });
  };

  disableSteps = () => {
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
        icon={<InsertEmoticonIcon />}
        onClick={() => {
          this.showIntroduction();
        }}
        title="Introduktionsguide"
        abstract="Öppna guidad tour"
      />,
      document.getElementById("plugin-control-buttons")
    );
  }

  handleDrawerTransition = (currentStep, nextStep) => {
    // Open drawer transitions
    if (
      (currentStep?.title === "Verktygspanel" &&
        nextStep?.title === "Kartverktyg") ||
      (currentStep?.title === "Kartverktyg" &&
        nextStep?.title === "Lås fast verktygspanelen")
    ) {
      this.props.globalObserver.publish("core.drawerContentChanged", "plugins");
      return true;
    }

    // Close drawer transitions
    if (
      (currentStep?.title === "Välkommen" &&
        nextStep?.title === "Verktygspanel") ||
      (currentStep?.title === "Lås fast verktygspanelen" &&
        nextStep?.title === "Sökruta")
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
    if (step?.element === "#quick-access-actions-menu-content") {
      const menuButton = document.querySelector("#quick-access-actions-menu");
      if (menuButton) {
        menuButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      }
      return true;
    }
    return false;
  };

  handleBeforeStepChange = (nextIndex) => {
    return new Promise((resolve) => {
      const step = this.state.steps[nextIndex];
      const previousStep = this.state.steps[nextIndex - 1];
      const nextStep = this.state.steps[nextIndex + 1];
      const currentIndex = this.state.currentStepIndex;

      const goingBackward = nextIndex < currentIndex;
      const goingForward = nextIndex > currentIndex;

      // Handle drawer transitions
      if (this.handleDrawerTransition(previousStep, step)) {
        if (
          (previousStep?.title === "Verktygspanel" &&
            step?.title === "Kartverktyg" &&
            goingForward) ||
          (step?.title === "Lås fast verktygspanelen" &&
            nextStep?.title === "Sökruta" &&
            goingBackward)
        ) {
          setTimeout(() => resolve(), 250);
        } else if (
          (step?.title === "Lås fast verktygspanelen" &&
            nextStep?.title === "Sökruta" &&
            goingForward) ||
          (step?.title === "Kartverktyg" &&
            nextStep?.title === "Lås fast verktygspanelen" &&
            goingBackward)
        ) {
          resolve();
        } else {
          resolve();
        }
        return;
      }

      // Handle menu content transitions
      if (this.handleMenuContentTransition(step)) {
        setTimeout(() => {
          if (this.stepsRef.current) {
            this.stepsRef.current.updateStepElement(nextIndex);
          }
          resolve();
        }, 150);
        return;
      }

      if (this.handleQuickAccessMenuTransition(step)) {
        setTimeout(() => {
          if (this.stepsRef.current) {
            this.stepsRef.current.updateStepElement(nextIndex);
          }
          resolve();
        }, 150);
        return;
      }
      resolve();
    });
  };

  handleStepChange = (stepIndex) => {
    this.setState({ currentStepIndex: stepIndex });

    const step = this.state.steps[stepIndex];
    const previousStep = this.state.steps[stepIndex - 1];

    const goingForward = stepIndex > this.state.currentStepIndex;
    const goingBackward = stepIndex < this.state.currentStepIndex;

    // Handle menu transitions
    if (
      (previousStep?.title === "Meny" &&
        step?.title === "Snabbåtkomst" &&
        goingForward) ||
      (previousStep?.title === "Sök lager" &&
        step?.title === "Öppna meny" &&
        goingBackward)
    ) {
      const closeEvent = new CustomEvent("closeLayersMenu");
      document.dispatchEvent(closeEvent);
      return;
    }
    // Handle quick access menu transitions
    if (
      (previousStep?.title === "Fler val" &&
        step?.title === "Widget-knapp" &&
        goingForward) ||
      (previousStep?.title === "Snabbåtkomst" &&
        step?.title === "Snabbåtkomst meny" &&
        goingBackward)
    ) {
      const closeEvent = new CustomEvent("closeQuickAccessMenu");
      document.dispatchEvent(closeEvent);
      return;
    }
  };

  render() {
    const { introductionEnabled, introductionShowControlButton } = this.props;
    const { initialStep, steps, stepsEnabled, showSelection } = this.state;

    return introductionEnabled ? (
      <>
        {introductionShowControlButton && this.renderControlButton()}
        {showSelection && (
          <IntroSelectionScreen
            onSelect={this.handleIntroSelection}
            onClose={this.handleSelectionClose}
            isDarkMode={this.props.theme?.palette?.mode === "dark"}
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
              steps={steps}
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
