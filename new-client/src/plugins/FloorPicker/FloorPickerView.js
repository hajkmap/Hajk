import React, { useState } from "react";
import {
  Grid,
  ButtonGroup,
  IconButton,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const FloorPickerView = (props) => {
  const { model } = props;

  //STATE
  const [currentFloor, setCurrentFloor] = useState(model.getDefaultFloor());

  const updateFloor = (newFloorValue) => {
    const newFloor = model.floorConfig.find(
      (floor) => floor.floorValue === newFloorValue
    );

    setCurrentFloor(newFloor);
  };

  const moveUp = () => {
    const floorIndex = model.floorConfig.findIndex(
      (floor) => floor.floorValue === currentFloor.floorValue
    );

    //The next floor up is the current floor index -1, as the floors array is sorted starting from the highest.
    const nextFloorUp = model.floorConfig[floorIndex - 1];
    setCurrentFloor(nextFloorUp);
  };

  const moveDown = () => {
    const floorIndex = model.floorConfig.findIndex(
      (floor) => floor.floorValue === currentFloor.floorValue
    );

    //The next floor down is the current floor index +1, as the floors are sorted in the config starting from the highest.
    const nextFloorDown = model.floorConfig[floorIndex + 1];
    setCurrentFloor(nextFloorDown);
  };

  const sortFloorConfig = (floorConfig) => {
    floorConfig.sort((a, b) => {
      return a.floorLevel < b.floorLevel ? 1 : -1;
    });
    return floorConfig;
  };

  // This effect tells the model to apply the filter, whenever the chosen floor changes. On first run, we will do some initialization, and mark initialized as true. future runs will filter the layers by the specified floor.
  React.useEffect(() => {
    if (props.toolActive && !model.initialized) {
      model.init();
    }

    if (props.toolActive && model.initialized) {
      model.filterMapByFloor(currentFloor);
    }
  }, [currentFloor, model, props.toolActive]);

  return (
    <Grid container>
      <Grid item xs={10}>
        <FormControl fullWidth>
          <Select
            //size="small"
            labelId="floor-select-label"
            id="floor-select"
            value={currentFloor.floorValue}
            onChange={(e) => {
              updateFloor(e.target.value);
            }}
          >
            {sortFloorConfig(model.floorConfig).map((item, index) => {
              return (
                <MenuItem key={index} value={item.floorValue}>
                  {item.floorDisplayName}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Grid>
      <Grid container item xs={2} justifyContent="center">
        <ButtonGroup
          orientation="vertical"
          aria-label="vertical outlined button group"
        >
          <IconButton
            size="small"
            onClick={() => moveUp()}
            disabled={currentFloor.floorLevel === model.floorLimits.top}
          >
            <ExpandLessIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => moveDown()}
            disabled={currentFloor.floorLevel === model.floorLimits.bottom}
          >
            <ExpandMoreIcon fontSize="small" />
          </IconButton>
        </ButtonGroup>
      </Grid>
    </Grid>
  );
};

export default FloorPickerView;
