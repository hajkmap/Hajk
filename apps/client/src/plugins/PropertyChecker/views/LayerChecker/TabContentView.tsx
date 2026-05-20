import { useState } from "react";
import FeatureItem from "./FeatureItem";
import ReportDialog from "./ReportDialog";

import { Box, Button } from "@mui/material";
import HajkToolTip from "components/HajkToolTip";

import type { LayerCheckerTabContentViewProps } from "../../types";
import { usePropertyCheckerContext } from "../../context";

function TabContentView({
  clickedPointsCoordinates,
  controlledLayers,
  features,
  globalObserver,
  layerNotes,
  olMap,
  options,
  setControlledLayers,
  setLayerNotes,
  userDetails,
}: LayerCheckerTabContentViewProps) {
  const [reportDialogVisible, setReportDialogVisible] = useState(false);
  const { showTooltips } = usePropertyCheckerContext();

  const handleShowReportDialog = (propertyName: string) => {
    setCurrentPropertyName(propertyName);
    setReportDialogVisible(true);
  };
  const [currentPropertyName, setCurrentPropertyName] = useState("");
  return (
    <>
      {options.enableCheckLayerReport && (
        <>
          <ReportDialog
            reportDialogVisible={reportDialogVisible}
            setReportDialogVisible={setReportDialogVisible}
            currentPropertyName={currentPropertyName}
            controlledLayers={controlledLayers}
            layerNotes={layerNotes}
            userDetails={userDetails}
          />
          <HajkToolTip
            title={
              showTooltips
                ? "Generera en granskningsrapport för de valda lagren"
                : ""
            }
          >
            <span>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                sx={{ mt: 2, mb: 2 }}
                disabled={
                  controlledLayers.filter(
                    (l) =>
                      l.propertyName ===
                      features.markerFeature.get(
                        options.checkLayerPropertyAttribute
                      )
                  ).length === 0
                }
                onClick={() => {
                  handleShowReportDialog(
                    features.markerFeature.get(
                      options.checkLayerPropertyAttribute
                    )
                  );
                }}
              >
                Generera rapport
              </Button>
            </span>
          </HajkToolTip>
        </>
      )}
      <Box sx={{ mt: options.enableCheckLayerReport ? 1 : 0 }}>
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
                  options={options}
                  globalObserver={globalObserver}
                  controlledLayers={controlledLayers}
                  setControlledLayers={setControlledLayers}
                  layerNotes={layerNotes}
                  setLayerNotes={setLayerNotes}
                  propertyName={features.markerFeature.get(
                    options.checkLayerPropertyAttribute
                  )}
                />
              )
            );
          })}
      </Box>
    </>
  );
}

export default TabContentView;
