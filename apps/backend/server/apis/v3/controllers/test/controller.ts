import handleStandardResponse from "../../utils/handleStandardResponse.ts";

export class Controller {
  test(req, res) {
    handleStandardResponse(res, {
      message: `Hello ${req.params.variable || "World"}! API V3 is under construction - stay tuned`,
    });
  }
}
export default new Controller();
