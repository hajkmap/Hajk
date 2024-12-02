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
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

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
  const [surveyJsData, setSurveyJsData] = React.useState(props.surveyJsData);
  const { responseMessage, restartButtonText } = props.options;
  const hasRestartButtonText =
    props.options.restartButtonText &&
    props.options.restartButtonText.trim() !== "";
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const rootMap = useRef(new Map());

  // Used for responseanswer
  const [isCompleted, setIsCompleted] = useState(false);
  const [surveyKey, setSurveyKey] = useState(0);

  // Checks if responseMessage contains html
  const containsHTML = (str) => /<\/?[a-z][\s\S]*>/i.test(str);
  const messageContainsHTML = containsHTML(responseMessage);

  //Unique ID and name on survey
  function generateUniqueID() {
    return (
      new Date().getTime().toString() +
      "-" +
      Math.random().toString(36).substring(2, 9)
    );
  }

  const handleAction = () => {
    setShowConfirmDialog(true);
  };

  const handleDialogClose = () => {
    setShowConfirmDialog(false);
    closeSurvey();
  };

  const handleDialogAbort = () => {
    setShowConfirmDialog(false);
  };

  const closeSurvey = () => {
    if (props.baseWindowRef && props.baseWindowRef.current) {
      restartSurvey();
      props.baseWindowRef.current.closeWindow();
    }
  };

  const restartSurvey = () => {
    let newSurveyAnswerId = generateUniqueID();
    setSurveyKey((prevKey) => prevKey + 1);
    setIsCompleted(false);

    setSurveyJsData((prevSurveyJsData) => ({
      ...prevSurveyJsData,
      surveyAnswerId: newSurveyAnswerId,
    }));
    editModel.surveyJsData.surveyAnswerId = newSurveyAnswerId;
    editModel.reset();
    editModel.newMapData = [];
  };

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
    const snackbarHandler = (message) => {
      enqueueSnackbar(message, { variant: "info" });

      // Check that editViewRef is defined first
      if (editViewRef?.current?.onSaveClicked) {
        editViewRef.current.onSaveClicked();
      }
    };

    localObserver.subscribe("showSnackbar", snackbarHandler);

    // Clean prenumeration
    return () => {
      localObserver.unsubscribe("showSnackbar", snackbarHandler);
    };
  }, [localObserver, enqueueSnackbar]);

  const handleOnCompleting = () => {
    if (showEditView.show) {
      editViewRef.current.onSaveClicked();
    }
  };

  //Combine ID/Name and surveydata and geometry
  const handleOnComplete = React.useCallback(
    async (survey) => {
      const specificSurveyAnswerId = surveyJsData.surveyAnswerId;
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
        ...surveyJsData,
        surveyResults: mergedResults,
        mailTemplate: props.options.selectedMailTemplate,
      };
      try {
        await props.model.handleOnComplete(combinedData);
      } catch (error) {
        setShowErrorMessage(
          "Ett fel uppstod vid inlämning av enkät" //+ error.message
        );
      }
      setIsCompleted(true);
      setShowEditView({ show: false });
    },
    // eslint-disable-next-line
    [surveyJsData.surveyAnswerId, props.model]
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
        surveyJsData: surveyJsData,
      })
  );

  editModel.currentQuestionName = currentQuestionName;
  editModel.currentQuestionTitle = currentQuestionTitle;

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
            surveyJsData={surveyJsData}
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
          root.unmount();
          rootMap.current.delete(container);
        }
      });
    }
  });

  useEffect(() => {
    const newSurvey = new Model(surveyJSON);
    newSurvey.applyTheme(surveyTheme);
    setSurvey(newSurvey);
    return () => {};
  }, [surveyJSON, surveyTheme, surveyKey]);

  Survey.surveyLocalization.defaultLocale = "sv";

  return (
    <>
      {!isCompleted ? (
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
        <div
          className="response-message-container"
          style={{
            backgroundColor: "#f0f0f0",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "50vh",
            textAlign: "center",
          }}
        >
          {messageContainsHTML ? (
            // If content HTML render as HTML
            <div
              className="response-message"
              dangerouslySetInnerHTML={{
                __html: responseMessage,
              }}
            ></div>
          ) : (
            // If not HTML, set style, render as text and manage \n
            <p
              style={{
                fontSize: "1.5em",
                margin: "0",
                fontWeight: "bold",
              }}
            >
              {responseMessage.split("\n").map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  <br />
                </React.Fragment>
              ))}
            </p>
          )}

          {hasRestartButtonText && (
            <button
              onClick={restartSurvey}
              style={{
                marginTop: "20px",
                padding: "10px 20px",
                fontSize: "1em",
                cursor: "pointer",
                backgroundColor: "#333333",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
              }}
            >
              {restartButtonText}
            </button>
          )}
          <br />
          <button
            onClick={handleAction}
            style={{
              padding: "10px 20px",
              fontSize: "1em",
              cursor: "pointer",
              backgroundColor: "#333333",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
            }}
          >
            Stäng enkätfönster och förbered för nytt enkätsvar
          </button>
        </div>
      )}
      {showConfirmDialog && (
        <div>
          <Dialog open={showConfirmDialog} onClose={handleDialogAbort}>
            <DialogTitle>Är du säker?</DialogTitle>
            <DialogContent>
              Är du säker på att du vill stänga fönstret? Enkäten är redan
              inskickad. Om du stänger fönstret nu kommer du att återgå till
              början, men inga ytterligare ändringar kan göras.
            </DialogContent>
            <DialogActions>
              <Button onClick={handleDialogAbort} color="primary">
                Avbryt
              </Button>
              <Button onClick={handleDialogClose} color="primary" autoFocus>
                Stäng fönstret
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      )}
      {showErrorMessage && (
        <div
          className="error-message"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "10px 20px",
            fontSize: "1em",
            cursor: "pointer",
            backgroundColor: "#990000",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
          }}
        >
          {showErrorMessage}
        </div>
      )}
    </>
  );
}

export default CitizendialogueView;
