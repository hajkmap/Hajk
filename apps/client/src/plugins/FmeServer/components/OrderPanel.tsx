import { Grid, TextField, Typography, LinearProgress } from "@mui/material";
import InformationWrapper from "./InformationWrapper";
import { FME_FAIL_MESSAGES } from "../constants";
import type { OrderPanelProps } from "../types";

const OrderPanel = ({
  shouldPromptForEmail,
  userEmail,
  setUserEmail,
  orderIsLoading,
  orderIsCompleted,
  orderStatus,
  pollError,
}: OrderPanelProps) => {
  const informationText = shouldPromptForEmail
    ? "Beställningen är redo att skickas! Fyll i din epost och klicka sedan på beställ-knappen."
    : "Beställningen är redo att skickas! Klicka nedan för att skicka iväg den.";

  const orderFailed = FME_FAIL_MESSAGES.includes(orderStatus);

  if (orderIsLoading) {
    return (
      <Grid container size={12}>
        <Grid size={12}>
          <Typography>Din beställning bearbetas...</Typography>
        </Grid>
        <Grid size={12}>
          <LinearProgress />
        </Grid>
      </Grid>
    );
  }

  if (pollError) {
    return (
      <InformationWrapper type="error">
        <Typography>
          Beställningen skickades, men dess status kunde inte hämtas. Kontakta
          systemadministratören om resultatet uteblir.
        </Typography>
      </InformationWrapper>
    );
  }

  if (orderIsCompleted) {
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

  return (
    <Grid container size={12}>
      {orderStatus === "ORDER_REQUEST_FAILED" && (
        <Grid sx={{ marginBottom: 1 }} size={12}>
          <InformationWrapper type="error">
            <Typography>
              Beställningen kunde inte skickas. Försök igen eller kontakta
              systemadministratören.
            </Typography>
          </InformationWrapper>
        </Grid>
      )}
      <Grid sx={{ marginBottom: 1 }} size={12}>
        <Typography>{informationText}</Typography>
      </Grid>
      {shouldPromptForEmail && (
        <Grid size={12}>
          <TextField
            id="fme-user-email"
            size="small"
            label="Epost"
            onChange={(e) => setUserEmail(e.target.value)}
            fullWidth
            value={userEmail}
          />
        </Grid>
      )}
    </Grid>
  );
};

export default OrderPanel;
