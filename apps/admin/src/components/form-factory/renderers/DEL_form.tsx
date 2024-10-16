import { Grid2 as Grid, Paper, Typography } from "@mui/material";
import DynamicFormContainer, { FormElement } from "../dynamic-form-container";

import DynamicInputSettings from "../types/dynamic-input-settings";
import { DynamicInputComponent } from "../dynamic-input-component";
import {
  FieldValues,
  UseFormRegister,
  Control,
  FieldErrors,
} from "react-hook-form";
import StaticElement from "../static-element";
import STATIC_TYPE from "../types/static-type";
import { getRenderer } from ".";
import { ReactElement } from "react";
import CONTAINER_TYPE from "../types/container-types";
import React from "react";
import ControlledAccordion from "../components/controlled-accordion";

type RendererType = (
  item: FormElement<FieldValues>,
  index: number
) => JSX.Element;

class FormRenderer<TFieldValues extends FieldValues> {
  register: UseFormRegister<TFieldValues>;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  c = 0;

  constructor(
    register: UseFormRegister<TFieldValues>,
    control: Control<TFieldValues>,
    errors: FieldErrors<TFieldValues>
  ) {
    this.register = register;
    this.control = control;
    this.errors = errors;
  }

  getKey = (index: number) => {
    this.c++;
    return `formItem-${index}-${this.c}`;
  };

  renderForm = (
    formData: DynamicFormContainer<FieldValues>
  ): React.ReactNode => {
    return (
      <Grid container sx={{ ml: -2 }}>
        {formData?.getElements().map((item, index) => {
          return this.renderFormElement(item, index);
        })}
      </Grid>
    );
  };

  renderStaticElement = (
    item: StaticElement,
    index: number
  ): React.ReactNode => {
    const renderer = getRenderer(item.type);

    let extraProps: object = {};

    if (item.type === STATIC_TYPE.SPACER) {
      extraProps = {
        display: {
          xs: "none",
          sm: "block",
        },
      };
    }

    return this.wrapInGrid(item, index, extraProps, () => {
      const renderedElement = renderer({
        title: item.title,
        element: item.element,
      });

      return renderedElement ?? <div />;
    });
  };

  renderFormElement = (
    item: FormElement<FieldValues>,
    index: number
  ): React.ReactNode => {
    if (item.kind === "DynamicFormContainer") {
      return this.renderContainer(
        item as DynamicFormContainer<FieldValues>,
        index
      );
    } else if (item.kind === "DynamicInputSettings") {
      return this.wrapInGrid(item, index, {}, this.renderDynamicInputComponent);
    } else if (item.kind === "StaticElement") {
      return this.renderStaticElement(item as StaticElement, index);
    }

    return null;
  };

  renderDynamicInputComponent: RendererType = (item, index) => {
    const castedSettings = item as DynamicInputSettings<TFieldValues>; // Assuming castedSettings is used in your component logic

    return (
      <DynamicInputComponent
        key={`${index}`}
        register={this.register}
        control={this.control}
        settings={castedSettings}
        errorMessage={
          this.errors[castedSettings.name]?.message
            ? (this.errors[castedSettings.name] as { message: string }).message
            : null
        }
      />
    );
  };

  // Right now accordion container renderer is located here, might be moved to a different file.
  renderContainerAccordion = (
    container: DynamicFormContainer<FieldValues>,
    index: number
  ) => {
    const key = this.getKey(index);

    return (
      <ControlledAccordion
        title={container.title}
        key={key + "-accordion"}
        triggerExpanded={!!container.props?.triggerExpanded}
      >
        <Grid container>
          {container.getElements().map((item, _index) => {
            return this.renderFormElement(item, _index) as ReactElement;
          })}
        </Grid>
      </ControlledAccordion>
    );
  };

  // Right now panel container renderer is located here, might be moved to a different file.
  renderContainerPanel = (
    container: DynamicFormContainer<FieldValues>,
    index: number
  ) => {
    return (
      <Paper
        key={this.getKey(index)}
        sx={{
          backgroundColor: "none",
          width: "100%",
          p: 2,
          pb: 0,
          pl: 0,
          mb: 3,
          ml: 2,
        }}
      >
        <Typography variant="h6" sx={{ mt: -0.5, ml: 2, mb: 1.5 }}>
          {container.title}
        </Typography>
        <Grid container>
          {container.getElements().map((item, _index) => {
            return this.wrapInGrid(
              item,
              _index,
              { sx: { pb: 0, pl: 0 } },
              () => {
                return this.renderFormElement(item, _index) as ReactElement;
              }
            );
          })}
        </Grid>
      </Paper>
    );
  };

  renderContainer = (
    container: DynamicFormContainer<FieldValues>,
    index: number
  ) => {
    const type = container.containerType;
    if (type === CONTAINER_TYPE.PANEL) {
      return this.renderContainerPanel(container, index);
    } else if (type === CONTAINER_TYPE.ACCORDION) {
      return this.renderContainerAccordion(container, index);
    }
  };

  wrapInGrid = (
    item: FormElement<FieldValues>,
    index: number,
    propsToSpread: object = {},
    renderFn: RendererType
  ) => {
    return (
      <Grid
        key={this.getKey(index) + "-grid"}
        size={{ xs: 12, md: item?.gridColumns ?? 12 }}
        sx={{ pb: 2, pl: 2 }}
        {...propsToSpread}
      >
        {renderFn(item, index)}
      </Grid>
    );
  };
}

export default FormRenderer;
