import { FirModelBase } from "../Fir/FirModel";

export default class KirModel extends FirModelBase {
  constructor(settings) {
    super(settings, "kir", ["buffer", "draw", "marker", "features"]);
  }
}
