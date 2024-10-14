import React, { useState, useEffect } from 'react';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

function SurveyHandler(props) {

  const [availableSurveys, setAvailableSurveys] = useState([]);

  useEffect(() => {
    props.model.listAllAvailableSurveys((data) => {
        setAvailableSurveys(data);
    });
    // eslint-disable-next-line
}, []);

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

  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const handleQuestionClick = (pageIndex, questionIndex) => {
    setSelectedQuestion({ pageIndex, questionIndex });
    setSelectedPageIndex(pageIndex);
  };

  const [selectedPageIndex, setSelectedPageIndex] = useState(0);

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
            <div key={index}>
              <input
                type="text"
                value={choice}
                placeholder="Val"
                onChange={(e) => updateChoice(selectedQuestion.pageIndex, selectedQuestion.questionIndex, index, e.target.value)}
              />
            </div>
          ))}
          <Button variant="contained" color="primary" onClick={() => addChoice(selectedQuestion.pageIndex, selectedQuestion.questionIndex)}>Lägg till val</Button>
        </div>
      ): null}

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
            placeholder="Rate Count"
            value={question.rateCount || ''}
            onChange={(e) => updateQuestion(selectedQuestion.pageIndex, selectedQuestion.questionIndex, 'rateCount', e.target.value)}
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
    let newQuestion = { title: "", type, isRequired: false };
    if (type === "checkbox" || type === "radiogroup") {
        newQuestion.choices = [];
    } else if (type === "html") {
        newQuestion.html = "";
    }
    const newPages = survey.pages.map((page, index) => {
        if (index === pageIndex) {
            return { ...page, questions: [...page.questions, newQuestion] };
        }
        return page;
    });
    const newQuestionIndex = newPages[pageIndex].questions.length - 1;
    setSelectedQuestion({ pageIndex, questionIndex: newQuestionIndex });
    setSurvey({ ...survey, pages: newPages });
};

const updateQuestion = (pageIndex, questionIndex, field, value) => {
  const newPages = survey.pages.map((page, pIndex) => {
      if (pIndex === pageIndex) {
          const newQuestions = page.questions.map((question, qIndex) => {
              if (qIndex === questionIndex) {
                  let updatedQuestion = { ...question, [field]: value };
                  if (field === "type") {
                      if (value === "email") {
                          updatedQuestion = {
                              ...updatedQuestion,
                              type: "text",
                              inputType: "email",
                              placeholder: "namn@exempel.se"
                          };
                      } else {
                          delete updatedQuestion.inputType;
                          delete updatedQuestion.placeholder;
                      }
                  }
                  return updatedQuestion;
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

  const [filename, setFilename] = useState("");

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
        alert('Invalid filename. Only letters and numbers are allowed.');
        return;
    }

    // Save the survey
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
    });
};

  const handleSurveySelection = (e) => {
    const selectedSurveyId = e.target.value;
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
  }

  return (
    <div>
      <h1>Enkäthanterare</h1>
    
      <Grid container spacing={2} style={{ marginBottom: '50px' }}>
      <Grid item>
      Välj en befintlig enkät: 
        <select onChange={handleSurveySelection}>
        <option></option>
        {availableSurveys.map((survey, index) => (
            <option key={index} value={survey.id}>
                {survey}
            </option>
        ))}
        
    </select>
        </Grid>
        <Grid item><Button variant="contained" color="primary" onClick={newSurvey}>Ny enkät</Button></Grid>
        </Grid>
        <Grid container spacing={2} style={{ marginBottom: '50px' }}>
        <Grid item><TextField
          label="Enkätens Filnamn"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          style={{ marginRight: '10px' }}
        /></Grid>
        </Grid>
      <Grid container spacing={2} style={{ marginBottom: '50px' }}>
        <Grid item>
          <TextField
            label="Enkätens Titel/filnamn"
            value={survey.title}
            onChange={(e) => setSurvey({ ...survey, title: e.target.value })}
            style={{ marginRight: '10px' }}
          />
        </Grid>
        <Grid item>
          <TextField
            label="Logo URL"
            value={survey.logo}
            onChange={(e) => setSurvey({ ...survey, logo: e.target.value })}
            style={{ marginRight: '10px' }}
          />
        </Grid>
        <Grid item>
          <TextField
            label="Logo Bredd"
            type="number"
            value={survey.logoWidth}
            onChange={(e) => setSurvey({ ...survey, logoWidth: parseInt(e.target.value, 10) })}
            style={{ marginRight: '10px' }}
          />
        </Grid>
        <Grid item>
          <TextField
            label="Logo Höjd"
            type="number"
            value={survey.logoHeight}
            onChange={(e) => setSurvey({ ...survey, logoHeight: parseInt(e.target.value, 10) })}
          />
        </Grid>
      </Grid>

      <div style={{ marginBottom: '10px' }}>
        <Button variant="contained" color="primary" onClick={addPage}>Lägg till Sida</Button>
        <Button variant="contained" style={{ backgroundColor: 'green', color: 'white',  marginLeft: '20px' }} onClick={saveSurvey}>Spara Enkät</Button>
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
