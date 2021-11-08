import React from "react";
import { Button, Grid, Typography } from "@material-ui/core";
import { Select, FormControl, InputLabel, MenuItem } from "@material-ui/core";
import { Step, StepContent, StepLabel, Stepper } from "@material-ui/core";
import { LinearProgress } from "@material-ui/core";
import { useSnackbar } from "notistack";

import InformationWrapper from "./components/InformationWrapper";
import DrawToolbox from "./components/DrawToolbox";
import OrderPanel from "./components/OrderPanel";
import ProductParameters from "./components/ProductParameters";
import useProductParameters from "./hooks/useProductParameters";
import useInterval from "./hooks/useInterval";

// We're gonna be checking the job status against this array of
// FME-status messages (all of witch means that the job has completed).
const FME_DONE_MESSAGES = [
  "ABORTED",
  "SUCCESS",
  "FME_FAILURE",
  "JOB_FAILURE",
  "PULLED",
];
// We're gonna be polling data from FME-server with an interval.
// This constant sets how often we are polling. (In ms).
const POLLING_INTERVAL = 5000;

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
  const [geometryRequired, setGeometryRequired] = React.useState(false);
  const [totalAllowedArea, setTotalAllowedArea] = React.useState(0);
  const [totalDrawnArea, setTotalDrawnArea] = React.useState(0);
  const [drawError, setDrawError] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState("");
  const [orderStatus, setOrderStatus] = React.useState("NONE");
  const [pollError, setPollError] = React.useState(false);
  const [jobId, setJobId] = React.useState(null);

  // We're gonna be showing some snacks to the user, lets destruct the
  // enqueueSnackbar function so that we can do that.
  const { enqueueSnackbar } = useSnackbar();

  // We must keep track of if we should be polling data from FME-server.
  const shouldPollData = getShouldPollData();

  // We must also keep track of if a order is loading or not.
  const orderIsLoading = getOrderIsLoading();

  // We want to keep track of wether the order is completed or not.
  const orderIsCompleted = getOrderIsCompleted();

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
  ];

  // We are using a custom hook to poll data. If we are polling (determined
  // by shouldPollData, we poll information about a job every POLLING_INTERVAL
  // milliseconds).
  useInterval(
    async () => {
      const { error, status } = await model.getJobStatusById(jobId);
      if (error) {
        return setPollError(true);
      }
      setOrderStatus(status);
    },
    shouldPollData ? POLLING_INTERVAL : null
  );

  // Memoized to prevent useless re-rendering
  const handleFeatureAdded = React.useCallback(
    (drawInformation) => {
      // Let's get the product information from the activeGroup and activeProduct
      // (which are strings, and does not contain information about the product).
      const product = model.getProduct(activeGroup, activeProduct);
      // Let's destruct the totalArea property
      const { totalArea } = drawInformation;
      // We've got an error if an error is returned in the drawInformation or if
      // the drawn area is bigger than what the product allows. (If the product
      // maxArea is set to -1 (or if it is missing), there is no area limitation).
      const error =
        drawInformation.error ||
        (product.maxArea &&
          product.maxArea !== -1 &&
          drawInformation.totalArea > product.maxArea)
          ? true
          : false;
      // After we've checked for errors we can set some state.
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
    localObserver.subscribe("view.toggleDrawMethod", () => {
      setActiveDrawButton("");
    });
    localObserver.subscribe("map.maxFeaturesExceeded", () => {
      enqueueSnackbar(
        "Denna arbetsytan tillåter enbart en geometri. Den tidigare ritade geometrin togs bort.",
        {
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "left",
          },
          variant: "warning",
        }
      );
    });
    return () => {
      // We must make sure to unsubscribe on unmount.
      localObserver.unsubscribe("map.featureAdded");
      localObserver.unsubscribe("view.toggleDrawMethod");
      localObserver.unsubscribe("map.maxFeaturesExceeded");
    };
  }, [localObserver, handleFeatureAdded, enqueueSnackbar]);

  // This effects makes sure to check wether the currently selected
  // product requires a geometry or not, and updates state accordingly.
  // It also makes sure to publish an event so that the mapViewModel knows
  // which product is currently active.
  React.useEffect(() => {
    // Let's get the product information from the activeGroup and activeProduct
    // (which are strings, and does not contain information about the product).
    const product = model.getProduct(activeGroup, activeProduct);
    // If no product is returned, or if the geoAttribute is missing (or set to none)
    // no geometry is required.
    if (model.noGeomAttributeSupplied(product)) {
      return setGeometryRequired(false);
    }
    // Otherwise it is.
    setGeometryRequired(true);
    // Make sure to publish an event on the observer so that the mapViewModel
    // knows which product is currently active.
    localObserver.publish("view.activeProductChange", product);
  }, [activeGroup, activeProduct, localObserver, model]);

  // If the user reaches the last step, they will be able to reset
  // the stepper. If they do, there will be some cleanup done.
  function handleResetStepper() {
    setActiveStep(0);
    setActiveGroup("");
    setActiveProduct("");
    resetOrderInformation();
    handleResetDraw();
  }

  function handleResetDraw() {
    localObserver.publish("map.resetDrawing");
    setActiveDrawButton("");
    setFeatureExists(false);
    setTotalDrawnArea(0);
    setDrawError(false);
  }

  function resetOrderInformation() {
    setJobId(null);
    setOrderStatus("NONE");
    setPollError(null);
  }

  // Checks wether we should be polling information about a submitted
  // job or not.
  function getShouldPollData() {
    // If we've encountered an error while polling data, we're stopping.
    if (pollError) {
      return false;
    }
    // If we have no jobId, it means that we haven't made any product
    // requests yet. (And we should not poll data obviously).
    if (jobId === null) {
      return false;
    }
    // If the order status is any of the "done" statuses,
    // we should not poll any more.
    if (FME_DONE_MESSAGES.includes(orderStatus)) {
      return false;
    }
    // Otherwise, we are going to poll data!
    return true;
  }

  // Helper function to determine if the order is loading or not.
  // (we are loading if we are about to poll data, or if we are
  // currently polling data).
  function getOrderIsLoading() {
    // If shouldPollData is true, we are currently polling data.
    // If the orderStatus is set to ORDER_REQUEST_SENT, we are about to poll data.
    return shouldPollData || orderStatus === "ORDER_REQUEST_SENT";
  }

  // Helper function to determine if the order is completed.
  function getOrderIsCompleted() {
    // If no jobId is set, the order cannot be done.
    if (jobId === null) {
      return false;
    }
    // If the order is loading, we are not done...
    if (orderIsLoading) {
      return false;
    }
    // Otherwise, the order should be completed.
    return true;
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
    // If the order is currently loading, we cannot continue.
    if (orderIsLoading) {
      return false;
    }
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

  // Handles back, next, order, and reset clicks.
  function handleStepperButtonClick(type) {
    // We always want to make sure that we are turning the draw-method off.
    if (activeDrawButton !== "") {
      setActiveDrawButton("");
      localObserver.publish("map.toggleDrawMethod", "");
    }
    // Then we'll check what type of button that was pressed,
    // and handle that accordingly.
    switch (type) {
      // Going back? Let's decrement by one.
      case "back":
        // We always want to reset the current order information if we
        // are going back! (We might be going back from the last step,
        // where the order has already been placed. We want to clear eventual
        // errors etc, if the user want's to try to order again).
        resetOrderInformation();
        return setActiveStep(activeStep - 1);
      // Going forward? Let's increment by one.
      case "next":
        return setActiveStep(activeStep + 1);
      // Making an order? Let's handle that.
      case "order":
        return handleProductOrder();
      // If none of the above matched, we're probably resetting.
      default:
        return handleResetStepper();
    }
  }

  // Handles when user presses the order button. The makeOrder method
  // will return an object containing two properties => error and jobId.
  // The jobId can be used to fetch information about the order request.
  // (When making an order, we're queuing a job on FME-server, and we cannot know
  // when that will finish. Which means we cannot wait for the job to complete).
  async function handleProductOrder() {
    // Let's make sure to reset the jobId and set that we are now loading.
    setJobId(null);
    setOrderStatus("ORDER_REQUEST_SENT");
    // Let's await the order request
    const result = await model.makeOrder(
      activeGroup,
      activeProduct,
      productParameters,
      userEmail
    );
    // And then we update the state accordingly.
    setJobId(result.jobId);
    setOrderStatus(result.error ? "ORDER_REQUEST_FAILED" : "POLLING");
  }

  // Renders the product parameters fetched by the useProductParameters hook.
  function renderProductParameters() {
    // If an error was returned when fetching the parameters, let's render
    // some error text.
    if (parametersError) {
      return (
        <InformationWrapper type="error">
          <Typography>
            Produktens parametrar kunde inte hämtas. Kontakta
            systemadministratören.
          </Typography>
        </InformationWrapper>
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
    // Then we'll check and get the eventual information-url, which will provide
    // the users with some information regarding the product.
    const infoUrl = model.getInfoUrl(activeGroup, activeProduct);

    // Then we'll render the parameters and the eventual information-url.
    return (
      <ProductParameters
        parameters={parametersToRender}
        model={model}
        setProductParameters={setProductParameters}
        infoUrl={infoUrl}
      />
    );
  }

  // Renders a toolbox that the user can use to draw the geometries needed
  // to submit the order. It also renders information about potential errors.
  function renderGeometryHandler() {
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
            <InformationWrapper type="error">
              <Typography variant="caption">
                {`Den ritade ytan är för stor. Ta bort den och försök igen för att kunna gå vidare med beställningen! 
                      Den ritade ytan är ${totalDrawnArea.toLocaleString()} m², och den högst tillåtna arean är ${totalAllowedArea.toLocaleString()} m²`}
              </Typography>
            </InformationWrapper>
          </Grid>
        )}
      </Grid>
    );
  }

  // Renders an informational message if the user does not need to draw
  // a geometry to move in with the product submit request.
  function renderNoGeometryNeededMessage() {
    return (
      <Grid container item xs={12}>
        <InformationWrapper>
          <Typography>
            Denna produkt kräver ingen geometri! Du kan fortsätta till nästa
            steg.
          </Typography>
        </InformationWrapper>
      </Grid>
    );
  }

  function getActiveStepperButtons(shouldPromptForEmail) {
    return orderIsCompleted
      ? [{ type: "reset", disabled: false }]
      : [
          { type: "back", disabled: orderIsLoading },
          {
            type: "order",
            disabled: !getContinueFromOrderStep(shouldPromptForEmail),
          },
        ];
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
  // for which the ordered product perform calculations. (Note! If no
  // geometry is required for the chosen product, only an informational
  // message is shown instead.)
  function renderDrawGeometryStep() {
    return (
      <Grid container item xs={12}>
        {geometryRequired
          ? renderGeometryHandler()
          : renderNoGeometryNeededMessage()}
        {
          // If the drawing is not completed, or if the drawing contains an error,
          // we won't let the user continue on. (This only applies if geometryRequired is
          // true obviously).
          renderStepperButtons([
            { type: "back", disabled: false },
            {
              type: "next",
              disabled: geometryRequired && (!featureExists || drawError),
            },
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
          jobId={jobId}
          pollError={pollError}
          orderStatus={orderStatus}
          orderIsLoading={orderIsLoading}
          orderIsCompleted={orderIsCompleted}
        />
        {renderStepperButtons(getActiveStepperButtons(shouldPromptForEmail))}
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
