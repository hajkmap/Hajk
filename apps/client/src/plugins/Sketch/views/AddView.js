import React from "react";
import { Grid, Typography } from "@mui/material";

import DrawTypeSelector from "../components/DrawTypeSelector";
import Information from "../components/Information";
import FeatureStyleSelector from "../components/featureStyle/FeatureStyleSelector";
import FeatureTextSetter from "../components/FeatureTextSetter";
import SelectFeaturesDialog from "utils/SelectFeaturesDialog";
import FixedLengthDrawSelector from "../components/FixedLengthDrawSelector";
import MultiDrawSelector from "../components/MultiDrawSelector";

const AddView = (props) => {
  // Let's destruct some properties from the props
  const {
    model,
    activeDrawType,
    setActiveDrawType,
    localObserver,
    drawModel,
    uiDisabled = false,
    allowedGeometryTypes,
    ogcSource,
    fixedLengthEnabled,
    setFixedLengthEnabled,
    fixedLength,
    setFixedLength,
    fixedAngle,
    setFixedAngle,
    multiDrawEnabled,
    setMultiDrawEnabled,
  } = props;

  // Track if drawing is currently active (for enabling/disabling buttons)
  const [drawingActive, setDrawingActive] = React.useState(false);

  // Listen for drawing start/end events
  React.useEffect(() => {
    const handleDrawStart = () => setDrawingActive(true);
    const handleDrawEnd = () => setDrawingActive(false);
    const handleDrawAbort = () => setDrawingActive(false);

    localObserver.subscribe("sketch:drawStart", handleDrawStart);
    localObserver.subscribe("sketch:drawEnd", handleDrawEnd);
    localObserver.subscribe("sketch:drawAbort", handleDrawAbort);

    return () => {
      localObserver.unsubscribe("sketch:drawStart", handleDrawStart);
      localObserver.unsubscribe("sketch:drawEnd", handleDrawEnd);
      localObserver.unsubscribe("sketch:drawAbort", handleDrawAbort);
    };
  }, [localObserver]);

  // We have to get some information about the current activity (view)
  const activity = model.getActivityFromId(props.id);

  // Track multi-draw part count
  const [multiDrawPartCount, setMultiDrawPartCount] = React.useState(0);

  // Update multi-draw part count when drawing ends
  React.useEffect(() => {
    const updatePartCount = () => {
      if (multiDrawEnabled) {
        setMultiDrawPartCount(drawModel.getMultiDrawPartCount());
      }
    };

    // Update on draw end
    localObserver.subscribe("sketch:drawEnd", updatePartCount);

    // Also update when multi-draw mode changes
    if (multiDrawEnabled) {
      updatePartCount();
    } else {
      setMultiDrawPartCount(0);
    }

    return () => {
      localObserver.unsubscribe("sketch:drawEnd", updatePartCount);
    };
  }, [localObserver, drawModel, multiDrawEnabled]);

  // Determine if fixed length selector should be shown
  // Only show when AttributeEditor layer is selected AND draw type is LineString or Polygon
  const showFixedLengthSelector =
    ["LineString", "Polygon"].includes(activeDrawType) &&
    ogcSource &&
    ogcSource !== "Ingen";

  // Determine if multi-draw selector should be shown
  // Only show when AttributeEditor layer is selected AND draw type is Point, LineString, or Polygon
  const showMultiDrawSelector =
    ["Point", "LineString", "Polygon"].includes(activeDrawType) &&
    ogcSource &&
    ogcSource !== "Ingen";

  // Handler to add a segment programmatically
  const handleAddSegment = React.useCallback(() => {
    if (fixedLengthEnabled && drawingActive) {
      drawModel.addFixedLengthSegment();
    }
  }, [fixedLengthEnabled, drawingActive, drawModel]);

  // Handler to finish the drawing
  const handleFinishDrawing = React.useCallback(() => {
    if (drawingActive) {
      drawModel.finishDraw();
    }
  }, [drawingActive, drawModel]);

  // Handler to finish multi-draw mode
  const handleFinishMultiDraw = React.useCallback(() => {
    // Get the completed multi-feature before finishing
    const completedFeature = drawModel.finishMultiDraw();
    setMultiDrawPartCount(0);

    // Disable multi-draw mode in DrawModel directly (not just React state)
    // This must happen BEFORE re-adding so that SKETCH_ATTRIBUTEEDITOR gets set
    drawModel.setMultiDrawMode(false);
    setMultiDrawEnabled(false);

    // Re-add the feature to trigger the addfeature event for AttributeEditor sync
    // This is necessary because the feature was added while multi-draw mode was active
    if (completedFeature) {
      const source = drawModel.getCurrentVectorSource();
      if (source) {
        source.removeFeature(completedFeature);
        source.addFeature(completedFeature);
      }
    }
  }, [drawModel, setMultiDrawEnabled]);

  return (
    <Grid container>
      <Grid size={12}>
        <Information text={activity.information} />
      </Grid>
      <Grid style={{ marginTop: 16 }} size={12}>
        <Grid style={{ marginBottom: 4 }} size={12}>
          <Typography align="center">Typ</Typography>
        </Grid>
        <Grid size={12}>
          <DrawTypeSelector
            activeDrawType={activeDrawType}
            setActiveDrawType={setActiveDrawType}
            allowedTypes={allowedGeometryTypes}
          />
        </Grid>
      </Grid>
      {showMultiDrawSelector && (
        <Grid size={12}>
          <MultiDrawSelector
            multiDrawEnabled={multiDrawEnabled}
            setMultiDrawEnabled={setMultiDrawEnabled}
            multiDrawPartCount={multiDrawPartCount}
            onFinishMultiDraw={handleFinishMultiDraw}
            uiDisabled={false}
          />
        </Grid>
      )}
      {showFixedLengthSelector && (
        <FixedLengthDrawSelector
          fixedLengthEnabled={fixedLengthEnabled}
          setFixedLengthEnabled={setFixedLengthEnabled}
          fixedLength={fixedLength}
          setFixedLength={setFixedLength}
          fixedAngle={fixedAngle}
          setFixedAngle={setFixedAngle}
          uiDisabled={false}
          drawingActive={drawingActive}
          onAddSegment={handleAddSegment}
          onFinishDrawing={handleFinishDrawing}
        />
      )}
      {!uiDisabled && (
        <div
          style={{
            width: "100%",
          }}
        >
          <FeatureStyleSelector
            activityId={props.id}
            activeDrawType={activeDrawType}
            drawStyle={props.drawStyle}
            drawModel={props.drawModel}
            setDrawStyle={props.setDrawStyle}
            textStyle={props.textStyle}
            setTextStyle={props.setTextStyle}
            localObserver={props.localObserver}
            globalObserver={props.globalObserver}
            pluginShown={props.pluginShown}
            bufferState={props.bufferState}
            setBufferState={props.setBufferState}
            highlightLayer={props.highlightLayer}
            toggleBufferBtn={props.toggleBufferBtn}
            setToggleBufferBtn={props.setToggleBufferBtn}
          />
          <FeatureTextSetter
            localObserver={props.localObserver}
            drawModel={props.drawModel}
          />
        </div>
      )}
      <SelectFeaturesDialog
        localObserver={localObserver}
        drawModel={drawModel}
        model={model}
      />
    </Grid>
  );
};

export default AddView;
