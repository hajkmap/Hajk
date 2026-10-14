import CaptchaService from "../../services/captcha.service.js";
import handleStandardResponse from "../../utils/handleStandardResponse.js";

export class Controller {
  challenge(req, res) {
    CaptchaService.getChallenge().then((r) => {
      // Each challenge may only be used once, so never cache them
      res.set("Cache-Control", "no-store");
      handleStandardResponse(res, r);
    });
  }
}

export default new Controller();
