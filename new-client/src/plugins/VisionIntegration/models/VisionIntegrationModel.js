// A simple class containing functionality that is used in the VisionIntegration-plugin.
class VisionIntegrationModel {
  #options;

  // There will probably not be many settings for this model... Options are required though!
  constructor(settings) {
    this.#options = settings.options || {};
  }

  // Makes sure that the supplied options contains all required settings.
  configurationIsValid = () => {
    // Let's destruct all options we want to check...
    const { hubUrl } = this.#options;
    // Make sure that the supplied hub-url (url to the communication hub between Vision and Hajk is a valid string).
    if (!hubUrl || typeof hubUrl !== "string" || hubUrl.length < 1) {
      return false;
    }
    // If we've made it this far, we're all good!
    return true;
  };
}

export default VisionIntegrationModel;
