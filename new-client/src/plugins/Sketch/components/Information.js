import React from "react";
import { Paper, Typography } from "@mui/material";

// A simple component showing the supplied text in a wrapper
const Information = ({ text }) => {
  return (
    <Paper style={{ width: "100%", padding: 8 }}>
      <Typography align="center" variant="body2">
        {text}
      </Typography>
    </Paper>
  );
};

export default Information;
