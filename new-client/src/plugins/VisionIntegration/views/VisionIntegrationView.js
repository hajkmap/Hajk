// Base
import React from "react";

// Constants
import { EDIT_STATUS } from "../constants";

// Views
import BaseView from "./BaseView";
import EditView from "./EditView";

function VisionIntegrationView(props) {
  return !props.windowVisible ? null : props.editState.mode !==
    EDIT_STATUS.INACTIVE ? (
    <EditView
      hubConnectionStatus={props.hubConnectionStatus}
      editState={props.editState}
      setEditState={props.setEditState}
      model={props.model}
    />
  ) : (
    <BaseView {...props} />
  );
}

export default VisionIntegrationView;
