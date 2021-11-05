import { hfetch } from "../../../utils/FetchWrapper";

class FmeServerModel {
  #options;
  #mapServiceBase;
  #mapViewModel;

  constructor(settings) {
    this.#options = settings.options;
    this.#mapServiceBase = settings.app.config.appConfig.mapserviceBase;
    this.#mapViewModel = settings.mapViewModel;
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

  // Entry point for when user clicks the "Order" button.
  // We're targeting different FME-server endpoints determined by wether
  // The userEmail has been supplied or not. (If the userEmail is supplied
  // it means that the admin has registered the product as an data-download
  // product rather than a product that should target the regular FME-server REST-API).
  makeOrder = (groupName, productName, productParameters, userEmail) => {
    // We're gonna need the product
    const product = this.getProduct(groupName, productName);
    // If user email is supplied, it means that we are dealing
    // with data-download, not the ordinary REST-api
    if (userEmail !== "") {
      return this.#makeDataDownloadOrder(product, productParameters, userEmail);
    }
    // If it is not, we're dealing with the regular REST-application
    return this.#makeRestApiOrder(product, productParameters);
  };

  // Creates a string to be used for the data-download request
  // Built upon the userEmail and the parameterValues.
  #createRequestUrlString = (product, productParameters, userEmail) => {
    // We're gonna need some base information in the request string, let's add
    // that first.
    let requestString = `opt_servicemode=async&opt_responseformat=json&opt_requesteremail=${userEmail}&`;
    // Let's check wether their will be a geometry to send
    if (!this.noGeomAttributeSupplied(product)) {
      // If there is, we get the geometries as GeoJSON
      const geoJson = this.#mapViewModel.getAllFeaturesAsGeoJson();
      // And add it to the request string.
      requestString += `${product.geoAttribute}=${geoJson}&`;
    }
    productParameters.forEach((parameter) => {
      requestString += `${this.#getParameterNameValueString(parameter)}&`;
    });
    // Let's encode the string and return it.
    return encodeURIComponent(requestString);
  };

