import React, { useState } from "react";
import FeatureItem from "./FeatureItem.js";
import ReportDialog from "./ReportDialog.js";

import { Button } from "@mui/material";

function TabContentView({
  clickedPointsCoordinates,
  controlledLayers,
  features,
  globalObserver,
  layerNotes,
  olMap,
  setControlledLayers,
  setLayerNotes,
  userDetails,
}) {
  const [reportDialogVisible, setReportDialogVisible] = useState(false);

  const handleShowReportDialog = (propertyName) => {
    setCurrentPropertyName(propertyName);
    setReportDialogVisible(true);
  };
  const [currentPropertyName, setCurrentPropertyName] = useState("");
  return (
    <>
      <ReportDialog
        reportDialogVisible={reportDialogVisible}
        setReportDialogVisible={setReportDialogVisible}
        currentPropertyName={currentPropertyName}
        controlledLayers={controlledLayers}
        layerNotes={layerNotes}
        userDetails={userDetails}
      />
      <Button
        fullWidth
        variant="outlined"
        size="small"
        disabled={
          controlledLayers.filter(
            (l) => l.propertyName === features.markerFeature.get("fastighet")
          ).length === 0
        }
        onClick={() => {
          handleShowReportDialog(features.markerFeature.get("fastighet"));
        }}
      >
        Generera rapport
      </Button>
      {features.features
        // Sort. We want sublayers from same layer to show up next to each other.
        .sort((a, b) => {
          const aid = a.get("id");
          const bid = b.get("id");
          // If we've got nice strings, let's user localeCompare to sort. Else
          // just assume the elements are equal.
          return (
            a.get("caption").localeCompare(b.get("caption")) || // First, sort on caption.
            (typeof aid === "string" && typeof bid === "string" // Next, group by layer ID.
              ? aid.localeCompare(bid)
              : 0)
          );
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
    </>
  );
}

export default TabContentView;
