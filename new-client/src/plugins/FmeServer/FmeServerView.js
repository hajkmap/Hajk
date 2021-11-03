import React from "react";
import { Button, Grid, Typography } from "@material-ui/core";
import { Select, FormControl, InputLabel, MenuItem } from "@material-ui/core";
import { Step, StepContent, StepLabel, Stepper } from "@material-ui/core";
import { LinearProgress } from "@material-ui/core";

import ErrorWrapper from "./components/ErrorWrapper";
import DrawToolbox from "./components/DrawToolbox";
import OrderPanel from "./components/OrderPanel";
import ProductParameters from "./components/ProductParameters";
import useProductParameters from "./hooks/useProductParameters";

const FmeServerView = (props) => {
  // We're gonna be needing the localObserver.
  const { localObserver } = props;
  // We're also gonna be needing the model
  const { model } = props;
  // We're gonna need some state, e.g. which step are we on,
  // or which product-group the user has selected and so on.
  const [activeStep, setActiveStep] = React.useState(0);
  const [activeGroup, setActiveGroup] = React.useState("");
  const [activeProduct, setActiveProduct] = React.useState("");
  const [activeDrawButton, setActiveDrawButton] = React.useState("");
  const [featureExists, setFeatureExists] = React.useState(false);
  const [totalAllowedArea, setTotalAllowedArea] = React.useState(0);
  const [totalDrawnArea, setTotalDrawnArea] = React.useState(0);
  const [drawError, setDrawError] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState("");

  // We're gonna use a custom hook to fetch the product parameters when
  // the user changes group and/or product. We're also supplying a function
  // that can be used to set the parameters (so that the user can change
  // the value before they send the submit request).
  const {
    error: parametersError,
    loading: parametersLoading,
    parameters: productParameters,
    setProductParameters,
  } = useProductParameters(activeGroup, activeProduct, model);

  // Let's create an object with all the steps to be rendered. This
  // will allow us to add another step in a simple manner.
  const steps = [
    { label: "Välj grupp", renderFunction: renderChooseGroupStep },
    { label: "Välj produkt", renderFunction: renderChooseProductStep },
    { label: "Välj omfattning", renderFunction: renderDrawGeometryStep },
    { label: "Fyll i parametrar", renderFunction: renderEnterParametersStep },
    { label: "Beställ", renderFunction: renderOrderStep },
    { label: "Klart!", renderFunction: renderDoneStep },
  ];

  // Memoized to prevent useless re-rendering
  const handleFeatureAdded = React.useCallback(
    (drawInformation) => {
      const product = model.getProduct(activeGroup, activeProduct);
      const totalArea = drawInformation.totalArea;
      // We've got an error if an error is returned in the drawInformation or if
      // the drawn area is bigger than what the product allows. (If the product
      // maxArea is set to -1, there is no area limitation).
      const error =
        drawInformation.error ||
        (product.maxArea !== -1 && drawInformation.totalArea > product.maxArea)
          ? true
          : false;
      setFeatureExists(drawInformation.features.length === 0 ? false : true);
      setDrawError(error);
      setTotalDrawnArea(totalArea);
      setTotalAllowedArea(product.maxArea);
    },
    [activeGroup, activeProduct, model]
  );

  // In this effect we make sure to subscribe to all events emitted by
  // the mapViewModel and fmeServerModel.
  React.useEffect(() => {
    localObserver.subscribe("map.featureAdded", handleFeatureAdded);
    return () => {
      // We must make sure to unsubscribe on unmount.
      localObserver.unsubscribe("map.featureAdded");
    };
  }, [localObserver, handleFeatureAdded]);

  // If the user reaches the last step, they will be able to reset
  // the stepper. If they do, there will be some cleanup done.
  function handleResetStepper() {
    setActiveStep(0);
    setActiveGroup("");
    setActiveProduct("");
    handleResetDraw();
  }

  function handleResetDraw() {
    localObserver.publish("map.resetDrawing");
    setActiveDrawButton("");
    setFeatureExists(false);
    setTotalDrawnArea(0);
    setDrawError(false);
  }

  function handleDrawButtonClick(buttonType) {
    // The reset button should not be toggled (even if it is a toggle-button...)
    // We should only reset the draw state and move on.
    if (buttonType === "Reset") {
      return handleResetDraw();
    }
    // If the user clicks the button that is currently active, we must set
    // that button inactive again.
    if (activeDrawButton === buttonType) {
      localObserver.publish("map.toggleDrawMethod", "");
      return setActiveDrawButton("");
    }
    // Otherwise, we set the button active!
    localObserver.publish("map.toggleDrawMethod", buttonType);
    return setActiveDrawButton(buttonType);
  }

  // Returns an array of products, where each product belongs
  // to the currently active group.
  function getProductsInActiveGroup() {
    return props.options.products.filter((product) => {
      return product.group === activeGroup;
    });
  }

  // Returns wether it is OK to continue from the step where the
  // user is providing values for the published parameters.
  function getContinueFromParameterStep() {
    // If the parameters are loading, or if we error:ed when fetching
    // the parameters, we can't move on.
    if (parametersLoading || parametersError) {
      return false;
    }
    // If we have a required parameter (not optional), and that parameter is
    // missing, we can't move on. So let's check if there is any parameter
    // that is not optional, and empty.
    const requiredParametersMissing = productParameters.some((parameter) => {
      if (
        !parameter.optional &&
        (!parameter.value || parameter.value.length === 0)
      ) {
        return true;
      }
      return false;
    });
    // Let's return the inverse of required..., since this function returns wether
    // it's OK to continue or not.
    return !requiredParametersMissing;
  }

  // Returns wether it is OK to continue from the step where the
  // user is making an order.
  function getContinueFromOrderStep(shouldPromptForEmail) {
    // If no email is to be supplied, the user can go right ahead and order.
    if (!shouldPromptForEmail) {
      return true;
    }
    // Otherwise, we just make sure that the supplied string is a valid
    // email.
    return model.isValidEmail(userEmail);
  }

  // A function to render the stepper-buttons (next, back reset).
  // Used to limit code rewrite.
  // Accepts: An array of objects on {type: string, disabled: bool} form.
  function renderStepperButtons(buttons) {
    return (
      <Grid container item justify="flex-end">
        {buttons.map((button, index) => {
          return (
            <Button
              key={index}
              style={{ marginTop: 8, marginLeft: 8 }}
              disabled={button.disabled}
              variant="contained"
              onClick={() => handleStepperButtonClick(button.type)}
            >
              {button.type === "back"
                ? "Tillbaka"
                : button.type === "next"
                ? "Nästa"
                : button.type === "order"
                ? "Beställ!"
                : "Börja om!"}
            </Button>
          );
        })}
      </Grid>
    );
  }

  // Handles back, next, and reset clicks.
  function handleStepperButtonClick(type) {
    // We always want to make sure that we are turning the draw-method off.
    if (activeDrawButton !== "") {
      setActiveDrawButton("");
      localObserver.publish("map.toggleDrawMethod", "");
    }
    if (type === "back") {
      return setActiveStep(activeStep - 1);
    }
    if (type === "next") {
      return setActiveStep(activeStep + 1);
    }
    if (type === "order") {
      // TODO: Handle order and move on once we get
      // confirmation from model!
      return setActiveStep(activeStep + 1);
    }
    return handleResetStepper();
  }

  // Renders the product parameters fetched by the useProductParameters hook.
  function renderProductParameters() {
    // If an error was returned when fetching the parameters, let's render
    // some error text.
    if (parametersError) {
      return (
        <ErrorWrapper>
          <Typography>
            Produktens parametrar kunde inte hämtas. Kontakta
            systemadministratören.
          </Typography>
        </ErrorWrapper>
      );
    }
    // If we're still loading the parameters, let's display some
    // loading-bar
    if (parametersLoading) {
      return (
        <Grid container>
          <Grid item xs={12}>
            <Typography>Försöker hämta parametrar...</Typography>
          </Grid>
          <Grid item xs={12}>
            <LinearProgress />
          </Grid>
        </Grid>
      );
    }
    // If we're not loading, and we're not error:ing, let's render the
    // parameters! First we need to get all parameters intended to be
    // rendered. (Every parameter except the one containing the geometry).
    const parametersToRender = model.getParametersToRender(
      productParameters,
      activeGroup,
      activeProduct
    );
    return (
      <ProductParameters
        parameters={parametersToRender}
        setProductParameters={setProductParameters}
      />
    );
  }

  // Renders the content for the step where the user can select
  // which group they want to get their products from. If no group is selected,
  // the user cannot continue to the next step.
  function renderChooseGroupStep() {
    return (
      <Grid container item xs={12}>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel id="fme-server-select-group-label">Grupp</InputLabel>
            <Select
              labelId="fme-server-select-group-label"
              id="fme-server-select-group"
              value={activeGroup}
              label="Grupp"
              onChange={(e) => setActiveGroup(e.target.value)}
            >
              {props.options.productGroups.map((group, index) => {
                return (
                  <MenuItem value={group} key={index}>
                    {group}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Grid>
        {
          // Since this is the first step, we only need a "next" button. We can't
          // go back to step -1.
          renderStepperButtons([{ type: "next", disabled: activeGroup === "" }])
        }
      </Grid>
    );
  }

  // Renders the content for the step where the user can select
  // which product they want to run.
  function renderChooseProductStep() {
    // We only want to render the products that belong to the active group,
    // so letch get those.
    const productsInActiveGroup = getProductsInActiveGroup();
    return (
      <Grid container item xs={12}>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel id="fme-server-select-product-label">
              Produkt
            </InputLabel>
            <Select
              labelId="fme-server-select-product-label"
              id="fme-server-select-product"
              value={activeProduct}
              label="Produkt"
              onChange={(e) => setActiveProduct(e.target.value)}
            >
              {productsInActiveGroup.map((product, index) => {
                return (
                  <MenuItem value={product.name} key={index}>
                    {product.name}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Grid>
        {
          // In this step we need both a "back" and a "next" button, since the
          // user might want to change the selected group along the way
          renderStepperButtons([
            { type: "back", disabled: false },
            { type: "next", disabled: activeProduct === "" },
          ])
        }
      </Grid>
    );
  }

  // Renders the content for the step where the user can draw the area
  // for which the ordered product perform calculations.
  function renderDrawGeometryStep() {
    return (
      <Grid container item xs={12}>
        <Grid item xs={12}>
          <Typography variant="caption">
            Välj ritverktyg nedan för att rita beställningens omfattning.
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <DrawToolbox
            activeDrawButton={activeDrawButton}
            handleDrawButtonClick={handleDrawButtonClick}
          />
        </Grid>
        {drawError && (
          <Grid item xs={12} style={{ marginTop: 8 }}>
            <ErrorWrapper>
              <Typography variant="caption">
                {`Den ritade ytan är för stor. Ta bort den och försök igen för att
              kunna gå vidare med beställningen! Den ritade ytan är ${totalDrawnArea.toLocaleString()} m2, 
              och den högst tillåtna arean är ${totalAllowedArea.toLocaleString()} m2`}
              </Typography>
            </ErrorWrapper>
          </Grid>
        )}
        {
          // If the drawing is not completed, or if the drawing contains an error,
          // we won't let the user continue on.
          renderStepperButtons([
            { type: "back", disabled: false },
            { type: "next", disabled: !featureExists || drawError },
          ])
        }
      </Grid>
    );
  }

  function renderEnterParametersStep() {
    return (
      <Grid container item xs={12}>
        <Grid item xs={12}>
          {renderProductParameters()}
        </Grid>
        {renderStepperButtons([
          { type: "back", disabled: false },
          { type: "next", disabled: !getContinueFromParameterStep() },
        ])}
      </Grid>
    );
  }

  function renderOrderStep() {
    const shouldPromptForEmail = model.shouldPromptForEmail(
      activeGroup,
      activeProduct
    );
    return (
      <Grid container item xs={12}>
        <OrderPanel
          shouldPromptForEmail={shouldPromptForEmail}
          userEmail={userEmail}
          setUserEmail={setUserEmail}
        />
        {renderStepperButtons([
          { type: "back", disabled: false },
          {
            type: "order",
            disabled: !getContinueFromOrderStep(shouldPromptForEmail),
          },
        ])}
      </Grid>
    );
  }

  function renderDoneStep() {
    return (
      <Grid container item xs={12}>
        <Grid item xs={12}>
          <Typography>Klart!</Typography>
        </Grid>
        {renderStepperButtons([{ type: "reset", disabled: false }])}
      </Grid>
    );
  }

  return (
    <Stepper
      activeStep={activeStep}
      orientation="vertical"
      style={{ padding: 8 }}
    >
      {steps.map((step, index) => {
        return (
          <Step key={index}>
            <StepLabel>{step.label}</StepLabel>
            <StepContent>{step.renderFunction()}</StepContent>
          </Step>
        );
      })}
    </Stepper>
  );
};

export default FmeServerView;
