// Make sure to only import the hooks you intend to use
import React, { useCallback, useEffect, useState, useRef } from "react";
import * as Survey from "survey-react-ui";
import "survey-core/defaultV2.min.css";
import "survey-core/i18n/swedish";

import EditView from "./EditView.js";
import EditModel from "./EditModel.js";

import { Box, Typography } from "@mui/material";
import AppRegistrationIcon from "@mui/icons-material/AppRegistration";

// Hajk components are primarily styled in two ways:
// - Using the styled-utility, see: https://mui.com/system/styled/
// - Using the sx-prop, see: https://mui.com/system/basics/#the-sx-prop
// The styled-utility creates a reusable component, and might be the
// best choice if the style is to be applied in several places.

// The styled components should be created at the top of the document
// (but after imports) for consistency. Hajk does not have a naming
// convention for the styled components, but keep in mind to use names
// that does not collide with regular components. (E.g. a styled div
// should not be called Box).

// All MUI components (and all styled components, even styled div:s!) will have access to the sx-prop.
// Check out how the sx-prop works further down.

function CitizendialogueView(props) {
  // We're gonna need to use the event observers. Let's destruct them so that we can
  // get a hold of them easily. The observers can be accessed directly via the props:
  const { globalObserver } = props;

  // You don’t have to use many state variables. State variables can hold objects and arrays just fine,
  // so you can still group related data together. However, unlike this.setState in a class, updating a
  // state variable always replaces it instead of merging it. A grouped state, with two variables,
  // could look something like this:
  // const [someState, setSomeState] = useState({
  //   counter: 0,
  //   borderColor: "#FFFFFF",
  // });
  // So how would you go about updating just one of the variables in the grouped state?
  // Well, all you have to do is to make sure to merge the old state manually.
  // For example, to increment the counter, but keep the border-color constant, we can do:
  // setSomeState((state) => ({...state, counter: state.counter + 1}))

  // We've already covered the useState hook. Let's look into another one. The useCallback hook
  // returns a memoized callback (cached, only computed again when the inputs in the dependency
  // array changes). Why do we want to memoize this function? It only returns some JSX? Well,
  // since we want to use this function in a useEffect hook (more on that later) we want to make
  // sure that this function does not change on every render. (If it would, the useEffect would run
  // on every render, which we want to avoid).
  const renderDrawerContent = useCallback(() => {
    return (
      // The sx-prop gives us some shorthand commands, for example, the paddings below
      // will be set to theme.spacing(2), and not 2px! Make sure to read up on how the sx-prop
      // works before using it, check out the MUI docs.
      <Box sx={{ paddingLeft: 2, paddingRight: 2 }}>
        <Typography variant="h6">Medborgardialog</Typography>
        <Typography variant="body1">
          Medborgardialog har anropat globalObserver och bett om att få lägga
          till en knapp uppe i headern. När du trycker på knappen visas det här
          innehållet i sidopanelen.
        </Typography>
      </Box>
    );
  }, []); // <-- dependency array. (Here we can add inputs that would cause the callback to be re-calculated).

  // Another hook that is used a lot in functional components is the useEffect hook.
  // Mutations, subscriptions, timers, logging, and other side effects are not allowed inside the main body
  // of a function component (referred to as React’s render phase). Doing so will lead to confusing bugs
  // and inconsistencies in the UI. Instead, use the useEffect hook. The function passed to useEffect will run after
  // the render is committed to the screen. For more information, see: https://reactjs.org/docs/hooks-reference.html#useeffect

  // When moving from Class-based components to Functional components I've seen several developers trying to mimic the
  // constructor (which is obviously only present in Class-based components) by using the useEffect hook. The useEffect hook
  // *could* be used in a "constructor like" fashion (by leaving the dependency array empty, making the effect only run once).
  // But be aware! The effect runs AFTER the initial render, in contrast to the 'real' constructor which runs before the initial
  // render. To get around this, I would suggest to create a custom hook instead. (To be fair, constructor-like behavior is rarely
  // needed in functional components. But sometimes it **is** needed, and I thought that some clarification regarding how to work
  // around this could be valid).

  // Well, here we use a useEffect to publish a message on the global observer (after the initial render).
  // The message sent is used to render whatever 'renderDrawerContent' returns in Hajks drawer.
  useEffect(() => {
    globalObserver.publish("core.addDrawerToggleButton", {
      value: "Medborgardialog",
      ButtonIcon: AppRegistrationIcon,
      caption: "Medborgardialogverktyg",
      drawerTitle: "Medborgardialogverktyg",
      order: 100,
      renderDrawerContent: renderDrawerContent,
    });
  }, [globalObserver, renderDrawerContent]);

  // <-- The dependency array. Since we reference the global observer and 'renderDrawerContent' we have to include these.
  // There is a lot more to say regarding the useEffect hook, but I'll leave that to you to read up on. Just a couple of tips:
  // - Remember the cleanup-function! Especially when you're working with subscriptions.
  // - Remember that you can use several useEffect hooks! Maybe you want to do something when 'counter' changes?

  const [editModel] = React.useState(
    () =>
      new EditModel({
        map: props.map,
        app: props.app,
        observer: props.localObserver,
        options: props.options,
        surveyJsData: props.surveyJsData,
      })
  );

  const surveyJSON = {
    title: "Enkel enkät",
    language: "sv",
    pages: [
      {
        name: "page1",
        elements: [
          {
            type: "text",
            name: "enkatnamn",
            visible: false,
          },
          {
            type: "text",
            name: "svarsID",
            visible: false,
          },
          {
            type: "text",
            name: "question1",
            title: "Vad är ditt namn?",
          },
          {
            type: "radiogroup",
            name: "question2",
            title: "Vilken färg föredrar du?",
            choices: ["Röd", "Blå", "Gul"],
          },
        ],
      },
      {
        name: "page2",
        elements: [
          {
            type: "checkbox",
            name: "question3",
            title: "Vilka sporter gillar du?",
            choices: ["Fotboll", "Basket", "Tennis", "Ishockey"],
          },
          {
            type: "comment",
            name: "question4",
            title: "Några ytterligare kommentarer?",
          },
        ],
      },
      {
        name: "page3",
        elements: [
          {
            type: "html",
            name: "Geometri1-question5",
            html: "<button id='editButton'>Klicka här för att markera koordinater i kartan</button>",
          },
          {
            type: "comment",
            name: "question5",
            title: "Kommentarer om platsen som du markerat i kartan?",
          },
        ],
      },
      {
        name: "page4",
        elements: [
          {
            type: "html",
            name: "placeholderForEditView",
            html: "<p>Klicka på knappen nedan så kommer det fram ett verktyg som du kan använda för att redigera kartan</p>",
          },
          {
            type: "html",
            name: "Geometri2",
            html: "<button id='editButton'>Klicka här för att markera koordinater i kartan</button>",
          },
        ],
      },
    ],
  };

  const [currentQuestionName, setCurrentQuestionName] = useState(null);
  const [showEditView, setShowEditView] = useState(false);
  const [editViewKey, setEditViewKey] = useState(Date.now());
  const resetEditView = () => {
    setEditViewKey(Date.now());
  };
  const editViewRef = useRef(null);

  //Combine ID/Name and surveydata
  const handleOnComplete = (survey) => {
    setShowEditView(false);
    const combinedData = { ...props.surveyJsData, ...survey.data };
    props.model.handleOnComplete(combinedData);

    if (editViewRef.current) {
      editViewRef.current.onSaveClicked();
    }
  };

  const handleAfterRenderQuestion = (sender, options) => {
    const currentQuestion = options.question;
    if (currentQuestion.name.toLowerCase().includes("geom".toLowerCase())) {
      setCurrentQuestionName(currentQuestion.name);
      const editButton = document.getElementById("editButton");
      if (editButton) {
        editButton.onclick = (e) => {
          e.preventDefault();
          setShowEditView(true);
        };
      }
    }
  };

  const handlePageChange = () => {
    setShowEditView(false);
    if (editViewRef.current) {
      editViewRef.current.onSaveClicked();
    }
  };

  Survey.surveyLocalization.defaultLocale = "sv";

  return (
    <>
      <Survey.Survey
        json={surveyJSON}
        onComplete={handleOnComplete}
        onAfterRenderQuestion={handleAfterRenderQuestion}
        onCurrentPageChanged={handlePageChange}
      />

      {showEditView && (
        <EditView
          key={editViewKey}
          app={props.app}
          model={editModel}
          observer={props.localObserver}
          surveyJsData={props.surveyJsData}
          resetView={resetEditView}
          currentQuestionName={currentQuestionName}
          onSaveCallback={handleOnComplete}
          ref={editViewRef}
        />
      )}
    </>
  );
}

export default CitizendialogueView;
