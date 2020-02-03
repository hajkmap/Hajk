import React, { useState, useEffect } from "react";
import { Steps } from "intro.js-react";
import { bool, object } from "prop-types";

import "intro.js/introjs.css";

Introduction.propTypes = {
  experimentalShowIntroduction: bool.isRequired,
  globalObserver: object.isRequired
};

/**
 * @summary Renders a guide that introduces new users to features present in Hajk.
 * @description The introduction will only be rendered once. This is achieved by setting
 * a flag in the browser's local storage.
 *
 * @param {bool} { experimentalShowIntroduction }
 * @returns React.Component
 */
function Introduction({ experimentalShowIntroduction, globalObserver }) {
  const [stepsEnabled, setStepsEnabled] = useState(true);

  // eslint-disable-next-line
  const [steps, setSteps] = useState([
    {
      element: "#map > div",
      intro:
        "Välkommen till Hajk! <br /><br />Här kommer en kort guide som visar dig runt i applikationen. <br /><br />Häng med!"
    },
    {
      element: "#drawerToggler",
      intro:
        "Med hjälp av den här knappen tar du fram verktygspanelen. Den innehåller användbara verktyg, så se till att bekanta dig med dess innehåll!"
    },
    {
      element: "#controls-column",
      intro:
        "Längst ut i den högra delen av skärmen finns olika kontroller som du använder för att navigera i kartan."
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
      element: "#left-column > div > button",
      intro:
        "Ibland kan det finns så kallade Widget-knappar. De används för de mest använda verktygen och gör att du inte behöver öppna verktygspanelen för att nå verktyget. <br><br>Det var det hela. Hoppas du kommer tycka om att använda Hajk!"
    }
  ]);

  // eslint-disable-next-line
  const [initialStep, setInitialStep] = useState(0);

  const [readyForRender, setReadyForRender] = useState(false);
  let localSteps;

  const disableSteps = () => {
    setStepsEnabled(false);
    // Upon completion/closing, set a flag that won't show this guide again
    window.localStorage.setItem("introductionShown", 1);
  };

  /**
   * When appLoaded is fired, let's filter through the provided 'steps'.
   * We must remove any steps that don't have corresponding DOM elements.
   * Otherwise, we would show intro steps even for non-existing elements,
   * which wouldn't be nice.
   */
  globalObserver.subscribe("appLoaded", l => {
    setSteps(steps.filter(s => document.querySelector(s.element) !== null));
    localSteps.updateStepElement(0);
    console.log("ready");
    setReadyForRender(true);
  });

  return (
    readyForRender &&
    experimentalShowIntroduction &&
    parseInt(window.localStorage.getItem("introductionShown")) !== 1 && (
      <Steps
        enabled={stepsEnabled}
        steps={steps}
        initialStep={initialStep}
        onExit={disableSteps}
        ref={steps => (localSteps = steps)}
        onBeforeChange={nextStepIndex => {
          if (nextStepIndex) {
            localSteps.updateStepElement(nextStepIndex);
          }
          if (nextStepIndex === localSteps?.props.steps.length - 1) {
            console.log(
              "This is the last step, hide prev/next buttons and ensure correct CSS for done button"
            );
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

export default Introduction;
