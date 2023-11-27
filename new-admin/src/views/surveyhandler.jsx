import React, { useState } from 'react';

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

  const addPage = () => {
    setSurvey(prevSurvey => ({
      ...prevSurvey,
      pages: [...prevSurvey.pages, { questions: [] }]
    }));
  };

  const addQuestion = (pageIndex) => {
    const newPages = survey.pages.map((page, index) => {
      if (index === pageIndex) {
        return { ...page, questions: [...page.questions, { title: "", type: "text" }] };
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
            return { ...question, [field]: value };
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
  };

  const deletePage = (pageIndex) => {
    const newPages = survey.pages.filter((_, index) => index !== pageIndex);
    setSurvey({ ...survey, pages: newPages });
  };

  const saveSurvey = () => {
    const surveyJson = JSON.stringify(survey);
    console.log(surveyJson);
  };

  const questionStyle = {
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '1px solid #ccc'
  };

  return (
    <div>
      <h1>Enkätskapare</h1>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={addPage}>Lägg till Sida</button>
        <button onClick={saveSurvey} style={{ marginLeft: '20px' }}>Spara Enkät</button>
      </div>
      
      {survey.pages.map((page, pageIndex) => (
        <div key={pageIndex} style={{ marginBottom: '40px', border: '1px solid #ccc', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h2>Sida {pageIndex + 1}</h2>
            <button onClick={() => deletePage(pageIndex)}>Ta bort Sida</button>
          </div>
  
          {page.questions.map((question, questionIndex) => (
            <div key={questionIndex} style={questionStyle}>
              <input
                type="text"
                placeholder="Frågetitel"
                value={question.title}
                onChange={(e) => updateQuestion(pageIndex, questionIndex, 'title', e.target.value)}
              />
              <select
                value={question.type}
                onChange={(e) => updateQuestion(pageIndex, questionIndex, 'type', e.target.value)}
              >
                <option value="text">Text</option>
                <option value="checkbox">Flerval</option>
                <option value="rating">Betyg</option>
                <option value="geometry">Geometri (Rita i kartan)</option>
              </select>
              {question.type === "checkbox" && (
                <div>
                  {question.choices && question.choices.map((choice, choiceIndex) => (
                    <input
                      key={choiceIndex}
                      type="text"
                      placeholder="Val"
                      value={choice}
                      onChange={(e) => updateChoice(pageIndex, questionIndex, choiceIndex, e.target.value)}
                    />
                  ))}
                  <button onClick={() => addChoice(pageIndex, questionIndex)}>Lägg till Val</button>
                </div>
              )}
              {question.type === "rating" && (
                <div>
                  <input
                    type="number"
                    placeholder="Rate Count"
                    value={question.rateCount || ''}
                    onChange={(e) => updateQuestion(pageIndex, questionIndex, 'rateCount', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Rate Max"
                    value={question.rateMax || ''}
                    onChange={(e) => updateQuestion(pageIndex, questionIndex, 'rateMax', e.target.value)}
                  />
                </div>
              )}
              <button onClick={() => deleteQuestion(pageIndex, questionIndex)}>Ta bort Fråga</button>
            </div>
          ))}
  
          <button onClick={() => addQuestion(pageIndex)} style={{ marginTop: '10px' }}>Lägg till Fråga</button>
        </div>
      ))}
    </div>
  );
}

export default SurveyHandler;
