import React from "react";
import { CircularProgress, Typography, Box } from "@mui/material";
import { CircularProgressProps } from "./types";

const ProgressCircular: React.FC<CircularProgressProps> = ({
  color = "primary",
  size = 40,
  typographyText = "",
}) => {
  return (
    <Box component="div">
      <CircularProgress color={color} size={size} thickness={5} />
      {typographyText && <Typography>{typographyText}</Typography>}
    </Box>
  );
};

export default ProgressCircular;
