import { hfetch } from "../../../utils/FetchWrapper";

class FmeServerModel {
  #options;
  #mapServiceBase;

  constructor(settings) {
    this.#options = settings.options;
    this.#mapServiceBase = settings.app.config.appConfig.mapserviceBase;
  }

  // Returns the product matching the group and product name.
  getProduct = (groupName, productName) => {
    if (groupName?.length === 0 || productName?.length === 0) {
      return null;
    }
    return this.#options.products.find((product) => {
      return product.group === groupName && product.name === productName;
    });
  };

  // Returns all parameters except the one parameter stated
  // to be the one containing the geometry.
  getParametersToRender = (parameters, groupName, productName) => {
    // We must fetch the product
    const product = this.getProduct(groupName, productName);
    // And make sure it exists. If it doesn't we return an empty array
    if (!product) {
      return [];
    }
    // Otherwise we return the filtered parameters, where the parameter
    // with the geomAttribute as name is removed.
    return parameters.filter((parameter) => {
      return parameter.name !== product.geoAttribute;
    });
  };

  // Checks wether we should prompt the user for their email or not
  shouldPromptForEmail = (groupName, productName) => {
    // We must fetch the product
    const product = this.getProduct(groupName, productName);
    // And make sure it exists. If it doesn't we return false
    if (!product) {
      return false;
    }
    // Otherwise we return the parameter containing information regarding
    // email prompting
    return product.promptForEmail;
  };

  // Check wethers the provided string is a valid email
  isValidEmail = (emailString) => {
    if (typeof emailString !== "string") {
      return false;
    }
    const regExp = /\S+@\S+\.\S+/;
    return regExp.test(emailString);
  };

  // Fetches all product parameters from FME-server
  getProductParameters = async (groupName, productName) => {
    // If the product is missing for some reason, we return an
    // error and an empty array.
    const product = this.getProduct(groupName, productName);
    if (!product) {
      return { error: true, parameters: [] };
    }
    // If not, let's create the url used to fetch the parameters.
    const url = this.#createGetParametersUrl(product);
    // And then try to fetch the parameters using the url...
    try {
      const response = await hfetch(url);
      const data = await response.json();
      return { error: false, parameters: data };
    } catch (error) {
      return { error: true, parameters: [] };
    }
  };

  // Posts a request to run a workspace on FME-server.
  // Returns an object containing eventual error and eventual
  // jobId which can be used to check the status of the job.
  submitProductRequest = async (groupName, productName, parameters) => {
    // If the product is missing for some reason, we return an error
    // and null for the job id.
    const product = this.getProduct(groupName, productName);
    if (!product) {
      return { error: true, jobId: null };
    }
    // If not, let's create the url used to submit the workspace.
    const url = this.#createSubmitProductRequestUrl(product);
    // And then try to submit the job using the url...
    try {
      const response = await hfetch(url, {
        method: "POST",
        body: parameters,
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      return { error: false, jobId: data };
    } catch (error) {
      return { error: true, jobId: null };
    }
  };

  // Fetches the status for a submitted job
  getJobStatusById = async (jobId) => {
    // If the jobId is missing, we return an error.
    if (!jobId) {
      return { error: true, status: null };
    }
    // If not, let's create the url used to fetch the parameters.
    const url = this.#createProductStatusUrl(jobId);
    // And then try to fetch the status with the url...
    try {
      const response = await hfetch(url);
      const data = await response.json();
      return { error: false, status: data };
    } catch (error) {
      return { error: true, status: null };
    }
  };

  // Returns the url needed to fetch the product parameters from FME-server.
  #createGetParametersUrl = (product) => {
    return `${this.#mapServiceBase}/fmeproxy/fmerest/v3/repositories/${
      product.repository
    }/items/${product.workspace}/parameters`;
  };

  // Returns the url needed to post a request to start a workspace.
  #createSubmitProductRequestUrl = (product) => {
    return `${
      this.#mapServiceBase
    }/fmeproxy/fmerest/v3/transformations/submit/${product.repository}/${
      product.workspace
    }`;
  };

  // Returns the url needed to fetch information about a submitted job.
  // The required parameter, jobId is a string returned when queuing a job.
  #createProductStatusUrl = (jobId) => {
    return `${
      this.#mapServiceBase
    }/fmeproxy/fmerest/v3/transformations/jobs/id/${jobId}`;
  };
}
export default FmeServerModel;
