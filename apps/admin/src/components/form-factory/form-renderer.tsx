import React from "react";
import {
  Box,
  Grid2 as Grid,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
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
import { useDebounce } from "use-debounce";
import HighlightIndicator, {
  highlightColor,
} from "./components/highlight-indicator";
import {
  isFormElementContainer,
  isFormElementInput,
  isFormElementStatic,
} from "./form-utils";
import { t } from "i18next";
import SearchAdornment from "./components/search-adornment";

const minimumSearchLength = 3;

const searchFormElements = <TFieldValues extends FieldValues>(
  elements: FormElement<TFieldValues>[],
  searchTerm: string
): number => {
  let hitCount = 0;

  if (!searchTerm || searchTerm.length < 3) {
    elements.forEach((item) => {
      if (isFormElementInput(item)) {
        (item as DynamicInputSettings<TFieldValues>).highlight = false;
      } else if (isFormElementContainer(item)) {
        (item as DynamicFormContainer<TFieldValues>).highlight = false;
        searchFormElements(
          (item as DynamicFormContainer<TFieldValues>).getElements(),
          searchTerm
        );
      }
    });
    return 0;
  }

  elements.forEach((item) => {
    if (isFormElementContainer(item)) {
      const container = item as DynamicFormContainer<TFieldValues>;
      const hitsInContainer = searchFormElements(
        container.getElements(),
        searchTerm
      );

      container.highlight = hitsInContainer > 0;
      if (hitsInContainer > 0) hitCount += hitsInContainer;
    } else if (isFormElementInput(item)) {
      const inputItem = item as DynamicInputSettings<TFieldValues>;

      // Lets search for stuff.
      if (inputItem.title?.toLowerCase().includes(searchTerm.toLowerCase())) {
        inputItem.highlight = true;
        hitCount++;
      } else {
        inputItem.highlight = false;
      }
    }
  });

  return hitCount;
};

interface FormRenderProps<TFieldValues extends FieldValues> {
  formControls: DynamicFormContainer<TFieldValues>;
  formGetValues: () => Record<string, unknown>;
  register: UseFormRegister<TFieldValues>;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  showSearch?: boolean;
}

const FormRenderer = <TFieldValues extends FieldValues>({
  formControls,
  formGetValues,
  register,
  control,
  errors,
  showSearch = false,
}: FormRenderProps<TFieldValues>) => {
  let c = 0;

  const [searchTerm, setSearchTerm] = React.useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [hitCount, setHitCount] = React.useState(0);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const getElements = React.useMemo(() => {
    const hits = searchFormElements(
      formControls.getElements(),
      debouncedSearchTerm
    );
    setHitCount(hits);
    return formControls.getElements();
  }, [formControls, debouncedSearchTerm]);

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
    if (isFormElementContainer(item)) {
      return renderContainer(item as DynamicFormContainer<TFieldValues>, index);
    } else if (isFormElementInput(item)) {
      // Keep these comments here for now, will be useful later on.
      // const castedItem = item as
      //   | DynamicInputSettings<TFieldValues>
      //   | CustomInputSettings<TFieldValues>;
      // if (castedItem.visibleIf) {
      //   // console.log("test", item);
      // }
      return wrapInGrid(item, index, {}, renderDynamicInputComponent);
    } else if (isFormElementStatic(item)) {
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
      <Box
        sx={{
          display: "flex",
          position: "relative",
        }}
      >
        <Box sx={{ flex: "1 1 auto" }}>
          <DynamicInputComponent
            key={`${index}`}
            register={register}
            control={control}
            settings={castedSettings}
            errorMessage={
              // At this point I really really care if I get [Object, Object]
              // eslint-disable-next-line @typescript-eslint/no-base-to-string
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
        <HighlightIndicator
          highlight={castedSettings.highlight ?? false}
          animate={true}
        />
      </Box>
    );
  };

  const renderContainerAccordion = (
    container: DynamicFormContainer<TFieldValues>,
    index: number
  ) => {
    const key = getKey(index);
    const shouldExpand =
    !!container.props?.triggerExpanded || container.highlight;

    return (
      <ControlledAccordion
        key={key + "-accordion-"}
        formInputs={container.getFormInputs() as FormElement<FieldValues>[]}
        formGetValues={formGetValues}
        title={container.title}
        triggerExpanded={shouldExpand}
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
    const key = getKey(index);

    return (
      <Paper
        key={key + "-panel-"}
        sx={{
          backgroundColor: container.props?.backgroundColor ?? "none",
          ml: 2,
          width: "100%",
          p: 2,
          pb: 0,
          pl: 0,
          mb: 3,
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
      // Please refactor the ugly * thing below

      // If the Accordion contains a required field, add a * to the title.
      const containsRequiredFields =
        container.getElements().filter((item) => {
          if (isFormElementInput(item)) {
            const castedSettings = item as DynamicInputSettings<TFieldValues>;
            if (castedSettings.registerOptions?.required) {
              return true;
            }
          }
        }).length > 0;

      if (containsRequiredFields) {
        // Please refactor the ugly * thing below
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
    renderFn: (
      item: FormElement<TFieldValues>,
      index: number
    ) => React.ReactNode
  ) => {
    return (
      <Grid
        key={getKey(index) + "-grid"}
        size={{ xs: 12, md: item?.gridColumns ?? 12 }}
        sx={{
          pb: 2,
          pl: 2,
        }}
        {...propsToSpread}
      >
        {renderFn(item, index)}
      </Grid>
    );
  };

  // Form container
  // Note the className below.
  // This is the root of the form and the class is used in the global styles.
  return (
    <Grid container className="form-factory" sx={{ ml: -2 }}>
      {showSearch && (
       <Grid container size={{ xs: 12 }} justifyContent="flex-end">
       <Grid size={{ xs: 12, md: 4 }} sx={{ pb: 2, pl: 2 }}>
         <TextField
           size="small"
           fullWidth
           label={t("form.search.placeholder", {
             minChars: minimumSearchLength,
           })}
           variant="outlined"
           value={searchTerm}
           onChange={handleSearchChange}
           slotProps={{
             input: {
               endAdornment: (
                 <SearchAdornment
                   searchTerm={searchTerm}
                   hitCount={hitCount}
                   highlightColor={highlightColor}
                   handleClearSearch={handleClearSearch}
                   minimumSearchLength={minimumSearchLength}
                 />
               ),
             },
           }}
              />
          </Grid>
        </Grid>
      )}

      {getElements.map((item, index) => renderFormElement(item, index))}
    </Grid>
  );
};

export default FormRenderer;
