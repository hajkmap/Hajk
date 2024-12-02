import React, { useState, useEffect } from 'react';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@material-ui/core/";

function SurveyHandler(props) {

  const [availableSurveys, setAvailableSurveys] = useState([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [filename, setFilename] = useState("");
  const [showConfirmDialogValid, setShowConfirmDialogValid] = useState(false);
  const [showConfirmDialogOverwrite, setShowConfirmDialogOverwrite] = useState(false);
  const [overwriteFilename, setOverwriteFilename] = useState('');
  const [surveyJsonToSave, setSurveyJsonToSave] = useState(null);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertDialogMessage, setAlertDialogMessage] = useState('');

  const [survey, setSurvey] = useState({
    title: "",
    language: "sv",
    logo: "",
    logoWidth: 60,
    logoHeight: 60,
    logoPosition: "left",
    showQuestionNumbers: "false",
    pages: [{ questions: [] }]
  });

  useEffect(() => {
    props.model.listAllAvailableSurveys((data) => {
        setAvailableSurveys(data);
    });
    // eslint-disable-next-line
  }, []);

  const handleQuestionClick = (pageIndex, questionIndex) => {
    setSelectedQuestion({ pageIndex, questionIndex });
    setSelectedPageIndex(pageIndex);
  };

  const handleDialogCloseValid = () => {
    setShowConfirmDialogValid(false);
  };

  const handleDialogAbortValid = () => {
    setShowConfirmDialogValid(false);
  };

  const handleConfirmOverwrite = () => {
    // User confirms overwrite
    setShowConfirmDialogOverwrite(false);
    saveSurveyToFile(overwriteFilename, surveyJsonToSave);
    // Clean temporary data
    setOverwriteFilename('');
    setSurveyJsonToSave(null);
  };
  
  const handleCancelOverwrite = () => {
    // User aborted
    setShowConfirmDialogOverwrite(false);
    // Clean temporary data
    setOverwriteFilename('');
    setSurveyJsonToSave(null);
  };

  const handleCloseAlertDialog = () => {
    setShowAlertDialog(false);
    setAlertDialogMessage('');
  };

  const handlePageSelection = (pageIndex) => {
    setSelectedPageIndex(pageIndex);
  };

  const renderSelectedQuestionForm = () => {
    if (selectedQuestion === null || !survey.pages[selectedQuestion.pageIndex]) {
      return null;
    }
    const question = survey.pages[selectedQuestion.pageIndex].questions[selectedQuestion.questionIndex];
    return (
      <div>
        <div>
        <input
          placeholder="Skriv din fråga här"
          style={{ width: '100%', marginBottom: '20px' }}
          type="text"
          value={question.title}
          onChange={(e) => updateQuestion(selectedQuestion.pageIndex, selectedQuestion.questionIndex, 'title', e.target.value)}
        />
        </div>
        <div>
          <label>Välj frågetyp:</label>{" "}
        <Select
          style={{marginBottom: '20px', backgroundColor: 'white', width: '60%' }}
          value={question.inputType === "email" ? "email" : question.type}
          onChange={(e) => {
            const newType = e.target.value;
            if (newType === "email") {
              updateQuestion(selectedQuestion.pageIndex, selectedQuestion.questionIndex, 'type', 'text');
              updateQuestion(selectedQuestion.pageIndex, selectedQuestion.questionIndex, 'inputType', 'email');
            } else {
              updateQuestion(selectedQuestion.pageIndex, selectedQuestion.questionIndex, 'type', newType);
              if (question.inputType) {
                updateQuestion(selectedQuestion.pageIndex, selectedQuestion.questionIndex, 'inputType', undefined);
              }
            }
          }}
        >
        <MenuItem value="text">Text</MenuItem>
        <MenuItem value="email">E-post</MenuItem>
        <MenuItem value="html">Info</MenuItem>
        <MenuItem value="checkbox">Flerval</MenuItem>
        <MenuItem value="radiogroup">Enkelval (radioknapp)</MenuItem>
        <MenuItem value="rating">Betyg</MenuItem>
        <MenuItem value="comment">Kommentar</MenuItem>
        <MenuItem value="geometry">Alla geometriverktyg</MenuItem>
        <MenuItem value="geometrypoint">Geometriverktyget punkt</MenuItem>
        <MenuItem value="geometrylinestring">Geometriverktyget linje</MenuItem>
        <MenuItem value="geometrypolygon">Geometriverktyget yta</MenuItem>
        <MenuItem value="geometrypointposition">Geometriverktyget punkt + min position</MenuItem>
        </Select>
        </div>
        
        {question.type === "checkbox" || question.type === "radiogroup" ? (
      <div style={{marginBottom: '20px' }}>
        {question.choices && question.choices.map((choice, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              value={choice}
              placeholder="Val"
              onChange={(e) => updateChoice(selectedQuestion.pageIndex, selectedQuestion.questionIndex, index, e.target.value)}
            />
            <Button
              variant="contained"
              color="secondary"
              onClick={() => removeChoice(selectedQuestion.pageIndex, selectedQuestion.questionIndex, index)}
              style={{ marginLeft: '10px' }}
            >
              Ta bort detta val
            </Button>
          </div>
          ))}
            <Button
              variant="contained"
              color="primary"
              onClick={() => addChoice(selectedQuestion.pageIndex, selectedQuestion.questionIndex)}
            >
              Lägg till val
            </Button>
          </div>
        ) : null}


      {question.type === "html" && (
        <div style={{marginBottom: '20px'}}><textarea
          style={{ width: '100%', height: '100px', display: 'block' }}
          value={question.html}
          onChange={(e) => updateQuestion(selectedQuestion.pageIndex, selectedQuestion.questionIndex, 'html', e.target.value)}
          placeholder="Skriv HTML-kod här"
        />
        </div>
      )}

      {question.type === "rating" && (
        <div style={{marginBottom: '20px'}}>
          <input
            type="number"
            placeholder="Rate Min"
            value={question.rateMin|| ''}
            onChange={(e) => updateQuestion(selectedQuestion.pageIndex, selectedQuestion.questionIndex, 'rateMin', e.target.value)}
          />
          <input
            type="number"
            placeholder="Rate Max"
            value={question.rateMax || ''}
            onChange={(e) => updateQuestion(selectedQuestion.pageIndex, selectedQuestion.questionIndex, 'rateMax', e.target.value)}
          />
        </div>
      )}
      <div>
        <label>
          Obligatorisk:{" "}
            <input
            style={{marginBottom: '20px'}}
            type="checkbox"
            checked={question.isRequired || false}
            onChange={(e) => updateQuestion(selectedQuestion.pageIndex, selectedQuestion.questionIndex, 'isRequired', e.target.checked)}
            />
        </label>
        </div>
        <Button variant="contained" color="secondary" onClick={deleteSelectedQuestion}>Ta bort Fråga</Button>
      </div>
    );
  };

  const deleteSelectedQuestion = () => {
    if (selectedQuestion === null) return;
    deleteQuestion(selectedQuestion.pageIndex, selectedQuestion.questionIndex);
    setSelectedQuestion(null);
  };

  const addPage = () => {
    setSurvey(prevSurvey => ({
      ...prevSurvey,
      pages: [...prevSurvey.pages, { questions: [] }]
    }));
  };

  const addQuestion = (pageIndex, type = "text") => {
    const questionIndex = survey.pages[pageIndex].questions.length;
    const newQuestion = {
      name: `qid${questionIndex}`,
      title: "",
      type,
      isRequired: false,
    };
  
    if (type === "checkbox" || type === "radiogroup") {
      newQuestion.choices = [];
    } else if (type === "html") {
      newQuestion.html = "";
    } else if (type === "rating") {
      newQuestion.displayMode = "buttons";
    } else if (type === "email") {
      newQuestion.inputType = "email";
      newQuestion.placeholder = "namn@exempel.se";
    }
  
    const newPages = survey.pages.map((page, index) => {
      if (index === pageIndex) {
        return { ...page, questions: [...page.questions, newQuestion] };
      }
      return page;
    });
  
    setSelectedQuestion({ pageIndex, questionIndex });
    setSurvey({ ...survey, pages: newPages });
  };  

const updateQuestion = (pageIndex, questionIndex, field, value) => {
  const newPages = survey.pages.map((page, pIndex) => {
    if (pIndex === pageIndex) {
      const newQuestions = page.questions.map((question, qIndex) => {
        if (qIndex === questionIndex) {
          if (field === "type") {
            const newQuestion = {
              name: question.name || `qid${questionIndex}`,
              title: question.title,
              type: value,
              isRequired: question.isRequired || false,
            };

            if (value === "checkbox" || value === "radiogroup") {
              newQuestion.choices = [];
            } else if (value === "html") {
              newQuestion.html = "";
            } else if (value === "rating") {
              newQuestion.displayMode = "buttons";
            } else if (value === "email") {
              newQuestion.inputType = "email";
              newQuestion.placeholder = "namn@exempel.se";
            }

            return newQuestion;
          } else {
            let updatedQuestion = { ...question, [field]: value };

            if (question.type === "rating" && !updatedQuestion.displayMode) {
              updatedQuestion.displayMode = "buttons";
            }

            return updatedQuestion;
          }
        }
        return question;
      });
      return { ...page, questions: newQuestions };
    }
    return page;
  });
  setSurvey({ ...survey, pages: newPages });
};

  const addChoice = (pageIndex, questionIndex) => {
    const newPages = survey.pages.map((page, pIndex) => {
      if (pIndex === pageIndex) {
        const newQuestions = page.questions.map((question, qIndex) => {
          if (qIndex === questionIndex) {
            const newChoices = question.choices ? [...question.choices, ""] : [""];
            return { ...question, choices: newChoices };
          }
          return question;
        });
        return { ...page, questions: newQuestions };
      }
      return page;
    });

    setSurvey({ ...survey, pages: newPages });
  };

  const removeChoice = (pageIndex, questionIndex, choiceIndex) => {
    const newPages = survey.pages.map((page, pIndex) => {
      if (pIndex === pageIndex) {
        const newQuestions = page.questions.map((question, qIndex) => {
          if (qIndex === questionIndex) {
            const newChoices = question.choices.filter((_, cIndex) => cIndex !== choiceIndex);
            return { ...question, choices: newChoices };
          }
          return question;
        });
        return { ...page, questions: newQuestions };
      }
      return page;
    });
  
    setSurvey({ ...survey, pages: newPages });
  };  

  const updateChoice = (pageIndex, questionIndex, choiceIndex, value) => {
    const newPages = survey.pages.map((page, pIndex) => {
      if (pIndex === pageIndex) {
        const newQuestions = page.questions.map((question, qIndex) => {
          if (qIndex === questionIndex) {
            const newChoices = question.choices.map((choice, cIndex) => {
              if (cIndex === choiceIndex) {
                return value;
              }
              return choice;
            });
            return { ...question, choices: newChoices };
          }
          return question;
        });
        return { ...page, questions: newQuestions };
      }
      return page;
    });

    setSurvey({ ...survey, pages: newPages });
  };

  const deleteQuestion = (pageIndex, questionIndex) => {
    const newPages = survey.pages.map((page, pIndex) => {
      if (pIndex === pageIndex) {
        const newQuestions = page.questions.filter((_, qIndex) => qIndex !== questionIndex);
        return { ...page, questions: newQuestions };
      }
      return page;
    });
    setSurvey({ ...survey, pages: newPages });
    if (selectedQuestion && selectedQuestion.pageIndex === pageIndex && selectedQuestion.questionIndex === questionIndex) {
      setSelectedQuestion(null);
    }
  };
  

  const deletePage = (pageIndex) => {
    const newPages = survey.pages.filter((_, index) => index !== pageIndex);
    setSurvey({ ...survey, pages: newPages });
    if (selectedQuestion && selectedQuestion.pageIndex === pageIndex) {
      setSelectedQuestion(null);
    }
  };

  const validateNewSurveyName = (value) => {
    var valid = value === "" || /^[A-Za-z0-9_]+$/.test(value);
    return valid;
};



const saveSurvey = () => {
    // Create a copy of the survey to avoid direct mutation
    let newSurvey = { ...survey };

    // Initialize a question counter
    let questionCounter = 0;

    // Iterate over each page and its questions
    newSurvey.pages = newSurvey.pages.map((page) => {
        let newQuestions = page.questions.map((question) => {
            if (question.inputType === "email") {
                // Keep the name as "email" for email questions
                return { ...question, name: "email" };
            } else {
                // Assign a unique name based on the counter
                return { ...question, name: `qid${questionCounter++}` };
            }
        });
        return { ...page, questions: newQuestions };
    });

    // Serialize the survey to JSON
    const surveyJson = JSON.stringify(newSurvey);

    // Validate the filename
    if (!validateNewSurveyName(filename)) {
      setShowConfirmDialogValid(true);
      return;
    }

    // Check if the filename already exists
    if (availableSurveys.includes(filename)) {
      setOverwriteFilename(filename);
      // User confirmed overwrite, proceed to save
      setSurveyJsonToSave(surveyJson);
      setShowConfirmDialogOverwrite(true);
      return;
    } else {
        // Filename is new, proceed to save
        saveSurveyToFile(filename, surveyJson);
    }
};

// Helper function to save the survey
const saveSurveyToFile = (filename, surveyJson) => { 
  props.model.saveSurvey(filename, surveyJson, (response) => {
    let responseMessage = '';
    if (typeof response === 'object' && response !== null) {
      if (response.error) {
        responseMessage = `Fel: ${response.error}`;
      } else {
        responseMessage = 'Fil sparad';
      }
    } else {
      responseMessage = response;
    }
    
    setAlertDialogMessage(responseMessage);
    setShowAlertDialog(true);
    
    setAvailableSurveys((prevSurveys) => {
      // Avoid duplicates
      if (!prevSurveys.includes(filename)) {
        return [...prevSurveys, filename];
      }
      return prevSurveys;
    });
    setSelectedSurveyId(filename);
  });
};

const handleSurveySelection = (e) => {
  newSurvey();
  const selectedSurveyId = e.target.value;
  setSelectedSurveyId(selectedSurveyId);
  if (selectedSurveyId) {
    props.model.loadSurvey(selectedSurveyId, (surveyData) => {
      setSurvey(surveyData);
      setFilename(selectedSurveyId);
    });
  }
};


  const emptySurvey = {
    title: "",
    language: "sv",
    logo: "",
    logoWidth: 60,
    logoHeight: 60,
    logoPosition: "left",
    showQuestionNumbers: "false",
    pages: [{ questions: [] }]
  };

  const newSurvey = () => {
    setSelectedQuestion(null);
    setFilename("");
    setSurvey(emptySurvey);
    setSelectedSurveyId("");
  }

  const GeometryWarning = ({ survey }) => {
    const [warningPages, setWarningPages] = useState([]);

    useEffect(() => {
      const pagesWithMultipleGeometry = survey.pages.reduce((acc, page, pageIndex) => {
        const geometryQuestions = page.questions.filter((question) =>
          question.type.startsWith('geometry')
        );
        if (geometryQuestions.length > 1) {
          acc.push(pageIndex + 1); // add pagenumber
        }
        return acc;
      }, []);

      setWarningPages(pagesWithMultipleGeometry);
    }, [survey]);

    if (warningPages.length === 0) {
      return null; // No warning needed
    }

    return (
      <div style={{ backgroundColor: 'yellow', padding: '10px', marginBottom: '10px' }}>
        <strong>Varning:</strong> Följande sidor innehåller mer än en geometri-fråga: sida {warningPages.join(', ')}
      </div>
    );
  };

  return (
    <div>
      <h1>Enkäthanterare</h1>
    
      <Grid container spacing={2} style={{ marginBottom: '20px' }}>
      <Grid item>
      Välj en befintlig enkät: 
      <select value={selectedSurveyId} onChange={handleSurveySelection}>
        <option value=""></option>
          {availableSurveys.map((survey, index) => (
            <option key={index} value={survey.id}>
          {survey}
        </option>
          ))}
      </select>

        </Grid>
        <Grid item><Button variant="contained" color="primary" onClick={newSurvey}>Töm fält</Button></Grid>
        </Grid>
        <Grid container spacing={2} style={{ marginBottom: '20px' }}>
        <Grid item><TextField
          label="Enkätens Filnamn"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          style={{ marginRight: '10px' }}
          InputProps={{
            style: {
              fontSize: 12,
            },
          }}
          InputLabelProps={{
            style: {
              fontSize: 14,
            },
          }}
        /></Grid>
        </Grid>
      <Grid container spacing={2} style={{ marginBottom: '20px' }}>
        <Grid item>
          <TextField
            label="Enkätens Titel"
            value={survey.title}
            onChange={(e) => setSurvey({ ...survey, title: e.target.value })}
            style={{ marginRight: '10px' }}
            InputProps={{
              style: {
                fontSize: 12,
              },
            }}
            InputLabelProps={{
              style: {
                fontSize: 14,
              },
            }}
          />
        </Grid>
        <Grid item>
          <TextField
            label="Logo URL"
            value={survey.logo}
            onChange={(e) => setSurvey({ ...survey, logo: e.target.value })}
            style={{ marginRight: '10px' }}
            InputProps={{
              style: {
                fontSize: 12,
              },
            }}
            InputLabelProps={{
              style: {
                fontSize: 14,
              },
            }}
          />
        </Grid>
        <Grid item>
          <TextField
            label="Logo Bredd"
            type="number"
            value={survey.logoWidth}
            onChange={(e) => setSurvey({ ...survey, logoWidth: parseInt(e.target.value, 10) })}
            style={{ marginRight: '10px' }}
            InputProps={{
              style: {
                fontSize: 12,
              },
            }}
            InputLabelProps={{
              style: {
                fontSize: 14,
              },
            }}
          />
        </Grid>
        <Grid item>
          <TextField
            label="Logo Höjd"
            type="number"
            value={survey.logoHeight}
            onChange={(e) => setSurvey({ ...survey, logoHeight: parseInt(e.target.value, 10) })}
            InputProps={{
              style: {
                fontSize: 12,
              },
            }}
            InputLabelProps={{
              style: {
                fontSize: 14,
              },
            }}
          />
        </Grid>
      </Grid>
      <div style={{ marginBottom: '10px' }}>
        <Button variant="contained" color="primary" onClick={addPage}>Lägg till Sida</Button>
        <Button variant="contained" style={{ backgroundColor: 'green', color: 'white',  marginLeft: '20px' }} onClick={saveSurvey}>Spara Enkät</Button>
        <GeometryWarning survey={survey} />
      </div>
      <Grid container spacing={2} style={{ marginBottom: '50px' }}>
      <Grid item xs={12} sm={6}>
    <div style={{ backgroundColor: '#f0f0f0', padding: '20px' }}>
      <div className="App">
        {survey.pages.map((page, pageIndex) => (
          <div key={pageIndex} style={{ marginBottom: '0px', border: '1px solid #ccc', padding: '0px', backgroundColor: '#f0f0f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0px' }}>
              <h4>Sida {pageIndex + 1}</h4>
              <Button variant="contained" color="secondary" onClick={() => deletePage(pageIndex)}>Ta bort Sida</Button>
            </div>
            {page.questions.map((question, questionIndex) => (
              <p key={questionIndex} onClick={() => handleQuestionClick(pageIndex, questionIndex)}>
                {question.title ? 
                  `${question.title} (${question.inputType === 'email' ? 'Epost' : question.type})` : 
                  `Fråga ${questionIndex + 1} (${question.inputType === 'email' ? 'Epost' : question.type})`}

              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  </Grid>

  <Grid item xs={12} sm={6}>
    <div style={{ backgroundColor: '#f0f0f0', padding: '20px' }}>
      <div>
        <h4>Redigera vald fråga</h4>
        
        <Select 
          value={selectedPageIndex} 
          onChange={(e) => handlePageSelection(parseInt(e.target.value, 10))}
        >
          {survey.pages.map((_, index) => (
            <MenuItem key={index} value={index}>Sida {index + 1}</MenuItem>
          ))}
        </Select>

        <Button variant="contained" color="primary" onClick={() => addQuestion(selectedPageIndex)} style={{ marginTop: '10px' }}>Lägg till Fråga</Button>
        <hr></hr>
        {renderSelectedQuestionForm()}
      </div>
    </div>
  </Grid>
</Grid>
{showConfirmDialogValid && (
        <Dialog open={showConfirmDialogValid} onClose={handleDialogAbortValid}>
          <DialogTitle>Fel i filnamn?</DialogTitle>
          <DialogContent>
          Ogiltigt filnamn. Endast bokstäver, siffror och understreck är tillåtet.
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogCloseValid} color="primary" autoFocus>
              Stäng dialogruta
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {showConfirmDialogOverwrite && (
        <Dialog open={showConfirmDialogOverwrite} onClose={handleCancelOverwrite}>
          <DialogTitle>Spara enkät</DialogTitle>
          <DialogContent>
            {`Enkät "${overwriteFilename}" finns redan. Vill du skriva över den?`}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelOverwrite} color="primary">
              Avbryt
            </Button>
            <Button onClick={handleConfirmOverwrite} color="primary" autoFocus>
              Spara
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {showAlertDialog && (
        <Dialog open={showAlertDialog} onClose={handleCloseAlertDialog}>
          <DialogTitle>Meddelande</DialogTitle>
          <DialogContent>
            {alertDialogMessage}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAlertDialog} color="primary" autoFocus>
              Stäng
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
}

export default SurveyHandler;
