import {
  formatParameterForFormBody,
  getParameterSubmitValue,
} from "../api/parameterValues";
import { isDisplayOnlyParameter } from "../api/parameterUi";
import type {
  FmeProduct,
  FmeServerModelSettings,
  MapViewModelInterface,
  ParameterToSend,
  PublishedParameter,
} from "../types";

class FmeServerModel {
  #options: FmeServerModelSettings["options"];
  #mapViewModel: MapViewModelInterface;
  #activeUserEmail: string;

  constructor(settings: FmeServerModelSettings) {
    this.#options = settings.options;
    const userDetails = settings.app.config.userDetails as
      { mail?: string } | undefined;
    this.#activeUserEmail = userDetails?.mail ?? "";
    this.#mapViewModel = settings.mapViewModel;
  }

  getActiveUserEmail = (): string => this.#activeUserEmail;

  getProduct = (groupName: string, productName: string): FmeProduct | null => {
    if (!groupName || !productName) {
      return null;
    }
    return (
      this.#options.products?.find(
        (product) => product.group === groupName && product.name === productName
      ) ?? null
    );
  };

  // Returns the parameters whose values should be sent along with an order.
  // The geometry parameter is left out since the drawn geometry is sent
  // separately (sending it twice lets its default value replace the drawn
  // geometry). Display-only parameters (messages, groups) carry no value.
  #getParametersToSubmit = (
    product: FmeProduct,
    productParameters: PublishedParameter[]
  ): PublishedParameter[] =>
    productParameters.filter(
      (parameter) =>
        !isDisplayOnlyParameter(parameter) &&
        (this.noGeomAttributeSupplied(product) ||
          parameter.name !== product.geoAttribute)
    );

  buildDataDownloadFormBody = (
    product: FmeProduct,
    productParameters: PublishedParameter[],
    userEmail: string
  ): string => {
    const body = new URLSearchParams({
      opt_servicemode: "async",
      opt_responseformat: "json",
      opt_requesteremail: userEmail,
    });

    if (!this.noGeomAttributeSupplied(product)) {
      const geoJson = this.#mapViewModel.getAllFeaturesAsGeoJson();
      body.append(product.geoAttribute!, geoJson ?? "");
    }

    this.#getParametersToSubmit(product, productParameters).forEach(
      (parameter) => {
        const { name, value } = formatParameterForFormBody(
          parameter,
          this.getRangeSliderValueAndStep
        );
        body.append(name, value);
      }
    );

    return body.toString();
  };

  buildParametersToSend = (
    product: FmeProduct,
    productParameters: PublishedParameter[]
  ): ParameterToSend[] => {
    const parametersToSend: ParameterToSend[] = [];

    if (!this.noGeomAttributeSupplied(product)) {
      const geoJson = this.#mapViewModel.getAllFeaturesAsGeoJson();
      parametersToSend.push({
        name: product.geoAttribute!,
        value: geoJson ?? "",
      });
    }

    this.#getParametersToSubmit(product, productParameters).forEach(
      (parameter) => {
        parametersToSend.push({
          name: parameter.name,
          value: getParameterSubmitValue(
            parameter,
            this.getRangeSliderValueAndStep
          ),
        });
      }
    );

    return parametersToSend;
  };

  noGeomAttributeSupplied = (product: FmeProduct | null): boolean =>
    !product ||
    !product.geoAttribute ||
    product.geoAttribute === "" ||
    product.geoAttribute === "none";

  #getStepSize = (decimalPrecision = 0): number => {
    if (decimalPrecision === 0) {
      return 1;
    }
    return Number(`0.${"1".padStart(decimalPrecision, "0")}`);
  };

  getRangeSliderValueAndStep = (
    parameter: PublishedParameter
  ): { value: number; step: number } => {
    const step = this.#getStepSize(parameter.decimalPrecision);
    const value =
      (parameter.value as number | undefined) ??
      this.getRangeSliderMinimum(parameter, step);
    return { value, step };
  };

  getRangeSliderMinimum = (
    parameter: PublishedParameter,
    step: number
  ): number =>
    parameter.minimumExclusive
      ? (parameter.minimum ?? 0) + step
      : (parameter.minimum ?? 0);

  getRangeSliderMaximum = (
    parameter: PublishedParameter,
    step: number
  ): number =>
    parameter.maximumExclusive
      ? (parameter.maximum ?? 0) - step
      : (parameter.maximum ?? 0);

  getParametersToRender = (
    parameters: PublishedParameter[],
    groupName: string,
    productName: string
  ): PublishedParameter[] => {
    const product = this.getProduct(groupName, productName);
    if (!product) {
      return [];
    }
    return parameters.filter(
      (parameter) => parameter.name !== product.geoAttribute
    );
  };

  getInfoUrl = (groupName: string, productName: string): string =>
    this.getProduct(groupName, productName)?.infoUrl ?? "";

  shouldPromptForEmail = (groupName: string, productName: string): boolean =>
    this.getProduct(groupName, productName)?.promptForEmail ?? false;

  isValidEmail = (emailString: string): boolean =>
    typeof emailString === "string" && /\S+@\S+\.\S+/.test(emailString);
}

export default FmeServerModel;
