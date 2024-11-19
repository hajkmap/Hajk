// Make sure to only import the hooks you intend to use
import React, { useEffect, useState, useRef } from "react";
import * as Survey from "survey-react-ui";
import { ComponentCollection } from "survey-core";
import { Model } from "survey-core";
//import * as SurveyTheme from "survey-core/themes";
import "survey-core/defaultV2.min.css";
import "survey-core/i18n/swedish";
import ReactDOM from "react-dom/client";
//import WKT from "ol/format/WKT";

import EditView from "./EditView.js";
import EditModel from "./EditModel.js";

import { useSnackbar } from "notistack";

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

//Register new "geometryposition" component
ComponentCollection.Instance.add({
  //Unique component name. It becomes a new question type. Please note, it should be written in lowercase.
  name: "geometrypointposition",
  //The text that shows on toolbox
  title: "geometryPointPosition",
  //The actual question that will do the job
  questionJSON: {
    type: "html",
    html: "<div class='editViewContainer'></div>",
  },
});

function CitizendialogueView(props) {
  // We're gonna need to use the event observers. Let's destruct them so that we can
  // get a hold of them easily. The observers can be accessed directly via the props:
  const { localObserver } = props;

  const { enqueueSnackbar } = useSnackbar();
  const [surveyTheme, setSurveyTheme] = useState(null);
  const [surveyJSON, setSurveyJSON] = useState(null);
  const [showEditView, setShowEditView] = useState(false);
  const [editViewKey, setEditViewKey] = useState(Date.now());
  const [currentQuestionTitle, setCurrentQuestionTitle] = useState(null);
  const [currentQuestionName, setCurrentQuestionName] = useState(null);
  const [survey, setSurvey] = useState(null);
  /*const [isCompleted, setIsCompleted] = useState(false);
  const [surveyKey, setSurveyKey] = useState(0);

  const restartSurvey = () => {
    setSurveyKey((prevKey) => prevKey + 1);
    setIsCompleted(false);
  };*/

  useEffect(() => {
    // an asynchronous function that runs directly inside a useEffect
    (async () => {
      const theme = await props.model.fetchTheme();
      // The surveyTheme state is used later in the component for creating surveyModel.
      setSurveyTheme(theme);
    })();
    // eslint-disable-next-line
  }, []);

  // Here we create and retrieve the JSON content for the survey, which is loaded when we create the surveyModel.
  useEffect(() => {
    props.model
      .loadSurvey(props.options.selectedSurvey)
      .then((data) => setSurveyJSON(data))
      .catch((error) => console.error("Failed to load survey:", error));
    // eslint-disable-next-line
  }, []);

  // showEditView is used to render EditView in a editViewContainer-class
  const resetEditView = () => {
    setEditViewKey(Date.now());
  };

  const editViewRef = useRef(null);

  React.useEffect(() => {
    const snackbarEvent = localObserver.subscribe("showSnackbar", (message) => {
      enqueueSnackbar(message, { variant: "info" });

      // Check that editViewRef is defined first
      if (editViewRef?.current?.onSaveClicked) {
        editViewRef.current.onSaveClicked();
      }
    });
    // Clean prenumeration
    return () => {
      localObserver.unsubscribe(snackbarEvent);
    };
  }, [localObserver, enqueueSnackbar, editViewRef]);

  const handleOnCompleting = () => {
    if (showEditView.show) {
      editViewRef.current.onSaveClicked();
    }
  };

  //Combine ID/Name and surveydata and geometry
  const handleOnComplete = React.useCallback(
    (survey) => {
      const specificSurveyAnswerId = props.surveyJsData.surveyAnswerId;
      let featureData = [];

      if (
        editModel &&
        editModel.source &&
        editModel.source.id === "simulated"
      ) {
        featureData = editModel.newMapData
          .filter(
            (feature) => feature.surveyAnswerId === specificSurveyAnswerId
          )
          .map((feature) => ({
            title: feature.surveyQuestion,
            value: feature.wktGeometry,
            name: feature.surveyQuestionName,
          }));
      }

      setShowEditView({ show: false });

      const resultData = [];
      for (const [key, question] of Object.entries(survey.data)) {
        const surveyQuestion = survey.getQuestionByName(key);
        if (!!surveyQuestion) {
          const item = {
            title: surveyQuestion.title,
            value: question,
            name: surveyQuestion.name,
          };
          resultData.push(item);
        }
      }

      const mergedResults = [...resultData, ...featureData];

      const combinedData = {
        ...props.surveyJsData,
        surveyResults: mergedResults,
        mailTemplate: props.options.selectedMailTemplate,
      };
      props.model.handleOnComplete(combinedData);
      /* setIsCompleted(true); */
    },
    // eslint-disable-next-line
    [props.surveyJsData, props.model]
  );

  // Sets currentQuestionName and title after rendering question
  const handleAfterRenderQuestion = (sender, options) => {
    const currentQuestion = options.question;
    // If type is custom question geometry, it shows EditView with the prop toolbarOption set.
    // The Toolbar is filtered to show different sets of tools.
    if (currentQuestion.jsonObj.type === "geometry") {
      setCurrentQuestionTitle(currentQuestion.title);
      setCurrentQuestionName(currentQuestion.name);
      setShowEditView({ show: true, toolbarOptions: "all" });
    }
    if (currentQuestion.jsonObj.type === "geometrypointposition") {
      setCurrentQuestionTitle(currentQuestion.title);
      setCurrentQuestionName(currentQuestion.name);
      setShowEditView({ show: true, toolbarOptions: "position" });
    }
    if (currentQuestion.jsonObj.type === "geometrypoint") {
      setCurrentQuestionTitle(currentQuestion.title);
      setCurrentQuestionName(currentQuestion.name);
      setShowEditView({ show: true, toolbarOptions: "point" });
    }
    if (currentQuestion.jsonObj.type === "geometrylinestring") {
      setCurrentQuestionTitle(currentQuestion.title);
      setCurrentQuestionName(currentQuestion.name);
      setShowEditView({ show: true, toolbarOptions: "linestring" });
    }
    if (currentQuestion.jsonObj.type === "geometrypolygon") {
      setCurrentQuestionTitle(currentQuestion.title);
      setCurrentQuestionName(currentQuestion.name);
      setShowEditView({ show: true, toolbarOptions: "polygon" });
    }
  };

  const handlePageChange = () => {
    if (showEditView.show) {
      editViewRef.current.onSaveClicked();
    }
    setShowEditView({ show: false });
  };

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

  editModel.currentQuestionName = currentQuestionName;
  editModel.currentQuestionTitle = currentQuestionTitle;

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
            currentQuestionTitle={currentQuestionTitle}
            currentQuestionName={currentQuestionName}
            onSaveCallback={handleOnComplete}
            ref={editViewRef}
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

  useEffect(() => {
    const newSurvey = new Model(surveyJSON);
    newSurvey.applyTheme(surveyTheme);
    setSurvey(newSurvey);
    return () => {};
  }, [surveyJSON, surveyTheme /*, surveyKey */]);

  Survey.surveyLocalization.defaultLocale = "sv";

  return (
    <>
      {/*!isCompleted ? (
        survey && (
          <Survey.Survey
            model={survey}
            onComplete={handleOnComplete}
            onCompleting={handleOnCompleting}
            onAfterRenderQuestion={handleAfterRenderQuestion}
            onCurrentPageChanged={handlePageChange}
          />
        )
      ) : (
        <div>
          <p>Tack för att du fyllde i enkäten!</p>
          <button onClick={restartSurvey}>Starta om från början</button>
        </div>
      )*/}
      {surveyJSON && (
        <Survey.Survey
          model={survey}
          onComplete={handleOnComplete}
          onCompleting={handleOnCompleting}
          onAfterRenderQuestion={handleAfterRenderQuestion}
          onCurrentPageChanged={handlePageChange}
        />
      )}
    </>
  );
}

export default CitizendialogueView;
