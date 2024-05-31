import React from "react";
import propTypes from "prop-types";
import BaseWindowPlugin from "../BaseWindowPlugin";

import ShareIcon from "@mui/icons-material/Share";

import AnchorView from "./AnchorView";

const Anchor = ({ app, map, options }) => {
  const title = options.title || "Dela";

  return (
    <BaseWindowPlugin
      app={app}
      map={map}
      options={options}
      type="Anchor"
      custom={{
        icon: <ShareIcon />,
        title: title,
        description: "Skapa en länk och dela det du ser i kartan med andra",
        height: "dynamic",
        width: 512,
        top: undefined,
        left: undefined,
      }}
    >
      <AnchorView
        globalObserver={app.globalObserver}
        model={app.anchorModel}
        options={options}
        enableAppStateInHash={app.config.mapConfig.map.enableAppStateInHash}
      />
    </BaseWindowPlugin>
  );
};

Anchor.propTypes = {
  app: propTypes.object.isRequired,
  map: propTypes.object.isRequired,
  options: propTypes.object.isRequired,
};

export default Anchor;
