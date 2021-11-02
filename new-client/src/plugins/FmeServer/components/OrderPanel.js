import React from "react";
import { Grid, TextField, Typography } from "@material-ui/core";

const OrderPanel = (props) => {
  const { shouldPromptForEmail, userEmail, setUserEmail } = props;
  const informationText = shouldPromptForEmail
    ? "Beställningen är redo att skickas! Fyll i din epost och klicka sedan på beställ-knappen."
    : "Beställningen är redo att skickas! Klicka nedan för att skicka iväg den.";

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
      <Grid item xs={12} style={{ marginBottom: 8 }}>
        <Typography>{informationText}</Typography>
      </Grid>
      {shouldPromptForEmail && renderEmailTextField()}
    </Grid>
  );
};

export default OrderPanel;
