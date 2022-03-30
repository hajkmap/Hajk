import React from "react";
import { createPortal } from "react-dom";
import { Steps } from "intro.js-react";
import PropTypes from "prop-types";

import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import PluginControlButton from "../components/PluginControlButton";

import "intro.js/introjs.css";
import "intro.js/themes/introjs-modern.css";

import { functionalOk as functionalCookieOk } from "models/Cookie";

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
  };

  static propTypes = {
    introductionEnabled: PropTypes.bool.isRequired,
    introductionSteps: PropTypes.array,
    globalObserver: PropTypes.object.isRequired,
  };

  static defaultProps = {
    introductionEnabled: false,
    introductionSteps: [],
    globalObserver: {},
  };

  predefinedSteps = [
    {
      title: "Välkommen till Hajk! 👋",
      intro:
        "Här kommer en kort guide som visar dig runt i applikationen. <br /><br />Häng med!",
    },
    {
      title: "Verktygspanel",
      element: "header > div:first-child",
      intro: "Med hjälp av knappen här uppe tar du fram verktygspanelen.",
    },
    {
      title: "Sökruta",
      element: '[class*="searchContainer"]',
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
      title: "Widget-knapp",
      element: "#left-column > div > button",
      intro:
        "Det här är en Widget-knapp. Genom att klicka på den öppnar du det verktyget som knappen är kopplad till. <br><br>Det var det hela. Hoppas du kommer tycka om att använda Hajk!",
    },
  ];

  constructor(props) {
    super(props);

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
        const { introductionSteps } = this.props;
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
    });
  }

  disableSteps = () => {
    // Upon completion/closing, set a flag that won't show this guide again.
    // Remember that the user must allow for functional cookies for this to be possible.
    // If the user has chosen to allow only the required cookies, the introduction will
    // show on every page load.
    if (functionalCookieOk()) {
      window.localStorage.setItem("introductionShown", 1);
    }

    // Reset the state
    this.setState({ forceShow: false, initialStep: 0 });
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

  render() {
    const { introductionEnabled } = this.props;
    const { initialStep, steps, stepsEnabled } = this.state;

    return introductionEnabled ? (
      <>
        {this.renderControlButton()}
        {
          // Don't show unless we have 2 or more elements in array - too short
          // guides are not meaningful!
          steps.length >= 2 &&
            // Show only once per browser, or override if forced by a user action.
            (parseInt(window.localStorage.getItem("introductionShown")) !== 1 ||
              this.state.forceShow === true) && (
              <Steps
                enabled={stepsEnabled}
                steps={steps}
                initialStep={initialStep}
                onExit={this.disableSteps}
                options={{
                  exitOnOverlayClick: false,
                  nextLabel: "Nästa",
                  prevLabel: "Föregående",
                  doneLabel: "Klart!",
                }}
              />
            )
        }
      </>
    ) : null;
  }
}

export default Introduction;
