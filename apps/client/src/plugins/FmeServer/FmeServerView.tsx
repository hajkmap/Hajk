import React from "react";
import {
  Button,
  Grid,
  TextField,
  Typography,
  Select,
  FormControl,
  InputLabel,
  MenuItem,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  IconButton,
  InputAdornment,
  LinearProgress,
} from "@mui/material";
import HelpIcon from "@mui/icons-material/Help";
import { useSnackbar } from "notistack";
import HajkToolTip from "components/HajkToolTip";

import type {
  FeatureAddedPayload,
  FmeServerViewProps,
  OrderStatus,
  StepperButton,
  StepperButtonType,
} from "./types";

import { FME_DONE_STATUSES, POLLING_INTERVAL } from "./constants";

import InformationWrapper from "./components/InformationWrapper";
import DrawToolbox from "./components/DrawToolbox";
import OrderPanel from "./components/OrderPanel";
import ProductParameters from "./components/ProductParameters";

import { isPublishedParameterOptional } from "./api/publishedParameters";
import { parameterIsSatisfied } from "./api/parameterUi";

import useFmeServerApi from "./hooks/useFmeServerApi";
import useProductParameters from "./hooks/useProductParameters";
import useInterval from "./hooks/useInterval";

const FmeServerView: React.FC<FmeServerViewProps> = ({
  localObserver,
  model,
  mapserviceBase,
  options,
}) => {
  const fmeApi = useFmeServerApi(mapserviceBase, model);
  const groupDisplayName = options.groupDisplayName || "Grupp";

  const [activeStep, setActiveStep] = React.useState(0);
  const [activeGroup, setActiveGroup] = React.useState("");
  const [activeProduct, setActiveProduct] = React.useState("");
  const [activeDrawButton, setActiveDrawButton] = React.useState("");
  const [featureExists, setFeatureExists] = React.useState(false);
  const [totalAllowedArea, setTotalAllowedArea] = React.useState(0);
  const [totalDrawnArea, setTotalDrawnArea] = React.useState(0);
  const [drawError, setDrawError] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState(model.getActiveUserEmail());
  const [orderStatus, setOrderStatus] = React.useState<OrderStatus>("NONE");
  const [pollError, setPollError] = React.useState(false);
  const [jobId, setJobId] = React.useState<string | null>(null);

  const { enqueueSnackbar } = useSnackbar();

  const {
    error: parametersError,
    loading: parametersLoading,
    parameters: productParameters,
    setProductParameters,
  } = useProductParameters(activeGroup, activeProduct, fmeApi);

  const shouldPollData =
    !pollError &&
    jobId !== null &&
    !FME_DONE_STATUSES.includes(
      orderStatus as (typeof FME_DONE_STATUSES)[number]
    );

  const orderIsLoading = shouldPollData || orderStatus === "ORDER_REQUEST_SENT";

  const orderIsCompleted = jobId !== null && !orderIsLoading;

  useInterval(
    async () => {
      const { error, status } = await fmeApi.fetchJobStatus(jobId!);
      if (error) {
        setPollError(true);
        return;
      }
      if (status) {
        setOrderStatus(status);
      }
    },
    shouldPollData ? POLLING_INTERVAL : null
  );

  const handleFeatureAdded = React.useCallback(
    (drawInformation: FeatureAddedPayload) => {
      const product = model.getProduct(activeGroup, activeProduct);
      if (!product) {
        return;
      }
      const { totalArea } = drawInformation;
      // The max area may have been stored as a string by Admin.
      const maxArea =
        product.maxArea == null || String(product.maxArea) === ""
          ? null
          : Number(product.maxArea);
      const error =
        drawInformation.error ||
        (maxArea != null && maxArea !== -1 && totalArea > maxArea);
      setFeatureExists(drawInformation.features.length > 0);
      setDrawError(error);
      setTotalDrawnArea(totalArea);
      setTotalAllowedArea(maxArea ?? 0);
    },
    [activeGroup, activeProduct, model]
  );

  const handleResetDraw = React.useCallback(() => {
    localObserver.publish("map.resetDrawing");
    setActiveDrawButton("");
    setFeatureExists(false);
    setTotalDrawnArea(0);
    setDrawError(false);
  }, [localObserver]);

  React.useEffect(() => {
    localObserver.subscribe("map.featureAdded", handleFeatureAdded);
    localObserver.subscribe("view.toggleDrawMethod", () => {
      setActiveDrawButton("");
    });
    localObserver.subscribe("map.maxFeaturesExceeded", () => {
      enqueueSnackbar(
        "Denna arbetsytan tillåter enbart en geometri. Den tidigare ritade geometrin togs bort.",
        {
          anchorOrigin: { vertical: "bottom", horizontal: "left" },
          variant: "warning",
        }
      );
    });
    return () => {
      localObserver.unsubscribe("map.featureAdded");
      localObserver.unsubscribe("view.toggleDrawMethod");
      localObserver.unsubscribe("map.maxFeaturesExceeded");
    };
  }, [localObserver, handleFeatureAdded, enqueueSnackbar]);

  const geometryRequired = !model.noGeomAttributeSupplied(
    model.getProduct(activeGroup, activeProduct)
  );

  React.useEffect(() => {
    const product = model.getProduct(activeGroup, activeProduct);
    if (product && !model.noGeomAttributeSupplied(product)) {
      localObserver.publish("view.activeProductChange", product);
    }
  }, [activeGroup, activeProduct, localObserver, model]);

  // Products belong to a group, so a new group always clears the product.
  const handleGroupChange = (group: string) => {
    setActiveGroup(group);
    setActiveProduct("");
  };

  const resetOrderInformation = () => {
    setJobId(null);
    setOrderStatus("NONE");
    setPollError(false);
  };

  const handleResetStepper = () => {
    setActiveStep(0);
    setActiveGroup("");
    setActiveProduct("");
    resetOrderInformation();
  };

  const turnOffDraw = () => {
    if (activeDrawButton !== "") {
      setActiveDrawButton("");
      localObserver.publish("map.toggleDrawMethod", "");
    }
  };

  const handleDrawButtonClick = (buttonType: string) => {
    if (buttonType === "Reset") {
      handleResetDraw();
      return;
    }
    if (activeDrawButton === buttonType) {
      localObserver.publish("map.toggleDrawMethod", "");
      setActiveDrawButton("");
      return;
    }
    localObserver.publish("map.toggleDrawMethod", buttonType);
    setActiveDrawButton(buttonType);
  };

  const getProductsInActiveGroup = () => {
    if (!activeGroup) {
      return [];
    }
    return (options.products ?? [])
      .filter((product) => product.group === activeGroup)
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true })
      );
  };

  const getContinueFromParameterStep = () => {
    if (parametersLoading || parametersError) {
      return false;
    }
    return !model
      .getParametersToRender(productParameters, activeGroup, activeProduct)
      .some(
        (parameter) =>
          !isPublishedParameterOptional(parameter) &&
          !parameterIsSatisfied(parameter)
      );
  };

  const getContinueFromOrderStep = (shouldPromptForEmail: boolean) => {
    if (orderIsLoading) {
      return false;
    }
    if (!shouldPromptForEmail) {
      return true;
    }
    return model.isValidEmail(userEmail);
  };

  const handleStepperButtonClick = (type: StepperButtonType) => {
    turnOffDraw();
    switch (type) {
      case "back":
        resetOrderInformation();
        setActiveStep((step) => step - 1);
        break;
      case "next":
        setActiveStep((step) => step + 1);
        break;
      case "order":
        handleProductOrder();
        break;
      default:
        handleResetStepper();
    }
  };

  const handleProductOrder = async () => {
    setJobId(null);
    if (!fmeApi.isReady) {
      setOrderStatus("ORDER_REQUEST_FAILED");
      return;
    }
    setOrderStatus("ORDER_REQUEST_SENT");
    const result = await fmeApi.placeOrder(
      activeGroup,
      activeProduct,
      productParameters,
      userEmail
    );
    setJobId(result.jobId);
    setOrderStatus(result.error ? "ORDER_REQUEST_FAILED" : "POLLING");
  };

  const renderStepperButtons = (buttons: StepperButton[]) => (
    <Grid container size={12} sx={{ justifyContent: "flex-end" }}>
      {buttons.map((button) => (
        <Button
          key={button.type}
          sx={{ marginTop: 1, marginLeft: 1 }}
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
      ))}
    </Grid>
  );

  const renderPluginNotConfiguredMessage = () => (
    <Grid size={12}>
      <InformationWrapper type="error">
        <Typography>
          Verktyget är felkonfigurerat, kontakta systemadministratören.
        </Typography>
      </InformationWrapper>
    </Grid>
  );

  const renderSelectedValue = (value: string) => {
    if (!value) return null;
    return (
      <div style={{ position: "relative", fontWeight: "normal", height: "0" }}>
        {value}
      </div>
    );
  };

  const renderProductParameters = () => {
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
    if (parametersLoading) {
      return (
        <Grid container>
          <Grid size={12}>
            <Typography>Försöker hämta parametrar...</Typography>
          </Grid>
          <Grid size={12}>
            <LinearProgress />
          </Grid>
        </Grid>
      );
    }
    const product = model.getProduct(activeGroup, activeProduct);
    return (
      <ProductParameters
        parameters={model.getParametersToRender(
          productParameters,
          activeGroup,
          activeProduct
        )}
        model={model}
        setProductParameters={setProductParameters}
        infoUrl={model.getInfoUrl(activeGroup, activeProduct)}
        uploadParameterFile={(file) =>
          product
            ? fmeApi.uploadParameterFile(product, file)
            : Promise.resolve({ error: true, path: null })
        }
      />
    );
  };

  const renderGeometryHandler = () => (
    <Grid container size={12}>
      <Grid size={12}>
        <Typography variant="caption">
          Välj ritverktyg nedan för att rita beställningens omfattning.
        </Typography>
      </Grid>
      <Grid size={12}>
        <DrawToolbox
          activeDrawButton={activeDrawButton}
          handleDrawButtonClick={handleDrawButtonClick}
        />
      </Grid>
      {drawError && (
        <Grid sx={{ marginTop: 1 }} size={12}>
          <InformationWrapper type="error">
            <Typography variant="caption">
              {totalDrawnArea === 0
                ? "Den valda geometrin saknar yta. Rita eller välj en yta för att kunna gå vidare med beställningen!"
                : `Den ritade ytan är för stor. Ta bort den och försök igen för att kunna gå vidare med beställningen! 
                Den ritade ytan är ${totalDrawnArea.toLocaleString()} m², och den högst tillåtna arean är ${totalAllowedArea.toLocaleString()} m²`}
            </Typography>
          </InformationWrapper>
        </Grid>
      )}
    </Grid>
  );

  const renderChooseGroupStep = () => {
    const groupsToRender = [...(options.productGroups ?? [])].sort();

    if (groupsToRender.length === 1 && activeGroup === "") {
      setActiveGroup(groupsToRender[0]);
      setActiveStep((step) => step + 1);
    }

    return (
      <Grid container size={12}>
        {groupsToRender.length > 0 ? (
          <Grid size={12}>
            <FormControl fullWidth>
              <InputLabel size="small" id="fme-server-select-group-label">
                {groupDisplayName}
              </InputLabel>
              <Select
                labelId="fme-server-select-group-label"
                id="fme-server-select-group"
                value={activeGroup}
                size="small"
                label={groupDisplayName}
                onChange={(e) => handleGroupChange(e.target.value)}
              >
                {groupsToRender.map((group) => (
                  <MenuItem value={group} key={group}>
                    {group}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        ) : (
          renderPluginNotConfiguredMessage()
        )}
        {renderStepperButtons([{ type: "next", disabled: activeGroup === "" }])}
      </Grid>
    );
  };

  const renderChooseProductStep = () => {
    const productsInActiveGroup = getProductsInActiveGroup();
    const product = model.getProduct(activeGroup, activeProduct);
    const infoUrl = product?.infoUrl ?? "";

    return (
      <Grid container size={12}>
        {productsInActiveGroup.length > 0 ? (
          <Grid size={12}>
            <FormControl fullWidth>
              <TextField
                select
                id="fme-server-select-product"
                value={activeProduct}
                size="small"
                label="Produkt"
                onChange={(e) => setActiveProduct(e.target.value)}
                slotProps={{
                  input:
                    infoUrl.length > 0
                      ? {
                          startAdornment: (
                            <HajkToolTip title="Öppna länk till produktinformation.">
                              <InputAdornment position="start">
                                <IconButton
                                  aria-label="Open information page"
                                  href={infoUrl}
                                  target="_blank"
                                  edge="start"
                                >
                                  <HelpIcon />
                                </IconButton>
                              </InputAdornment>
                            </HajkToolTip>
                          ),
                        }
                      : undefined,
                }}
              >
                {productsInActiveGroup.map((p) => (
                  <MenuItem value={p.name} key={p.name}>
                    {p.name}
                  </MenuItem>
                ))}
              </TextField>
            </FormControl>
          </Grid>
        ) : (
          renderPluginNotConfiguredMessage()
        )}
        {renderStepperButtons([
          { type: "back", disabled: false },
          { type: "next", disabled: activeProduct === "" },
        ])}
      </Grid>
    );
  };

  const renderDrawGeometryStep = () => (
    <Grid container size={12}>
      {geometryRequired ? (
        renderGeometryHandler()
      ) : (
        <Grid container size={12}>
          <InformationWrapper>
            <Typography>
              Denna produkt kräver ingen geometri! Du kan fortsätta till nästa
              steg.
            </Typography>
          </InformationWrapper>
        </Grid>
      )}
      {renderStepperButtons([
        { type: "back", disabled: false },
        {
          type: "next",
          disabled: geometryRequired && (!featureExists || drawError),
        },
      ])}
    </Grid>
  );

  const renderEnterParametersStep = () => (
    <Grid container size={12}>
      <Grid size={12}>{renderProductParameters()}</Grid>
      {renderStepperButtons([
        { type: "back", disabled: false },
        { type: "next", disabled: !getContinueFromParameterStep() },
      ])}
    </Grid>
  );

  const renderOrderStep = () => {
    const shouldPromptForEmail = model.shouldPromptForEmail(
      activeGroup,
      activeProduct
    );
    const buttons: StepperButton[] =
      orderIsCompleted || pollError
        ? [{ type: "reset", disabled: false }]
        : [
            { type: "back", disabled: orderIsLoading },
            {
              type: "order",
              disabled: !getContinueFromOrderStep(shouldPromptForEmail),
            },
          ];

    return (
      <Grid container size={12}>
        <OrderPanel
          shouldPromptForEmail={shouldPromptForEmail}
          userEmail={userEmail}
          setUserEmail={setUserEmail}
          orderStatus={orderStatus}
          pollError={pollError}
          orderIsLoading={orderIsLoading}
          orderIsCompleted={orderIsCompleted}
        />
        {renderStepperButtons(buttons)}
      </Grid>
    );
  };

  const steps = [
    {
      label: `Välj ${groupDisplayName.toLowerCase()}`,
      render: renderChooseGroupStep,
      renderValue: () => renderSelectedValue(activeGroup),
    },
    {
      label: "Välj produkt",
      render: renderChooseProductStep,
      renderValue: () => renderSelectedValue(activeProduct),
    },
    { label: "Välj omfattning", render: renderDrawGeometryStep },
    { label: "Fyll i parametrar", render: renderEnterParametersStep },
    { label: "Beställ", render: renderOrderStep },
  ];

  return (
    <Stepper activeStep={activeStep} orientation="vertical" sx={{ padding: 1 }}>
      {steps.map((step, index) => (
        <Step key={step.label}>
          <StepLabel>
            {step.label}
            {activeStep !== index && step.renderValue?.()}
          </StepLabel>
          <StepContent>{step.render()}</StepContent>
        </Step>
      ))}
    </Stepper>
  );
};

export default FmeServerView;
