// Make sure to only import the hooks you intend to use
import React, { useCallback, useEffect, useState, useRef } from "react";
import * as Survey from "survey-react-ui";
import { ComponentCollection } from "survey-core";
import { Model } from "survey-core";
//import * as SurveyTheme from "survey-core/themes";
import "survey-core/defaultV2.min.css";
import "survey-core/i18n/swedish";
import ReactDOM from "react-dom/client";

import EditView from "./EditView.js";
import EditModel from "./EditModel.js";

import { Box, Typography } from "@mui/material";
import AppRegistrationIcon from "@mui/icons-material/AppRegistration";

//Register new "geometry" component
ComponentCollection.Instance.add({
  //Unique component name. It becomes a new question type. Please note, it should be written in lowercase.
  name: "geometry",
  //The text that shows on toolbox
  title: "Geometry",
  //The actual question that will do the job
  questionJSON: {
    type: "html",
    html: "<div class='editViewContainer'></div>",
  },
});

//Register new "geometrypoint" component
ComponentCollection.Instance.add({
  //Unique component name. It becomes a new question type. Please note, it should be written in lowercase.
  name: "geometrypoint",
  //The text that shows on toolbox
  title: "GeometryPoint",
  //The actual question that will do the job
  questionJSON: {
    type: "html",
    html: "<div class='editViewContainer'></div>",
  },
});

//Register new "geometrylinestring" component
ComponentCollection.Instance.add({
  //Unique component name. It becomes a new question type. Please note, it should be written in lowercase.
  name: "geometrylinestring",
  //The text that shows on toolbox
  title: "GeometryLinestring",
  //The actual question that will do the job
  questionJSON: {
    type: "html",
    html: "<div class='editViewContainer'></div>",
  },
});

//Register new "geometrypolygon" component
ComponentCollection.Instance.add({
  //Unique component name. It becomes a new question type. Please note, it should be written in lowercase.
  name: "geometrypolygon",
  //The text that shows on toolbox
  title: "geometryPolygon",
  //The actual question that will do the job
  questionJSON: {
    type: "html",
    html: "<div class='editViewContainer'></div>",
  },
});

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

  useEffect(() => {
    props.model.fetchStyle();
    // eslint-disable-next-line
  }, []);

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

  const [surveyJSON, setSurveyJSON] = useState(null);
  useEffect(() => {
    props.model
      .loadSurvey(props.options.selectedSurvey)
      .then((data) => setSurveyJSON(data))
      .catch((error) => console.error("Failed to load survey:", error));
    // eslint-disable-next-line
  }, []);

  const [showEditView, setShowEditView] = useState(false);

  const [editViewKey, setEditViewKey] = useState(Date.now());
  const resetEditView = () => {
    setEditViewKey(Date.now());
  };
  const editViewRef = useRef(null);

  const [geometry, setGeometry] = React.useState({});

  //Combine ID/Name and surveydata and geometry
  const handleOnComplete = React.useCallback(
    (survey) => {
      setShowEditView({ show: false });
      const combinedData = {
        ...props.surveyJsData,
        ...survey.data,
        geometry,
      };
      props.model.handleOnComplete(combinedData);

      if (editViewRef.current) {
        editViewRef.current.onSaveClicked();
      }
    },
    [props.surveyJsData, props.model, geometry]
  );

  const [currentQuestionName, setCurrentQuestionName] = useState(null);
  const handleAfterRenderQuestion = (sender, options) => {
    const currentQuestion = options.question;
    if (currentQuestion.jsonObj.type === "geometry") {
      setCurrentQuestionName(currentQuestion.title);
      setShowEditView({ show: true, toolbarOptions: "all" });
    }
    if (currentQuestion.jsonObj.type === "geometrypoint") {
      setCurrentQuestionName(currentQuestion.title);
      setShowEditView({ show: true, toolbarOptions: "point" });
    }
    if (currentQuestion.jsonObj.type === "geometrylinestring") {
      setCurrentQuestionName(currentQuestion.title);
      setShowEditView({ show: true, toolbarOptions: "linestring" });
    }
    if (currentQuestion.jsonObj.type === "geometrypolygon") {
      setCurrentQuestionName(currentQuestion.title);
      setShowEditView({ show: true, toolbarOptions: "polygon" });
    }
  };

  // To display geometry in answerfile.
  const handleSelectedCoordinatesChange = (questionName, newCoordinate) => {
    setGeometry((prevCoords) => {
      const existingCoordinates = prevCoords[questionName] || [];
      let newCoordinatesToAdd;
      // Remove duplicate geometry
      if (Array.isArray(newCoordinate[0])) {
        newCoordinatesToAdd = newCoordinate.filter(
          (tempCoord) =>
            !existingCoordinates.some(
              (existingCoord) =>
                existingCoord[0] === tempCoord[0] &&
                existingCoord[1] === tempCoord[1]
            )
        );
      } else {
        const isDuplicate = existingCoordinates.some(
          (coord) =>
            coord[0] === newCoordinate[0] && coord[1] === newCoordinate[1]
        );
        newCoordinatesToAdd = isDuplicate ? [] : [newCoordinate];
      }

      return {
        ...prevCoords,
        [questionName]: [...existingCoordinates, ...newCoordinatesToAdd],
      };
    });
  };

  const handlePageChange = () => {
    setShowEditView({ show: false });
    if (editViewRef.current) {
      editViewRef.current.onSaveClicked();
    }
  };

  const rootMap = useRef(new Map());
  React.useEffect(() => {
    const containers = document.querySelectorAll(".editViewContainer");

    if (showEditView.show) {
      containers.forEach((container) => {
        let root = rootMap.current.get(container);

        if (!root) {
          root = ReactDOM.createRoot(container);
          rootMap.current.set(container, root);
        }

        root.render(
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
            onCoordinatesChange={handleSelectedCoordinatesChange}
            toolbarOptions={showEditView.toolbarOptions}
          />
        );
      });
    } else {
      containers.forEach((container) => {
        const root = rootMap.current.get(container);
        if (root) {
          root.render(null);
        }
      });
    }
  });

  const [survey, setSurvey] = useState(null);
  useEffect(() => {
    const newSurvey = new Model(surveyJSON);
    //newSurvey.applyTheme(SurveyTheme.DefaultDark);
    setSurvey(newSurvey);
    return () => {};
  }, [surveyJSON]);

  Survey.surveyLocalization.defaultLocale = "sv";

  return (
    <>
      {surveyJSON && (
        <Survey.Survey
          model={survey}
          onComplete={handleOnComplete}
          onAfterRenderQuestion={handleAfterRenderQuestion}
          onCurrentPageChanged={handlePageChange}
        />
      )}
    </>
  );
}

export default CitizendialogueView;
