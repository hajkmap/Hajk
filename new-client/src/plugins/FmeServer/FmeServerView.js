import React from "react";
import { Button, Grid, Typography } from "@material-ui/core";
import { Select, FormControl, InputLabel, MenuItem } from "@material-ui/core";
import { Step, StepContent, StepLabel, Stepper } from "@material-ui/core";

const FmeServerView = (props) => {
  // We're gonna need some state, e.g. which step are we on,
  // or which product-group the user has selected.
  const [activeStep, setActiveStep] = React.useState(0);
  const [activeGroup, setActiveGroup] = React.useState("");
  const [activeProduct, setActiveProduct] = React.useState("");

  // Let's create an object with all the steps to be rendered. This
  // will allow us to add another step in a simple manner.
  const steps = [
    { label: "Välj grupp", renderFunction: renderChooseGroupStep },
    { label: "Välj produkt", renderFunction: renderChooseProductStep },
    { label: "Rita geometri", renderFunction: renderDrawGeometryStep },
    { label: "Fyll i parametrar", renderFunction: renderEnterParametersStep },
    { label: "Beställ", renderFunction: renderOrderStep },
    { label: "Klart!", renderFunction: renderDoneStep },
  ];

  // If the user reaches the last step, they will be able to reset
  // the stepper. If they do, there will be some cleanup done.
  function handleResetStepper() {
    setActiveStep(0);
    setActiveGroup("");
  }

  function getProductsInActiveGroup() {
    return props.options.products.filter((product) => {
      return product.group === activeGroup;
    });
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
              onClick={
                button.type === "back"
                  ? () => setActiveStep(activeStep - 1)
                  : button.type === "next"
                  ? () => setActiveStep(activeStep + 1)
                  : () => handleResetStepper()
              }
            >
              {button.type === "back"
                ? "Tillbaka"
                : button.type === "next"
                ? "Nästa"
                : "Börja om!"}
            </Button>
          );
        })}
      </Grid>
    );
  }

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
        {renderStepperButtons([{ type: "next", disabled: false }])}
      </Grid>
    );
  }

  function renderChooseProductStep() {
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
        {renderStepperButtons([
          { type: "back", disabled: false },
          { type: "next", disabled: false },
        ])}
      </Grid>
    );
  }

  function renderDrawGeometryStep() {
    return (
      <Grid container item xs={12}>
        <Grid item xs={12}>
          <Typography>Rita geometri</Typography>
        </Grid>
        {renderStepperButtons([
          { type: "back", disabled: false },
          { type: "next", disabled: false },
        ])}
      </Grid>
    );
  }

  function renderEnterParametersStep() {
    return (
      <Grid container item xs={12}>
        <Grid item xs={12}>
          <Typography>Ange parmaterar</Typography>
        </Grid>
        {renderStepperButtons([
          { type: "back", disabled: false },
          { type: "next", disabled: false },
        ])}
      </Grid>
    );
  }

  function renderOrderStep() {
    return (
      <Grid container item xs={12}>
        <Grid item xs={12}>
          <Typography>Beställ</Typography>
        </Grid>
        {renderStepperButtons([
          { type: "back", disabled: false },
          { type: "next", disabled: false },
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
