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
});

export default surveyHandler;
