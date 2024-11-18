import { Box, Grid2 as Grid, Paper, Typography } from "@mui/material";
import {
  FieldValues,
  UseFormRegister,
  Control,
  FieldErrors,
} from "react-hook-form";
import DynamicFormContainer, { FormElement } from "./dynamic-form-container";
import DynamicInputSettings from "./types/dynamic-input-settings";
import { DynamicInputComponent } from "./dynamic-input-component";
import StaticElement from "./static-element";
import { getRenderer } from "./renderers";
import ControlledAccordion from "./components/controlled-accordion";
import CONTAINER_TYPE from "./types/container-types";
import STATIC_TYPE from "./types/static-type";
import HelpIcon from "@mui/icons-material/Help";
import HajkTooltip from "../hajk-tooltip";

interface FormRenderProps<TFieldValues extends FieldValues> {
  data: DynamicFormContainer<TFieldValues>;
  register: UseFormRegister<TFieldValues>;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
}

const FormRenderer = <TFieldValues extends FieldValues>({
  data,
  register,
  control,
  errors,
}: FormRenderProps<TFieldValues>) => {
  let c = 0;

  const getKey = (index: number) => {
    c++;
    return `formItem-${index}-${c}`;
  };

  const renderStaticElement = (item: StaticElement, index: number) => {
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

    return wrapInGrid(item, index, extraProps, () => {
      const renderedElement = renderer({
        title: item.title,
        element: item.element,
      });

      return renderedElement ?? <div />;
    });
  };

  const renderFormElement = (
    item: FormElement<TFieldValues>,
    index: number
  ) => {
    if (item.kind === "DynamicFormContainer") {
      return renderContainer(item as DynamicFormContainer<TFieldValues>, index);
    } else if (
      item.kind === "DynamicInputSettings" ||
      item.kind === "CustomInputSettings"
    ) {
      return wrapInGrid(item, index, {}, renderDynamicInputComponent);
    } else if (item.kind === "StaticElement") {
      return renderStaticElement(item as StaticElement, index);
    }

    return null;
  };

  const renderDynamicInputComponent = (
    item: FormElement<TFieldValues>,
    index: number
  ) => {
    const castedSettings = item as DynamicInputSettings<TFieldValues>;

    if (
      castedSettings.registerOptions?.required &&
      !castedSettings.title?.includes("*") // Prevents doubles in DEV env.
    ) {
      castedSettings.title = `${castedSettings.title} *`;
    }

    return (
      // Using Box here as there seem to be issues when nesting too many Grids
      <Box sx={{ display: "flex" }}>
        <Box sx={{ flex: "1 1 auto" }}>
          <DynamicInputComponent
            key={`${index}`}
            register={register}
            control={control}
            settings={castedSettings}
            errorMessage={
              errors[castedSettings.name]?.message?.toString() ?? null
            }
          />
        </Box>
        {castedSettings.helpText && (
          <Box>
            <HajkTooltip title={castedSettings.helpText}>
              <Box
                sx={{
                  width: "2rem",
                  height: "2rem",
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <HelpIcon fontSize="small" />
              </Box>
            </HajkTooltip>
          </Box>
        )}
      </Box>
    );
  };

  const renderContainerAccordion = (
    container: DynamicFormContainer<TFieldValues>,
    index: number
  ) => {
    const key = getKey(index);

    return (
      <ControlledAccordion
        title={container.title}
        key={key + "-accordion"}
        triggerExpanded={!!container.props?.triggerExpanded}
        backgroundColor={container.props?.backgroundColor as string}
      >
        <Grid container>
          {container
            .getElements()
            .map((item, _index) => renderFormElement(item, _index))}
        </Grid>
      </ControlledAccordion>
    );
  };

  const renderContainerPanel = (
    container: DynamicFormContainer<TFieldValues>,
    index: number
  ) => {
    return (
      <Paper
        key={getKey(index)}
        sx={{
          backgroundColor: container.props?.backgroundColor ?? "none",
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
          {container
            .getElements()
            .map((item, _index) =>
              wrapInGrid(
                item,
                _index,
                { sx: { pb: 0, pl: 0 } },
                () => renderFormElement(item, _index) ?? <div />
              )
            )}
        </Grid>
      </Paper>
    );
  };

  const renderContainer = (
    container: DynamicFormContainer<TFieldValues>,
    index: number
  ) => {
    const type = container.containerType;
    if (type === CONTAINER_TYPE.PANEL) {
      return renderContainerPanel(container, index);
    } else if (type === CONTAINER_TYPE.ACCORDION) {
      const containsRequiredFields =
        container.getElements().filter((item) => {
          if (item.kind === "DynamicInputSettings") {
            const castedSettings = item as DynamicInputSettings<TFieldValues>;
            if (castedSettings.registerOptions?.required) {
              return true;
            }
          }
        }).length > 0;

      if (containsRequiredFields) {
        if (!container.title?.includes("*") /* Prevents doubles in DEV env.*/) {
          container.title = `${container.title} *`;
        }
      }
      return renderContainerAccordion(container, index);
    }
  };

  const wrapInGrid = (
    item: FormElement<TFieldValues>,
    index: number,
    propsToSpread: object = {},
    renderFn: (item: FormElement<TFieldValues>, index: number) => JSX.Element
  ) => {
    return (
      <Grid
        key={getKey(index) + "-grid"}
        size={{ xs: 12, md: item?.gridColumns ?? 12 }}
        sx={{ pb: 2, pl: 2 }}
        {...propsToSpread}
      >
        {renderFn(item, index)}
      </Grid>
    );
  };

  return (
    <Grid
      container
      sx={{
        ml: -2,
        "& .MuiInputBase-root": {
          backgroundColor: "background.default",
        },
        "& .MuiRadio-root > span:first-of-type": {
          backgroundColor: "background.default",
          borderRadius: "50%",
        },
      }}
    >
      {data?.getElements().map((item, index) => renderFormElement(item, index))}
    </Grid>
  );
};

export default FormRenderer;
