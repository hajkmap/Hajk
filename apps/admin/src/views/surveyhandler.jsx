import React, { useState, useEffect } from 'react';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { Checkbox, FormControlLabel, Typography } from '@material-ui/core/';
import { Accordion, AccordionSummary, AccordionDetails } from '@material-ui/core/';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

function SurveyHandler(props) {

  const [availableSurveys, setAvailableSurveys] = useState([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [filename, setFilename] = useState("");

  //const initialCompletedHtmlButton = '<button type="button" onclick="window.location.reload()" style="display: block; margin: 0 auto;">Gör enkäten igen!</button>';
  const initialCompletedHtmlText = "<h4>Tack för att du svarade på våra frågor!</h4>";
  const [completedHtmlText, setCompletedHtmlText] = useState(initialCompletedHtmlText);
  const [completedHtmlButton, setCompletedHtmlButton] = useState('');
  const [buttonText, setButtonText] = useState('Gör enkäten igen!');
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);

  const [survey, setSurvey] = useState({
    title: "",
    language: "sv",
    logo: "",
    logoWidth: 60,
    logoHeight: 60,
    logoPosition: "left",
    showQuestionNumbers: "false",
    completedHtml: "",
    pages: [{ questions: [] }]
  });

  const removeButtonHtml = (htmlString) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    const buttons = tempDiv.querySelectorAll('button');
    buttons.forEach(button => button.remove());
    return tempDiv.innerHTML;
  };

  const onlyButtonHtml = (htmlString) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    const buttons = tempDiv.querySelectorAll('button');
    const buttonHtml = Array.from(buttons).map(button => button.outerHTML).join('');
    return buttonHtml;
  };

  useEffect(() => {
    if (isButtonEnabled) {
      setCompletedHtmlButton(
        `<button type="button" onclick="window.location.reload()" style="display: block; margin: 0 auto;">${buttonText}</button>`
      );
    } else {
      setCompletedHtmlButton('');
    }
  }, [isButtonEnabled, buttonText]);

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
        <input
          type="text"
          value={question.title}
          onChange={(e) => updateQuestion(selectedQuestion.pageIndex, selectedQuestion.questionIndex, 'title', e.target.value)}
        />
        <Select
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
        <div>
        <label>
          Obligatorisk:
            <input
            type="checkbox"
            checked={question.isRequired || false}
            onChange={(e) => updateQuestion(selectedQuestion.pageIndex, selectedQuestion.questionIndex, 'isRequired', e.target.checked)}
            />
        </label>
        </div>
        {question.type === "checkbox" || question.type === "radiogroup" ? (
      <div>
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
        <div><textarea
          style={{ width: '100%', height: '100px', display: 'block' }}
          value={question.html}
          onChange={(e) => updateQuestion(selectedQuestion.pageIndex, selectedQuestion.questionIndex, 'html', e.target.value)}
          placeholder="Skriv HTML-kod här"
        />
        </div>
      )}

      {question.type === "rating" && (
        <div>
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
    var valid = value === "" || /^[A-Za-z0-9]+$/.test(value);
    return valid;
};



const saveSurvey = () => {
    // Create a copy of the survey to avoid direct mutation
    let newSurvey = { ...survey };

    // Initialize a question counter
    let questionCounter = 0;

    // Combine completedHtmlText and button
    newSurvey.completedHtml = completedHtmlText + completedHtmlButton

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
        alert('Ogiltigt filnamn. Endast bokstäver och siffror är tillåtna.');
        return;
    }

    // Check if the filename already exists
    if (availableSurveys.includes(filename)) {
        if (window.confirm(`Enkät "${filename}" finns redan. Vill du skriva över den?`)) {
            // User confirmed overwrite, proceed to save
            saveSurveyToFile(filename, surveyJson);
        } else {
            // User cancelled overwrite, do nothing
            return;
        }
    } else {
        // Filename is new, proceed to save
        saveSurveyToFile(filename, surveyJson);
    }
};

