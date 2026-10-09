import FeedbackService from "../../services/feedback.service.js";
import handleStandardResponse from "../../utils/handleStandardResponse.js";
import log4js from "log4js";

// Create a logger for admin events, those will be saved in a separate log file.
const ael = log4js.getLogger("adminEvent.v2");

/**
 * @summary Parse a JSON request body that arrives as a string.
 * @returns {object} The parsed body, or { error } with statusCode 400 if parsing fails.
 */
function parseJsonBody(body) {
  try {
    return typeof body === "string" ? JSON.parse(body) : body || {};
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.statusCode = 400;
    return { error };
  }
}

export class Controller {
  challenge(req, res) {
    FeedbackService.getChallenge().then((r) => {
      // Each challenge may only be used once, so never cache them
      res.set("Cache-Control", "no-store");
      handleStandardResponse(res, r);
    });
  }

  submit(req, res) {
    const body = parseJsonBody(req.body);
    if (body.error) return handleStandardResponse(res, body);

    FeedbackService.submit(
      body,
      res.locals.authUser,
      req.get("User-Agent")
    ).then((r) => handleStandardResponse(res, r, 201));
  }

  list(req, res) {
    FeedbackService.getAll(req.query.since).then((r) =>
      handleStandardResponse(res, r)
    );
  }

  stats(req, res) {
    FeedbackService.getStats().then((r) => handleStandardResponse(res, r));
  }

  deleteAll(req, res) {
    FeedbackService.deleteAll().then((r) => {
      handleStandardResponse(res, r);
      if (!r.error) {
        ael.info(`deleted all feedback (${r.deletedFiles} files).`);
      }
    });
  }
}

export default new Controller();
