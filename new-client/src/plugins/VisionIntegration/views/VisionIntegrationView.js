// Base
import React from "react";

// Views
import BaseView from "./BaseView";
import EditView from "./EditView";

function VisionIntegrationView(props) {
  return !props.windowVisible ? null : props.editModeActive ? (
    <EditView
      hubConnectionStatus={props.hubConnectionStatus}
      setEditModeActive={props.setEditModeActive}
    />
  ) : (
    <BaseView {...props} />
  );
}

export default VisionIntegrationView;
