import React, { useEffect } from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

import RateReviewIcon from "@mui/icons-material/RateReview";

import Observer from "react-event-observer";
import CollectorView from "./CollectorView.js";
import CollectorModel from "./CollectorModel.js";

const Collector = (props) => {
  const { app, options } = props;
  const form = options.form || [];
  const serviceConfig = app.config.layersConfig.find(
    (layerConfig) =>
      layerConfig.type === "edit" && layerConfig.id === options.serviceId
  );

  const observer = new Observer();
  const collectorModel = new CollectorModel({
    map: props.map,
    app: app,
    observer: observer,
    globalObserver: app.globalObserver,
    options: {
      ...options,
      serviceConfig: serviceConfig,
    },
  });

  const onWindowHide = () => {
    collectorModel.reset();
    collectorModel.observer.publish("abortInteraction");
  };

  useEffect(() => {
    return () => {
      // Cleanup if necessary
    };
  }, []);

  return (
    <BaseWindowPlugin
      {...props}
      type="Collector"
      custom={{
        icon: <RateReviewIcon />,
        title: "Tyck till",
        description: "Vi vill veta vad du tycker!",
        height: 450,
        width: 430,
        onWindowHide: onWindowHide,
      }}
    >
      <CollectorView
        onClose={onWindowHide}
        model={collectorModel}
        form={form}
        serviceConfig={serviceConfig}
        options={options}
      />
    </BaseWindowPlugin>
  );
};

export default Collector;
