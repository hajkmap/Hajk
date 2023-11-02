import { Card, Typography } from "@mui/material";
import React from "react";

function FeatureView(props) {
  const f = props.selectedFeature;

  return (
    f[0] && (
      <Card>
        <Typography variant="h6">{f[0].get("title")}</Typography>
        <Typography variant="body1">{f[0].get("text")}</Typography>
      </Card>
    )
  );
}

export default FeatureView;
