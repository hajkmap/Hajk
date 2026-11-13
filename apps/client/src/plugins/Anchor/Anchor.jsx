import propTypes from "prop-types";

import DialogWindowPlugin from "../DialogWindowPlugin";

import ShareIcon from "@mui/icons-material/Share";

import AnchorView from "./AnchorView";

const Anchor = (props) => {
  const { app, map, options } = props;
  const title = options.title || "Dela";

  return (
    <DialogWindowPlugin
      options={options}
      map={map}
      app={app}
      type="Anchor"
      defaults={{
        icon: <ShareIcon />,
        title: title,
        description:
          "Skapa en länk med kartans synliga lager, aktuella zoomnivå och utbredning",
        headerText: "Dela",
        abortText: "Stäng",
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
