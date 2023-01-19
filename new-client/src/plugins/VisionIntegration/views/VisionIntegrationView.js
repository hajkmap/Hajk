// Base
import React from "react";

// Constants
import { EDIT_STATUS } from "../constants";

// Views
import BaseView from "./BaseView";
import EditView from "./EditView";

function VisionIntegrationView(props) {
  return !props.windowVisible ? null : props.editModeStatus !==
    EDIT_STATUS.INACTIVE ? (
    <EditView
      hubConnectionStatus={props.hubConnectionStatus}
      editModeStatus={props.editModeStatus}
      setEditModeStatus={props.setEditModeStatus}
    />
  ) : (
    <BaseView {...props} />
  );
}

export default VisionIntegrationView;
