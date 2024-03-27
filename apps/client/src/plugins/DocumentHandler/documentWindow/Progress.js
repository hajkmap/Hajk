import React from "react";
import Grid from "@mui/material/Grid";
import CircularProgress from "@mui/material/CircularProgress";

class Progress extends React.PureComponent {
  render() {
    return (
      <Grid
        alignItems="center"
        justifyContent="center"
        container
        sx={{
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
