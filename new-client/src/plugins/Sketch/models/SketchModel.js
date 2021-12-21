import { ACTIVITIES } from "../constants";

class SketchModel {
  // Returns the activity-object connected to the supplied id
  getActivityFromId = (id) => {
    return ACTIVITIES.find((activity) => {
      return activity.id === id;
    });
  };
}
export default SketchModel;
