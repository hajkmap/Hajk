import React from "react";
import { Steps } from "intro.js-react";
import PropTypes from "prop-types";

import "intro.js/introjs.css";

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
    steps: []
  };

  static propTypes = {
    experimentalIntroductionEnabled: PropTypes.bool.isRequired,
    experimentalIntroductionSteps: PropTypes.array,
    globalObserver: PropTypes.object.isRequired
  };

  static defaultProps = {
    experimentalIntroductionEnabled: false,
    experimentalIntroductionSteps: [],
    globalObserver: {}
  };

  predefinedSteps = [
    {
      element: "#map",
      intro:
        "<b>Välkommen till Hajk!</b> <br /><br />Här kommer en kort guide som visar dig runt i applikationen. <br /><br />Häng med!"
    },
    {
      element: "header > div:first-child",
      intro: "Med hjälp av knappen här uppe tar du fram sidopanelen."
    },
    {
      element: "#searchbox",
      intro:
        "Sökrutan hittar du här.<br /><br /> Med hjälp av sökverktyget hittar du enkelt till rätt ställe i kartan."
    },
    {
      element: "#spatialSearchMenu",
      intro: "Under den här knappen hittar du fler avancerade sökalternativ."
    },
    {
      element: "#controls-column",
      intro:
        "Längst ut i den högra delen av skärmen finns olika kontroller som du använder för att navigera i kartan."
    },
    {
      element: '#windows-container > div[style*="display: block"]', // My favorite selector. Selects the first visible Window, so if there's a plugin Window open, we can add intro text to it.
      intro:
        "Varje verktyg ritar ut ett eget fönster. Du kan flytta på fönstret och ändra dess storlek genom att dra i fönstrets sidor."
    },
    {
      element: "#left-column > div > button",
      intro:
        "Det här är en Widget-knapp. Genom att klicka på den öppnar du det verktyget som knappen är kopplad till. <br><br>Det var det hela. Hoppas du kommer tycka om att använda Hajk!"
    }
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
      // First check if we have any steps in our config
      const { experimentalIntroductionSteps } = this.props;
      // We must have at least 2 elements in the array in order to properly show intro guide
      const steps =
        experimentalIntroductionSteps.length >= 2
          ? experimentalIntroductionSteps
          : this.predefinedSteps;

      const filteredSteps = steps.filter(
        s => document.querySelector(s?.element) !== null
      );
      this.setState({ steps: filteredSteps });
    });

    this.props.globalObserver.subscribe("core.showIntroduction", () => {
      this.setState({
        initialStep: 0,
        stepsEnabled: true,
        forceShow: true
      });
    });
  }

  disableSteps = () => {
    this.setState({ stepsEnabled: false, forceShow: false });
    // Upon completion/closing, set a flag that won't show this guide again
    window.localStorage.setItem("introductionShown", 1);
  };

  render() {
    const { experimentalIntroductionEnabled } = this.props;
    const { initialStep, steps, stepsEnabled } = this.state;

    return (
      // TODO: Remove check once the experimental flag is lifted. Remember to remove the unneeded prop from here and App.js too.
      experimentalIntroductionEnabled &&
      // Don't show unless we have 2 or more elements in array - too short guides are not meaningful!
      steps.length >= 2 &&
      // Show only once per browser, or override if forced by a user action.
      (parseInt(window.localStorage.getItem("introductionShown")) !== 1 ||
        this.state.forceShow === true) && (
        <Steps
          enabled={stepsEnabled}
          steps={steps}
          initialStep={initialStep}
          onExit={this.disableSteps}
          ref={steps => (this.localSteps = steps)}
          onBeforeChange={nextStepIndex => {
            // Ensure that we always use the updated list of steps, necessary for dynamic elements
            if (nextStepIndex) {
              this.localSteps.updateStepElement(nextStepIndex);
            }
          }}
          onAfterChange={nextStepIndex => {
            // TODO: When https://github.com/HiDeoo/intro.js-react/issues/35 is solved, we can remove this nasty hack.
            // It should be easier to hide prev/next buttons, but this works for now.
            if (nextStepIndex === this.localSteps?.props.steps.length - 1) {
              document
                .querySelector(".introjs-donebutton")
                .classList.remove("introjs-skipbutton");
              document.querySelector(".introjs-prevbutton").style.display =
                "none";
              document.querySelector(".introjs-nextbutton").style.display =
                "none";
              document.querySelector(".introjs-bullets").style.display = "none";
            }
          }}
          options={{
            exitOnOverlayClick: false,
            nextLabel: "Nästa",
            prevLabel: "Föregående",
            skipLabel: "Hoppa över",
            doneLabel: "Klart"
          }}
        />
      )
    );
  }
}

export default Introduction;
