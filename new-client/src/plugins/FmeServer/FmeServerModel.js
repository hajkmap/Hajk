import { hfetch } from "../../utils/FetchWrapper";

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

  // Fetches all product parameters from FME-server
  getProductParameters = async (groupName, productName) => {
    // If the product is missing for some reason, we return an empty array.
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
      console.log("data: ", data);
      return { error: false, parameters: data };
    } catch (error) {
      return { error: true, parameters: [] };
    }
  };

  // Returns the url needed to fetch the product parameters from FME-server.
  #createGetParametersUrl = (product) => {
    return `${this.#mapServiceBase}/fmeproxy/fmerest/v3/repositories/${
      product.repository
    }/items/${product.workspace}/parameters`;
  };
}
export default FmeServerModel;
