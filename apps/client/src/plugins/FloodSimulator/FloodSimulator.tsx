import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

import FloodSimulatorModel from "./FloodSimulatorModel";
import FloodSimulatorView from "./FloodSimulatorView";

import WaterIcon from "@mui/icons-material/Water";

import { DEFAULT_DESCRIPTION, DEFAULT_TITLE } from "./constants";
import type { FloodSimulatorProps } from "./types";

/**
 * @summary Main component for the FloodSimulator plugin.
 */
const FloodSimulator: React.FC<FloodSimulatorProps> = (props) => {
  const [pluginShown, setPluginShown] = React.useState(
    props.options.visibleAtStart ?? false
  );
  const onHideRef = React.useRef<(() => void) | null>(null);

  const [model] = React.useState(
    () =>
      new FloodSimulatorModel({
        app: props.app,
        map: props.map,
        ...props.options,
      })
  );

  React.useEffect(() => {
    model.init();
    return () => {
      model.dispose();
    };
  }, [model]);

  React.useEffect(() => {
    model.setVisible(pluginShown);
  }, [model, pluginShown]);

  const onWindowHide = () => {
    onHideRef.current?.();
    setPluginShown(false);
  };

  const onWindowShow = () => {
    setPluginShown(true);
  };

  return (
    <BaseWindowPlugin
      {...props}
      type="floodsimulator"
      custom={{
        icon: <WaterIcon />,
        title: props.options.title || DEFAULT_TITLE,
        description: props.options.description || DEFAULT_DESCRIPTION,
        height: "dynamic",
        width: 400,
        disablePadding: true,
        onWindowHide: onWindowHide,
        onWindowShow: onWindowShow,
      }}
    >
      <FloodSimulatorView
        map={props.map}
        model={model}
        onHideRef={onHideRef}
        pluginShown={pluginShown}
      />
    </BaseWindowPlugin>
  );
};

export default FloodSimulator;
