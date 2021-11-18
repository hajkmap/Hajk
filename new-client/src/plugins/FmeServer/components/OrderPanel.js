import React from "react";
import { Grid, TextField, Typography } from "@material-ui/core";
import { LinearProgress } from "@material-ui/core";
import InformationWrapper from "./InformationWrapper";

// We're gonna be checking the job status against this array of
// FME-status messages (all of witch means the job failed).
import { FME_FAIL_MESSAGES } from "../constants";

const OrderPanel = (props) => {
  // Let's destruct the props.
  const { shouldPromptForEmail, userEmail, setUserEmail } = props;
  const { orderIsLoading, orderIsCompleted, orderStatus } = props;

  // We're gonna need some different information texts based on if the user
  // is supposed to supply an email or not.
  const informationText = shouldPromptForEmail
    ? "Beställningen är redo att skickas! Fyll i din epost och klicka sedan på beställ-knappen."
    : "Beställningen är redo att skickas! Klicka nedan för att skicka iväg den.";

  // Helper function to determine if a order has failed or not.
  function getOrderFailed(orderStatus) {
    // If the orderStatus is set to any of the known FME-fail messages,
    // we return true.
    return FME_FAIL_MESSAGES.includes(orderStatus);
  }

  // Renders information to the user when an order is completed.
  function renderOrderCompletedInformation() {
    const orderFailed = getOrderFailed(orderStatus);
    return (
      <InformationWrapper type={orderFailed ? "error" : "info"}>
        <Typography>{`Din beställning är klar! ${
          orderFailed
            ? "Tyvärr så kunde FME inte slutföra beställningen. Kontakta systemadministratören."
            : "Resultatet har skickats till din epost!"
        }`}</Typography>
      </InformationWrapper>
    );
  }

  // Renders information to the user when an order is loading.
  function renderOrderLoadingInformation() {
    return (
      <Grid container>
        <Grid item xs={12}>
          <Typography>Din beställning bearbetas...</Typography>
        </Grid>
        <Grid item xs={12}>
          <LinearProgress />
        </Grid>
      </Grid>
    );
  }

  // Renders information to the user before the order is sent.
  function renderOrderNotSentInformation() {
    return (
      <Grid container item xs={12}>
        <Grid item xs={12} style={{ marginBottom: 8 }}>
          <Typography>{informationText}</Typography>
        </Grid>
        {shouldPromptForEmail && renderEmailTextField()}
      </Grid>
    );
  }

  // Renders an input to the user where they can input their email.
  function renderEmailTextField() {
    return (
      <Grid item xs={12}>
        <TextField
          id={`fme-user-email`}
          size="small"
          label="Epost"
          onChange={(e) => setUserEmail(e.target.value)}
          fullWidth
          variant="outlined"
          value={userEmail}
        />
      </Grid>
    );
  }

  return (
    <Grid container item xs={12}>
      {orderIsLoading && renderOrderLoadingInformation()}
      {orderIsCompleted && renderOrderCompletedInformation()}
      {!orderIsLoading && !orderIsCompleted && renderOrderNotSentInformation()}
    </Grid>
  );
};

export default OrderPanel;
