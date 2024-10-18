import { FieldValues } from "react-hook-form";
import DynamicInputSettings from "./types/dynamic-input-settings";
import StaticElement from "./static-element";
import CustomInputSettings from "./types/custom-input-settings"; // Import CustomInputSettings
import CONTAINER_TYPE from "./types/container-types";

// Union type combining DynamicInputSettings, StaticElement, and nested DynamicFormContainer
export type FormElement<TFieldValues extends FieldValues> =
  | DynamicInputSettings<TFieldValues>
  | StaticElement
  | DynamicFormContainer<TFieldValues>
  | CustomInputSettings<TFieldValues>; // Include CustomInputSettings in the union

// Define the kinds for all form elements
type FormElementKind =
  | "DynamicInputSettings"
  | "StaticElement"
  | "DynamicFormContainer"
  | "CustomInputSettings"; // Add CustomInputSettings kind

class DynamicFormContainer<TFieldValues extends FieldValues> {
  kind: FormElementKind;
  gridColumns = 12;
  private formItems: FormElement<TFieldValues>[];
  containerType: CONTAINER_TYPE;
  title: string;
  props?: Record<string, unknown>;

  constructor(
    title = "",
    containerType: CONTAINER_TYPE = CONTAINER_TYPE.PANEL,
    props?: Record<string, unknown>
  ) {
    this.kind = "DynamicFormContainer";
    this.formItems = [];
    this.containerType = containerType;
    this.title = title;
    this.props = props;
  }

  addContainer(container: DynamicFormContainer<TFieldValues>): void {
    container.kind = "DynamicFormContainer";
    this.formItems.push(container);
  }

  addInput(input: DynamicInputSettings<TFieldValues>): void {
    input.kind = "DynamicInputSettings";
    this.formItems.push(input);
  }

  addInputs(inputs: DynamicInputSettings<TFieldValues>[]): void {
    inputs.forEach((input) => (input.kind = "DynamicInputSettings"));
    this.formItems.push(...inputs);
  }

  addStaticElement(element: StaticElement): void {
    element.kind = "StaticElement";
    this.formItems.push(element);
  }

  // Method to add CustomInputSettings
  addCustomInput(input: CustomInputSettings<TFieldValues>): void {
    input.kind = "CustomInputSettings"; // Set the kind to CustomInputSettings
    this.formItems.push(input); // Add the custom input to formItems
  }

  getElements(): FormElement<TFieldValues>[] {
    return this.formItems;
  }

  getDefaultValues(): Record<string, unknown> {
    return this.formItems.reduce((acc, element) => {
      if (element instanceof DynamicFormContainer) {
        // If the element is a nested container, recursively get its default values
        Object.assign(acc, element.getDefaultValues());
      } else if ("name" in element && element.defaultValue !== undefined) {
        // Check if the element is an input with a default value
        acc[element.name] = element.defaultValue;
      }
      return acc;
    }, {} as Record<string, unknown>);
  }
}

export default DynamicFormContainer;