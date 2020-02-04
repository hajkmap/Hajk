import React from "react";
import { Steps } from "intro.js-react";
import PropTypes from "prop-types";

import "intro.js/introjs.css";

/**
 * @summary Renders a guide that introduces new users to features present in Hajk.
 * @description The introduction will only be rendered once. This is achieved by setting
 * a flag in the browser's local storage.
 *
 * @param {bool} { experimentalShowIntroduction }
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
    experimentalShowIntroduction: PropTypes.bool.isRequired,
    globalObserver: PropTypes.object.isRequired
  };

  static defaultProps = {
    experimentalShowIntroduction: false,
    globalObserver: {}
  };

  predefinedSteps = [
    {
      element: "header",
      intro:
        "Välkommen till Hajk! <br /><br />Här kommer en kort guide som visar dig runt i applikationen. <br /><br />Häng med!"
    },
    {
      element: "#drawerToggler",
      intro:
        "Med hjälp av den här knappen tar du fram verktygspanelen. Den innehåller användbara verktyg, så se till att bekanta dig med dess innehåll!"
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
        "Ibland kan det finns så kallade Widget-knappar. De används för de mest använda verktygen och gör att du inte behöver öppna verktygspanelen för att nå verktyget. <br><br>Det var det hela. Hoppas du kommer tycka om att använda Hajk!"
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
    this.props.globalObserver.subscribe("appLoaded", () => {
      const filteredSteps = this.predefinedSteps.filter(
        s => document.querySelector(s.element) !== null
      );
      this.setState({ steps: filteredSteps });
    });

    this.props.globalObserver.subscribe("showIntroduction", () => {
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
    const { experimentalShowIntroduction } = this.props;
    const { initialStep, steps, stepsEnabled } = this.state;

    return (
      // TODO: Remove check once the experimental flag is lifted. Remember to remove the unneeded prop from here and App.js too.
      experimentalShowIntroduction &&
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
            // TODO: Below is a great place to handle the last step, we could e.g. show a special goodbye message
            // if (nextStepIndex === this.localSteps?.props.steps.length - 1) {
            //   console.log(
            //     "This is the last step, hide prev/next buttons and ensure correct CSS for done button"
            //   );
            // }
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
