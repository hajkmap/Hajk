import React, { useState } from "react";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

import { Box } from "@mui/system";

import TabContentLayerChecker from "./LayerChecker/TabContentView.js";
import TabContentDigitalPlanChecker from "./DigitalPlanChecker/TabContentView.js";

function PropertyItem({
  clickedPointsCoordinates,
  controlledLayers,
  digitalPlanFeatures,
  features,
  globalObserver,
  olMap,
  options,
  setControlledLayers,
  startExpanded,
  userDetails,
}) {
  const [selectedTab, setSelectedTab] = useState(0);

  // This map will hold values for user's own notes that can be written
  // for each layer in the list.
  const [layerNotes, setLayerNotes] = useState({});

  return (
    <React.Fragment>
      <Accordion disableGutters defaultExpanded={startExpanded}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="button">
            {features.markerFeature.get(options.checkLayerPropertyAttribute)}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Tabs
            onChange={(e, v) => {
              setSelectedTab(v);
            }}
            value={selectedTab}
            variant="fullWidth"
          >
            <Tab label={`${features.features.length} lager`} />
            <Tab label={`Planbestämmelser`} />
          </Tabs>
          <Box hidden={selectedTab !== 0}>
            <TabContentLayerChecker
              clickedPointsCoordinates={clickedPointsCoordinates}
              controlledLayers={controlledLayers}
              features={features}
              globalObserver={globalObserver}
              layerNotes={layerNotes}
              olMap={olMap}
              options={options}
              setControlledLayers={setControlledLayers}
              setLayerNotes={setLayerNotes}
              userDetails={userDetails}
            />
          </Box>
          <Box hidden={selectedTab !== 1}>
            <TabContentDigitalPlanChecker
              digitalPlanFeatures={digitalPlanFeatures}
              options={options}
              userDetails={userDetails}
            />
          </Box>
        </AccordionDetails>
      </Accordion>
    </React.Fragment>
  );
}

export default PropertyItem;
