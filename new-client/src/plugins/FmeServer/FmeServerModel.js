class FmeServerModel {
  #options;
  constructor(settings) {
    this.#options = settings.options;
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
}
export default FmeServerModel;