// Helper function to save the survey
const saveSurveyToFile = (filename, surveyJson) => {
    props.model.saveSurvey(filename, surveyJson, (response) => {
        if (typeof response === 'object' && response !== null) {
            let responseString = '';
            for (const [key, value] of Object.entries(response)) {
                responseString += `${key}: ${value}\n`;
            }
            alert(responseString);
        } else {
            alert(response);
        }
        
        setAvailableSurveys((prevSurveys) => {
          // Avoid duplicates
          if (!prevSurveys.includes(filename)) {
            return [...prevSurveys, filename];
          }
          return prevSurveys;
        });
        setSelectedSurveyId(survey.title);
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

      if (surveyData.completedHtml === undefined || surveyData.completedHtml.trim() === "") {
        setCompletedHtmlText("");
        setCompletedHtmlButton("");
        setButtonText("");
        setIsButtonEnabled(false);
      } else {
        const textHtml = removeButtonHtml(surveyData.completedHtml);
        const buttonHtml = onlyButtonHtml(surveyData.completedHtml);

        setCompletedHtmlText(textHtml);
        setCompletedHtmlButton(buttonHtml);

        if (buttonHtml.trim() !== "") {
          setIsButtonEnabled(true);

          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = buttonHtml;
          const buttonElement = tempDiv.querySelector('button');
          if (buttonElement) {
            setButtonText(buttonElement.textContent);
          } else {
            setButtonText("");
          }
        } else {
          setIsButtonEnabled(false);
          setButtonText("");
        }
      }
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
    completedHtml: "",
    pages: [{ questions: [] }]
  };

  const newSurvey = () => {
    setSelectedQuestion(null);
    setFilename("");
    setSurvey(emptySurvey);
    setSelectedSurveyId("");
    setCompletedHtmlButton("");
    setCompletedHtmlText(initialCompletedHtmlText);
    setIsButtonEnabled(false);
    setButtonText("Gör enkäten igen!");
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
      <Grid container spacing={2} style={{ marginBottom: '10px' }}>
        <Grid item xs={5}>
          <TextField
            label="Svar vid färdigställd enkät (html kan användas, ej <button>)"
            value={completedHtmlText}
            onChange={(e) => setCompletedHtmlText(e.target.value)}
            style={{ marginRight: '10px' }}
            fullWidth
            InputLabelProps={{ shrink: true }}
            InputProps={{
              style: {
                fontSize: 12,
              },
            }}
          />
        </Grid>
        <Grid item xs={7}>
        <div>
          {/* Checkbox for activate/deactivare button */}
      <FormControlLabel
        control={
          <Checkbox
            checked={isButtonEnabled}
            onChange={(e) => setIsButtonEnabled(e.target.checked)}
            color="primary"
          />
        }
        label={
          <Typography variant="body2" style={{ fontSize: '12px' }}>
            Aktivera omstartsknapp
          </Typography>
        }
        style={{ marginTop: '2px' }}
      />
      
      {/* Textfield for button text */}
      <TextField
        label="Knapptext för att starta om enkäten (ej html, OBS! Aktiveras för att sparas)"
        value={buttonText}
        onChange={(e) => setButtonText(e.target.value)}
        fullWidth
        InputLabelProps={{ shrink: true }}
        InputProps={{
          style: {
            fontSize: 12,
          },
        }}
      />

      {/* Accordion to show button HTML-string */}
      <Accordion style={{ marginTop: '2px' }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
        <Typography style={{ fontSize: '12px' }}>Visa och redigera knappens HTML-sträng</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField
            label="Knappens HTML-sträng"
            value={completedHtmlButton}
            onChange={(e) => setCompletedHtmlButton(e.target.value)}
            fullWidth
            multiline
            InputLabelProps={{ shrink: true }}
            InputProps={{
              style: {
                fontSize: 12,
              },
            }}
          />
        </AccordionDetails>
      </Accordion>
    </div>
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
    </div>
    
  );
}

export default SurveyHandler;
