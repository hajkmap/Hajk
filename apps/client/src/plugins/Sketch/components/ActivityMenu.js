import React from "react";
import { Grid, Paper } from "@mui/material";
import ToggleButton from "@mui/material/ToggleButton";
import HajkToolTip from "components/HajkToolTip";

import { ACTIVITIES } from "../constants";

const ActivityMenu = (props) => {
  return (
    <Grid
      container
      justifyContent={
        props.pluginPosition === "right" ? "flex-end" : "flex-start"
      }
    >
      <Paper elevation={4}>
        {ACTIVITIES.map((activity, index) => {
          return (
            <div key={index} style={{ padding: 8 }}>
              <HajkToolTip title={activity.tooltip}>
                <ToggleButton
                  sx={{ color: "text.primary" }}
                  value={activity.id}
                  selected={props.activityId === activity.id}
                  onChange={() => {
                    props.setActivityId(activity.id);
                  }}
                >
                  {activity.icon}
                </ToggleButton>
              </HajkToolTip>
            </div>
          );
        })}
      </Paper>
    </Grid>
  );
};
export default ActivityMenu;
