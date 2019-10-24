import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

import RateReviewIcon from "@material-ui/icons/RateReview";

import Observer from "react-event-observer";
import CollectorView from "./CollectorView.js";
import CollectorModel from "./CollectorModel.js";

class Collector extends React.Component {
  constructor(props) {
    super(props);

    this.app = props.app;
    this.options = props.options;
    this.form = this.options.form || [];
    this.serviceConfig = this.getLayerConfigById(this.options.serviceId);

    this.observer = new Observer();

    this.collectorModel = new CollectorModel({
      map: props.map,
      app: props.app,
      observer: this.observer,
      globalObserver: this.app.globalObserver,
      options: {
        ...props.options,
        serviceConfig: this.serviceConfig
      }
    });
  }

  getLayerConfigById(serviceId) {
    return this.app.config.layersConfig.find(
      layerConfig => layerConfig.type === "edit" && layerConfig.id === serviceId
    );
  }

  onWindowHide = () => {
    this.collectorModel.reset();
    this.collectorModel.observer.publish("abortInteraction");
  };

  render() {
    return (
      <BaseWindowPlugin
        {...this.props}
        type="Collector"
        custom={{
          icon: <RateReviewIcon />,
          title: "Tyck till",
          description: "Vi vill veta vad du tycker!",
          height: 450,
          width: 430,
          onWindowHide: this.onWindowHide
        }}
      >
        <CollectorView
          onClose={this.onWindowHide}
          model={this.collectorModel}
          form={this.form}
          serviceConfig={this.serviceConfig}
          options={this.options}
        />
      </BaseWindowPlugin>
    );
  }
}

export default Collector;
