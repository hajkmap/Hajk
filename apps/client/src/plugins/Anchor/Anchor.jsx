import propTypes from "prop-types";

import DialogWindowPlugin from "../DialogWindowPlugin";

import ShareIcon from "@mui/icons-material/Share";

import AnchorView from "./AnchorView";
import i18n, { configText } from "src/i18n";

const Anchor = (props) => {
  const { app, map, options } = props;
  // Admin texts are assumed to be Swedish, see configText(). They're
  // passed in options too, as options override defaults.
  const title = configText("anchor.title", options.title);
  const description = configText("anchor.description", options.description);

  return (
    <DialogWindowPlugin
      options={{ ...options, title, description }}
      map={map}
      app={app}
      type="Anchor"
      defaults={{
        icon: <ShareIcon />,
        headerText: i18n.t("anchor.title"),
        abortText: i18n.t("common.close"),
      }}
    >
      <AnchorView
        globalObserver={app.globalObserver}
        model={app.anchorModel}
        options={options}
        enableAppStateInHash={app?.config?.mapConfig?.map?.enableAppStateInHash}
      />
    </DialogWindowPlugin>
  );
};

Anchor.propTypes = {
  app: propTypes.object.isRequired,
  map: propTypes.object.isRequired,
  options: propTypes.object.isRequired,
};

export default Anchor;
