import React, { useEffect, useState } from "react";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Card,
  CardActions,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListSubheader,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

import { Box } from "@mui/system";
import FeatureItem from "./FeatureItem.js";
import DigitalPlanItem from "./DigitalPlanItem.js";
import ReportDialog from "./ReportDialog.js";

function PropertyItem({
  clickedPointsCoordinates,
  controlledLayers,
  digitalPlanFeatures,
  features,
  globalObserver,
  olMap,
  setControlledLayers,
  startExpanded,
  userDetails,
}) {
  const [reportDialogVisible, setReportDialogVisible] = useState(false);

  const handleShowReportDialog = (propertyName) => {
    setCurrentPropertyName(propertyName);
    setReportDialogVisible(true);
  };
  const [currentPropertyName, setCurrentPropertyName] = useState("");
  const [selectedTab, setSelectedTab] = useState(0);

  // This map will hold values for user's own notes that can be written
  // for each layer in the list.
  const [layerNotes, setLayerNotes] = useState({});

  return (
    <React.Fragment>
      <ReportDialog
        reportDialogVisible={reportDialogVisible}
        setReportDialogVisible={setReportDialogVisible}
        currentPropertyName={currentPropertyName}
        controlledLayers={controlledLayers}
        layerNotes={layerNotes}
        userDetails={userDetails}
      />
      <Accordion disableGutters defaultExpanded={startExpanded}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="button">
            {features.markerFeature.get("fastighet")}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            disabled={
              controlledLayers.filter(
                (l) =>
                  l.propertyName === features.markerFeature.get("fastighet")
              ).length === 0
            }
            onClick={() => {
              handleShowReportDialog(features.markerFeature.get("fastighet"));
            }}
          >
            Generera rapport
          </Button>
          <Tabs
            onChange={(e, v) => {
              setSelectedTab(v);
            }}
            value={selectedTab}
            variant="fullWidth"
          >
            <Tab label={`${features.features.length} lager`} />
            <Tab label={`${digitalPlanFeatures.length} planbestämmelser`} />
          </Tabs>
          <Box hidden={selectedTab !== 0}>
            {features.features
              // Sort. We want sublayers from same layer to show up next to each other.
              .sort((a, b) => {
                const aid = a.get("id");
                const bid = b.get("id");
                // If we've got nice strings, let's user localeCompare to sort. Else
                // just assume the elements are equal.
                return typeof aid === "string" && typeof bid === "string"
                  ? aid.localeCompare(bid)
                  : 0;
              })
              .map((f, j) => {
                const olLayer = olMap
                  .getAllLayers()
                  .find((l) => l.get("name") === f.get("id"));
                // Render FeatureItem only if we found the related
                // layer in olMap
                return (
                  olLayer && (
                    <FeatureItem
                      clickedPointsCoordinates={clickedPointsCoordinates}
                      feature={f}
                      key={j}
                      olLayer={olLayer}
                      olMap={olMap}
                      globalObserver={globalObserver}
                      controlledLayers={controlledLayers}
                      setControlledLayers={setControlledLayers}
                      layerNotes={layerNotes}
                      setLayerNotes={setLayerNotes}
                      propertyName={features.markerFeature.get("fastighet")}
                    />
                  )
                );
              })}
          </Box>
          <Box hidden={selectedTab !== 1}>
            <Typography variant="button" paragraph gutterBottom>
              Granskning har gjorts mot följande planbestämmelser:
            </Typography>
            <List>
              {digitalPlanFeatures.map((f, j) => {
                return <DigitalPlanItem feature={f} key={j} />;
              })}
            </List>
          </Box>
        </AccordionDetails>
      </Accordion>
    </React.Fragment>
  );
}

export default PropertyItem;
