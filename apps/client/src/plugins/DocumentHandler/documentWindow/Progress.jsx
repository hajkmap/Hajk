import React from "react";
import Grid from "@mui/material/Grid";
import CircularProgress from "@mui/material/CircularProgress";

class Progress extends React.PureComponent {
  render() {
    return (
      <Grid
        container
        sx={{
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <CircularProgress
          justify="center"
          sx={{
            height: "100%",
          }}
        />
      </Grid>
    );
  }
}

export default Progress;
