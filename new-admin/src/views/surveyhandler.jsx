import React, { useState } from 'react';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';

function SurveyHandler() {
  const [survey, setSurvey] = useState({
    title: "Rynningeviken",
    language: "sv",
    logo: "https://www.orebro.se/images/18.242f1fb1556288bfbf1594c/1467796106738/Orebro_se-logo.png",
    logoWidth: 60,
    logoHeight: 60,
    logoPosition: "left",
    pages: [{ questions: [] }]
  });

  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const handleQuestionClick = (pageIndex, questionIndex) => {
    setSelectedQuestion({ pageIndex, questionIndex });
  };

  const renderSelectedQuestionForm = () => {
    if (selectedQuestion === null) return null;
    const question = survey.pages[selectedQuestion.pageIndex].questions[selectedQuestion.questionIndex];
    return (
      <div>
        <input
          type="text"
          value={question.title}
          onChange={(e) => updateQuestion(selectedQuestion.pageIndex, selectedQuestion.questionIndex, 'title', e.target.value)}
        />
        <select
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
        <option value="text">Text</option>
        <option value="email">E-post</option>
        <option value="html">Info</option>
        <option value="checkbox">Flerval</option>
        <option value="radiogroup">Enkelval (radioknapp)</option>
        <option value="rating">Betyg</option>
        <option value="geometry">Alla geometriverktyg</option>
        <option value="geometrypoint">Geometriverktyget punkt</option>
        <option value="geometrylinestring">Geometriverktyget linje</option>
        <option value="geometrypolygon">Geometriverktyget yta</option>
        </select>
        {question.type === "checkbox" || question.type === "radiogroup" ? (
        <div>
          {question.choices && question.choices.map((choice, index) => (
            <div key={index}>
              <input
                type="text"
                value={choice}
                onChange={(e) => updateChoice(selectedQuestion.pageIndex, selectedQuestion.questionIndex, index, e.target.value)}
              />
            </div>
          ))}
          <button onClick={() => addChoice(selectedQuestion.pageIndex, selectedQuestion.questionIndex)}>Lägg till val</button>
        </div>
      ): null}

      {question.type === "html" && (
        <textarea
          value={question.html}
          onChange={(e) => updateQuestion(selectedQuestion.pageIndex, selectedQuestion.questionIndex, 'html', e.target.value)}
        />
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
        <button onClick={deleteSelectedQuestion}>Ta bort Fråga</button>
      </div>
    );
  };

  const deleteSelectedQuestion = () => {
    if (selectedQuestion === null) return;
    deleteQuestion(selectedQuestion.pageIndex, selectedQuestion.questionIndex);
    setSelectedQuestion(null); // Nollställ vald fråga efter borttagning
  };

  const addPage = () => {
    setSurvey(prevSurvey => ({
      ...prevSurvey,
      pages: [...prevSurvey.pages, { questions: [] }]
    }));
  };

  const addQuestion = (pageIndex, type = "text") => {
    let newQuestion = { title: "", type };
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
    setSurvey({ ...survey, pages: newPages });
  };
  
  const updateQuestion = (pageIndex, questionIndex, field, value) => {
    const newPages = survey.pages.map((page, pIndex) => {
      if (pIndex === pageIndex) {
        const newQuestions = page.questions.map((question, qIndex) => {
          if (qIndex === questionIndex) {
            let updatedQuestion = { ...question };
            if (value === "email") {
              updatedQuestion = {
                ...updatedQuestion,
                type: "text",
                inputType: "email",
                name: "email",
                placeholder: "namn@exempel.se"
              };
            } else {
              updatedQuestion = { ...updatedQuestion, [field]: value };
              if (field === "type" && value !== "text") {
                delete updatedQuestion.inputType;
                delete updatedQuestion.name;
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

  const saveSurvey = () => {
    const surveyJson = JSON.stringify(survey);
    console.log(surveyJson);
  };

  return (
    <div>
      <h1>Enkäthanterare</h1>
    
      <Grid container spacing={2} style={{ marginBottom: '50px' }}>
        <Grid item>
          <TextField
            label="Enkätens Titel"
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
        <button onClick={addPage}>Lägg till Sida</button>
        <button onClick={saveSurvey} style={{ marginLeft: '20px' }}>Spara Enkät</button>
      </div>
      <Grid container spacing={2} style={{ marginBottom: '50px' }}>
      <Grid item xs={12} sm={6}>
    <div style={{ backgroundColor: '#f0f0f0', padding: '20px' }}>
      <div className="App">
        {survey.pages.map((page, pageIndex) => (
          <div key={pageIndex} style={{ marginBottom: '40px', border: '1px solid #ccc', padding: '20px', backgroundColor: '#f0f0f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4>Sida {pageIndex + 1}</h4>
              <button onClick={() => deletePage(pageIndex)}>Ta bort Sida</button>
            </div>
            {page.questions.map((question, questionIndex) => (
              <p key={questionIndex} onClick={() => handleQuestionClick(pageIndex, questionIndex)}>
                {question.title ? 
                  `${question.title} (${question.inputType === 'email' ? 'Epost' : question.type})` : 
                  `Fråga ${questionIndex + 1} (${question.inputType === 'email' ? 'Epost' : question.type})`}

              </p>
            ))}
            <button onClick={() => addQuestion(pageIndex)} style={{ marginTop: '10px' }}>Lägg till Fråga</button>
          </div>
        ))}
      </div>
    </div>
  </Grid>

  <Grid item xs={12} sm={6}>
    <div style={{ backgroundColor: '#f0f0f0', padding: '20px' }}>
      <div>
        <h4>Redigera vald fråga</h4>
        {renderSelectedQuestionForm()}
      </div>
    </div>
  </Grid>
</Grid>

    </div>
    
  );
}

export default SurveyHandler;
