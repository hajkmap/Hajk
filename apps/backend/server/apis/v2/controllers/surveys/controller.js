import SurveyService from "../../services/survey.service.js";
import log4js from "log4js";

// Create a logger for admin events, those will be saved in a separate log file.
const ael = log4js.getLogger("adminEvent.v2");

export class Controller {
  surveylist(req, res) {
    SurveyService.getAvailableSurveys().then((r) => {
      if (r && !r.error) res.json(r);
      else res.status(500).send(r.error.message);
    });
  }

  mailTemplateList(req, res) {
    SurveyService.getAvailableMailTemplates().then((r) => {
      if (r && !r.error) res.json(r);
      else res.status(500).send(r.error.message);
    });
  }

  getByNameSurvey(req, res) {
    SurveyService.getByNameSurvey(req.params.name).then((r) => {
      if (r && !r.error) res.json(r);
      else {
        res
          .status(404)
          .send(`Document "${req.params.name}" could not be found`);
      }
    });
  }

  getByNameSurveyLoad(req, res) {
    SurveyService.getByNameSurveyLoad(req.params.name).then((r) => {
      if (r && !r.error) res.json(r);
      else {
        res
          .status(404)
          .send(`Document "${req.params.name}" could not be found`);
      }
    });
  }

  saveByNameSurveyAnswer(req, res) {
    SurveyService.saveByNameSurveyAnswer(req.params.surveyId, req.body).then(
      (r) => {
        if (r && !r.error) {
          res.status(200).json({ message: "File saved" }); // Send back a JSON response
          ael.info(
            `${res.locals.authUser} saved document ${req.params.name}.json`
          );
        } else res.status(500).json({ error: r.error.message }); // Send back a JSON response
      }
    );
  }

  saveByNameSurvey(req, res) {
    SurveyService.saveByNameSurvey(req.params.surveyId, req.body).then((r) => {
      if (r && !r.error) {
        res.status(200).json({ message: "File saved" }); // Send back a JSON response
        ael.info(
          `${res.locals.authUser} saved document ${req.params.name}.json`
        );
      } else res.status(500).json({ error: r.error.message }); // Send back a JSON response
    });
  }
}
export default new Controller();
