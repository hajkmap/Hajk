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

import TabContentLayerChecker from "./LayerChecker/TabContentView";
import TabContentDigitalPlanChecker from "./DigitalPlanChecker/TabContentView";

import type { PropertyItemProps, LayerNotes } from "../types";

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
  title,
  userDetails,
}: PropertyItemProps) {
  const [selectedTab, setSelectedTab] = useState(0);

  // This map will hold values for user's own notes that can be written
  // for each layer in the list.
  const [layerNotes, setLayerNotes] = useState<LayerNotes>({});

  const showLayerTab = options.enableCheckLayerTab !== false;
  const showPlansTab = options.enableDigitalPlansTab !== false;
  const bothTabsEnabled = showLayerTab && showPlansTab;

  return (
    <React.Fragment>
      <Accordion disableGutters defaultExpanded={startExpanded}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="button">
            {title ??
              features.markerFeature.get(options.checkLayerPropertyAttribute)}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {bothTabsEnabled && (
            <Tabs
              onChange={(_e, v) => setSelectedTab(v)}
              value={selectedTab}
              variant="fullWidth"
            >
              <Tab label={`${features.features.length} lager`} />
              <Tab label="Planbestämmelser" />
            </Tabs>
          )}
          {showLayerTab && (
            <Box hidden={bothTabsEnabled && selectedTab !== 0}>
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
          )}
          {showPlansTab && (
            <Box hidden={bothTabsEnabled && selectedTab !== 1}>
              <TabContentDigitalPlanChecker
                digitalPlanFeatures={digitalPlanFeatures}
                options={options}
                userDetails={userDetails}
              />
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    </React.Fragment>
  );
}

export default PropertyItem;
