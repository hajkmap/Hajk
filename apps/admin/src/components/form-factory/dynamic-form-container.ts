import { FieldValues } from "react-hook-form";
import DynamicInputSettings from "./types/dynamic-input-settings";
import StaticElement from "./static-element";
import CustomInputSettings from "./types/custom-input-settings";
import CONTAINER_TYPE from "./types/container-types";

// Union type combining DynamicInputSettings, StaticElement, and nested DynamicFormContainer
export type FormElement<TFieldValues extends FieldValues> =
  | DynamicInputSettings<TFieldValues>
  | StaticElement
  | DynamicFormContainer<TFieldValues>
  | CustomInputSettings<TFieldValues>;

// Define the kinds for all form elements
type FormElementKind =
  | "DynamicInputSettings"
  | "StaticElement"
  | "DynamicFormContainer"
  | "CustomInputSettings";

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

  addContainer(container: DynamicFormContainer<TFieldValues>): this {
    container.kind = "DynamicFormContainer";
    this.formItems.push(container);
    return this;
  }

  addInput(input: DynamicInputSettings<TFieldValues>): this {
    input.kind = "DynamicInputSettings";
    this.formItems.push(input);
    return this;
  }

  addInputs(inputs: DynamicInputSettings<TFieldValues>[]): this {
    inputs.forEach((input) => (input.kind = "DynamicInputSettings"));
    this.formItems.push(...inputs);
    return this;
  }

  addStaticElement(element: StaticElement): this {
    element.kind = "StaticElement";
    this.formItems.push(element);
    return this;
  }

  addCustomInput(input: CustomInputSettings<TFieldValues>): this {
    input.kind = "CustomInputSettings";
    this.formItems.push(input);
    return this;
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
