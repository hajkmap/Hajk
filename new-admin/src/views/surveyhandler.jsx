import React, { useState } from 'react';

function SurveyHandler() {
  const [questions, setQuestions] = useState([]);

  const addQuestion = () => {
    setQuestions([...questions, { title: "", type: "text" }]);
  };

  const updateQuestion = (index, field, value) => {
    let updatedQuestion = { ...questions[index], [field]: value };

    if (field === 'type' && value === 'checkbox') {
      updatedQuestion.choices = updatedQuestion.choices || [];
    } else if (field === 'type' && value === 'rating') {
      updatedQuestion = { ...updatedQuestion, rateCount: 8, rateMax: 8, rateType: "smileys", scaleColorMode: "colored", displayMode: "buttons" };
    } else if (field === 'type' && value !== 'checkbox' && value !== 'rating') {
      delete updatedQuestion.choices;
    }

    const newQuestions = questions.map((q, i) => {
      if (i === index) {
        return updatedQuestion;
      }
      return q;
    });
    setQuestions(newQuestions);
  };

  const updateChoice = (questionIndex, choiceIndex, value) => {
    const newQuestions = questions.map((q, i) => {
      if (i === questionIndex) {
        const newChoices = q.choices.map((choice, j) => {
          if (j === choiceIndex) {
            return value;
          }
          return choice;
        });
        return { ...q, choices: newChoices };
      }
      return q;
    });
    setQuestions(newQuestions);
  };

  const addChoice = (questionIndex) => {
    const newQuestions = questions.map((q, i) => {
      if (i === questionIndex) {
        const newChoices = q.choices ? [...q.choices, ""] : [""];
        return { ...q, choices: newChoices };
      }
      return q;
    });
    setQuestions(newQuestions);
  };

  const deleteQuestion = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const saveSurvey = () => {
    const surveyJson = JSON.stringify({ questions });
    console.log(surveyJson);
  };

  const questionStyle = {
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '1px solid #ccc'
  };

  return (
    <div>
      <h1>Enkäthanterare</h1>
      <button onClick={addQuestion}>Lägg till Fråga</button>
      <button onClick={saveSurvey}>Spara Enkät</button>
      <div>
        {questions.map((question, index) => (
          <div key={index} style={questionStyle}>
            <input
              type="text"
              placeholder="Frågetitel"
              value={question.title}
              onChange={(e) => updateQuestion(index, 'title', e.target.value)}
            />
            <select
              value={question.type}
              onChange={(e) => updateQuestion(index, 'type', e.target.value)}
            >
              <option value="text">Text</option>
              <option value="checkbox">Flerval</option>
              <option value="rating">Betyg</option>
            </select>
            {question.type === "checkbox" && (
              <div>
                {question.choices.map((choice, choiceIndex) => (
                  <input
                    key={choiceIndex}
                    type="text"
                    placeholder="Val"
                    value={choice}
                    onChange={(e) => updateChoice(index, choiceIndex, e.target.value)}
                  />
                ))}
                <button onClick={() => addChoice(index)}>Lägg till Val</button>
              </div>
            )}
            {question.type === "rating" && (
              <div>
                <input
                  type="number"
                  placeholder="Rate Count"
                  value={question.rateCount || ''}
                  onChange={(e) => updateQuestion(index, 'rateCount', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Rate Max"
                  value={question.rateMax || ''}
                  onChange={(e) => updateQuestion(index, 'rateMax', e.target.value)}
                />
              </div>
            )}
            <button onClick={() => deleteQuestion(index)}>Ta bort Fråga</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SurveyHandler;
