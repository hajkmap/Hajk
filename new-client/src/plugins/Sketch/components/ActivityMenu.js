import React from "react";
import { Paper, Tooltip } from "@material-ui/core";
import ToggleButton from "@material-ui/lab/ToggleButton";

import { ACTIVITIES } from "../constants";

const ActivityMenu = (props) => {
  return (
    <Paper style={{ maxWidth: 64 }}>
      {ACTIVITIES.map((activity, index) => {
        return (
          <div key={index} style={{ padding: 8 }}>
            <Tooltip title={activity.tooltip}>
              <ToggleButton
                value={activity.id}
                selected={props.activity === activity.id}
                onChange={() => {
                  props.setActivity(activity.id);
                }}
              >
                {activity.icon}
              </ToggleButton>
            </Tooltip>
          </div>
        );
      })}
    </Paper>
  );
};
export default ActivityMenu;
