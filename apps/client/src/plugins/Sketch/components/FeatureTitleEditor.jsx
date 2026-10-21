import React from "react";
import { Grid, TextField, Typography } from "@mui/material";
import HajkToolTip from "components/HajkToolTip";
import i18n from "src/i18n";

const FeatureTitleEditor = ({ feature, model, drawModel }) => {
  const [title, setTitle] = React.useState("");

  React.useEffect(() => {
    setTitle(model.getFeatureTitle(feature));
  }, [feature, model]);

  React.useEffect(() => {
    drawModel.setFeatureAttribute(feature, "FEATURE_TITLE", title);
  }, [drawModel, feature, title]);

  // We don't want to provide an opportunity to set a title on a text-feature.
  // (Since these already consist of only text, and the title might confuse the users).
  return feature.get("DRAW_METHOD") !== "Text" ? (
    <Grid style={{ marginTop: 16 }} size={12}>
      <Grid style={{ marginBottom: 4 }} size={12}>
        <Typography align="center">{i18n.t("common.titleLabel")}</Typography>
      </Grid>
      <Grid size={12}>
        <HajkToolTip title={i18n.t("sketch.titleHint")}>
          <TextField
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            variant="outlined"
            size="small"
          />
        </HajkToolTip>
      </Grid>
    </Grid>
  ) : null;
};

export default FeatureTitleEditor;