  // Returns a name value string for the supplied parameter
  #getParameterNameValueString = (parameter) => {
    switch (parameter.type) {
      case "CHOICE":
      case "LOOKUP_CHOICE":
      case "TEXT":
      case "PASSWORD":
        // All above should be clean strings... TODO: Tests!
        return `${parameter.name}=${
          parameter.value ?? parameter.defaultValue ?? ""
        }`;
      case "LISTBOX":
      case "LOOKUP_LISTBOX":
        // These should be array of strings...
        const selectedArray = parameter.value ?? parameter.defaultValue ?? [];
        // If the array is empty, we can return an empty string
        if (selectedArray.length === 0) {
          return "";
        }
        // Otherwise we concatenate a string with all selected values.
        let urlString = `${parameter.name}=`;
        selectedArray.forEach((value, index) => {
          urlString += `${value}${
            index === selectedArray.length - 1 ? "" : "&"
          }`;
        });
        return urlString;
      case "RANGE_SLIDER":
        // This one expects a number
        const { value } = this.getRangeSliderValueAndStep(parameter);
        return `${parameter.name}=${value}`;
      default:
        // Let's default to a string.
        return parameter.value ?? parameter.defaultValue ?? "";
    }
  };

  // Checks wether the geoAttribute contains a valid value.
  // (An empty string or "none" is to be considered as no geoAttribute
  // wa supplied).
  noGeomAttributeSupplied = (product) => {
    return (
      !product ||
      !product.geoAttribute ||
      product.geoAttribute === "" ||
      product.geoAttribute === "none"
    );
  };

  // Returns a stepSize that corresponds to the supplied decimalPrecision
  // E.g. decimalPrecision: 0 => step: 1,
  //      decimalPrecision: 1 => step: 0.1,
  //      decimalPrecision: 2 => step: 0.01
  #getStepSize = (decimalPrecision) => {
    // Special case, 0 precision should just return 1
    if (decimalPrecision === 0) {
      return 1;
    }
    // Otherwise we use the padStart string function to create
    // a float with a fitting number of decimals.
    return Number(`0.${"1".padStart(decimalPrecision, "0")}`);
  };

  // Calculates a fitting stepSize and fetches the current value for
  // the range slider.
  getRangeSliderValueAndStep = (parameter) => {
    // First we get a stepSize that fits the decimalPrecision supplied
    const step = this.#getStepSize(parameter.decimalPrecision);
    // Then we get the parameter value (that might be set) or return the
    // minimum (or the step over the minimum if that should be excluded).
    const value =
      parameter.value ?? this.getRangeSliderMinimum(parameter, step);
    // And return everything
    return { value, step };
  };

  // Returns the range slider minimum or the step above if
  // minimum should be excluded.
  getRangeSliderMinimum = (parameter, step) => {
    return parameter.minimumExclusive
      ? parameter.minimum + step
      : parameter.minimum;
  };

  // Returns the range slider maximum or the step below if
  // minimum should be excluded.
  getRangeSliderMaximum = (parameter, step) => {
    return parameter.maximumExclusive
      ? parameter.maximum - step
      : parameter.maximum;
  };

  // Returns the value of the parameter supplied.
  // Since the parameter types expects different fallback values
  // we'll have to handle them differently.
  #getParameterValue = (parameter) => {
    switch (parameter.type) {
      case "CHOICE":
      case "LOOKUP_CHOICE":
      case "TEXT":
      case "PASSWORD":
        // All of the above expects a single string
        return parameter.value ?? parameter.defaultValue ?? "";
      case "LISTBOX":
      case "LOOKUP_LISTBOX":
        // These expect an array of strings
        return parameter.value ?? parameter.defaultValue ?? [];
      case "RANGE_SLIDER":
        // This one expects a number
        const { value } = this.getRangeSliderValueAndStep(parameter);
        return value;
      default:
        // Let's default to a string.
        return parameter.value ?? parameter.defaultValue ?? "";
    }
  };

  // Returns all parameters with their values in the format that
  // FME-server expects.
  #getParametersToSend = (product, productParameters) => {
    // Initiate an array where all parameter objects will be pushed
    const parametersToSend = [];
    // Let's check wether their will be a geometry to send
    if (!this.noGeomAttributeSupplied(product)) {
      // If there is, we get the geometries as GeoJSON
      const geoJson = this.#mapViewModel.getAllFeaturesAsGeoJson();
      // And add the geoAttribute with it's GeoJSON to the array
      parametersToSend.push({ name: product.geoAttribute, value: geoJson });
    }
    // Then we get all other values and add them to the array
    productParameters.forEach((parameter) => {
      const value = this.#getParameterValue(parameter);
      parametersToSend.push({ name: parameter.name, value: value });
    });
    // And return the array.
    return parametersToSend;
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

  // Posts a request to run a workspace on FME-server via the REST-API.
  // Returns an object containing eventual error and eventual
  // jobId which can be used to check the status of the job.
  #makeRestApiOrder = async (product, productParameters) => {
    // First, we're gonna have to prepare the parameters to send.
    const parametersToSend = this.#getParametersToSend(
      product,
      productParameters
    );
    // Let's create the request url
    const url = this.#createSubmitProductRequestUrl(product);
    // And the body containing all the parameters
    const body = JSON.stringify({ publishedParameters: parametersToSend });
    // And then try to submit the job using that url...
    try {
      const response = await hfetch(url, {
        method: "POST",
        body: body,
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

  // Handles the data-download order
  #makeDataDownloadOrder = async (product, productParameters, userEmail) => {
    // Let's create the base-url for the request.
    const requestUrl = this.#createDataDownloadUrl(product);
    // The data-download does not expect the parameters to be be sent
    // as json. So let's create a string instead TODO: Is this really true?
    const requestUrlString = this.#createRequestUrlString(
      product,
      productParameters,
      userEmail
    );
    // Then we try to fetch with this information
    try {
      const response = await hfetch(requestUrl, {
        method: "POST",
        body: requestUrlString,
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
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

  // Returns the base url used to post a request to submit a
  // data-download job.
  #createDataDownloadUrl = (product) => {
    return `${this.#mapServiceBase}/fmeproxy/fmedatadownload/${
      product.repository
    }/${product.workspace}`;
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
