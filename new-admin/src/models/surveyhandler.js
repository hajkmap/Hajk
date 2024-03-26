import { Model } from "backbone";
import { hfetch } from "utils/FetchWrapper";

var surveyHandler = Model.extend({
  listAllAvailableSurveys: function (callback) {
    const surveysListUrl = this.get("config").url_surveys_list;

    hfetch(surveysListUrl)
      .then((response) => response.json())
      .then((data) => {
        callback(data);
      })
      .catch((error) => {
        console.error("Error fetching surveys:", error);
      });
  },

  loadSurvey: function (surveyName, callback) {
    const surveyLoadUrl = this.get("config").url_surveys_load + surveyName;

    hfetch(surveyLoadUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        callback(data);
      })
      .catch((error) => {
        console.error("Error loading survey:", error);
      });
  },

  saveSurvey: function (surveyName, data, callback) {
    const surveySaveUrl = this.get("config").url_surveys_save + surveyName;
    const requestBody = data;

    hfetch(surveySaveUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: requestBody,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((responseData) => {
        callback(responseData);
      })
      .catch((error) => {
        console.error("Error saving or updating survey:", error);
      });
  },
});

export default surveyHandler;
