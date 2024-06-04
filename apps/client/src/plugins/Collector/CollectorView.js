import React from "react";
import CollectorForm from "./components/CollectorForm.js";
import "./style.css";

const CollectorView = (props) => {
  const { model, onClose, localObserver, form, serviceConfig, options } = props;

  return (
    <CollectorForm
      localObserver={localObserver}
      model={model}
      onClose={onClose}
      form={form}
      serviceConfig={serviceConfig}
      options={options}
    />
  );
};

export default CollectorView;
