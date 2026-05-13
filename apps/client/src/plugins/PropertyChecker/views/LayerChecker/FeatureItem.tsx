import React, { useEffect, useId } from "react";

import {
  Box,
  Checkbox,
  Collapse,
  Divider,
  IconButton,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import IconWarning from "@mui/icons-material/Warning";
import HajkToolTip from "components/HajkToolTip";

import type { FeatureItemProps, ControlledLayer } from "../../types";
import { usePropertyCheckerContext } from "../../context";

const FeatureItem = (props: FeatureItemProps) => {
  const {
    globalObserver,
    layerNotes,
    setLayerNotes,
    controlledLayers,
    setControlledLayers,
    options,
    olLayer,
    propertyName,
  } = props;

  // Some commonly used properties that we want to extract.
  const id = useId();
  const layer = props.feature.get("layer");
  const caption = props.feature.get("caption");
  const paverkasAvText = props.feature.get("paverkasAvText") as
    | string
    | undefined;
  // For Hajk group layers, we want to append a small
  // text saying that "this layer is part of group layer X".
  const subcaption: string | null =
    olLayer.get("caption") !== caption
      ? `del av: ${olLayer.get("caption")}`
      : null;

  // Define an object that will be used when keeping track
  // of user-selected layers that should be printed inside the
  // Report dialog.
  const selectionFormat: ControlledLayer = {
    id, // We want to distinguish by something more unique than merely the caption.
    layer,
    caption,
    subcaption,
    propertyName, // We want to keep track of which property a given layer belongs to, print only current selected property's.
  };

  // If layer loading failed, we want to replace the toggle switch
  // with a warning triangle.
  const [loadStatus, setLoadStatus] = React.useState("ok");

  // Used to keep track of OL Layer's current visibility.
  const [visible, setVisible] = React.useState(olLayer.getVisible());
  const layerVisibilityChanged = (e: import("ol/Object").ObjectEvent) =>
    setVisible(!e.oldValue);

  // Used to keep track of the expansion area below the main layer item
  const [expanded, setExpanded] = React.useState(false);
  const handleExpandClick = () => setExpanded(!expanded);

  // // Prepare some consts, needed for GetFeatureInfoUrl.
  // const resolution = olLayer.getMapInternal().getView().getResolution();
  // const referenceSystem = olLayer
  //   .getMapInternal()
  //   .getView()
  //   .getProjection()
  //   .getCode();

  // const triggerGetFeatureInfo = () => {
  //   // TODO: Instead of this, I could rather reuse
  //   // MapClickModel#query(olLayer, {coordinate: clickedPointsCoordinates})
  //   const params = { INFO_FORMAT: olLayer.getSource().getParams().INFO_FORMAT };
  //   const getFeatureInfoUrl = olLayer
  //     .getSource()
  //     .getFeatureInfoUrl(
  //       clickedPointsCoordinates,
  //       resolution,
  //       referenceSystem,
  //       params
  //     );
  //   console.log("Will trigger GetFeatureInfo for ", clickedPointsCoordinates);
  //   console.log("getFeatureInfoUrl: ", getFeatureInfoUrl);
  // };

  // // Helper to get layer's infoclick icon, as configured in Admin
  // const getInfoclickIcon = (l) =>
  //   l.get("layerInfo")?.layersInfo[layer]?.infoclickIcon ||
  //   l.get("layerInfo")?.infoclickIcon;

  // Let's listen to layer's own onChange event. This allows
  // us to reflect the current visibility state in our list.
  useEffect(() => {
    olLayer.on("change:visible", layerVisibilityChanged);
    return () => {
      olLayer.un("change:visible", layerVisibilityChanged);
    };
  }, [olLayer]);

  const layerLoadErrorHandler = React.useCallback(
    (d: { id: string; status: string }) => {
      if (loadStatus !== "loaderror" && olLayer.get("name") === d.id) {
        setLoadStatus(d.status);
      }
    },
    [loadStatus, olLayer]
  );

  useEffect(() => {
    globalObserver.subscribe(
      "layerswitcher.wmsLayerLoadStatus",
      layerLoadErrorHandler
    );
    return () => {
      globalObserver.unsubscribe(
        "layerswitcher.wmsLayerLoadStatus",
        layerLoadErrorHandler
      );
    };
  }, [layerLoadErrorHandler, globalObserver]);

  const handleLayerToggle = () => {
    const newVal = !visible;
    setVisible(newVal);
    olLayer.setVisible(newVal);
  };

  const isSelected = () =>
    controlledLayers.filter((l) => l.id === selectionFormat.id).length > 0;

  const handleLayerNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLayerNotes({ ...layerNotes, ...{ [id]: e.target.value } });
  };

  const hasExpandContent =
    !!paverkasAvText?.trim() || options.enableCheckLayerReport;

  const { showTooltips } = usePropertyCheckerContext();

  return (
    <>
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.75, px: 1 }}
      >
        <Box
          sx={{
            flexShrink: 0,
            width: 44,
            display: "flex",
            justifyContent: "center",
          }}
        >
          {loadStatus === "loaderror" ? (
            <HajkToolTip title="Lagret kunde inte laddas in. Kartservern svarar inte.">
              <IconButton
                disableFocusRipple
                disableRipple
                disableTouchRipple
                sx={{ cursor: "not-allowed" }}
                size="small"
              >
                <IconWarning />
              </IconButton>
            </HajkToolTip>
          ) : (
            <HajkToolTip
              title={showTooltips ? "Slå på/av lagret i kartan" : ""}
            >
              <Switch
                size="small"
                onChange={handleLayerToggle}
                checked={visible}
              />
            </HajkToolTip>
          )}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" noWrap>
            {caption}
          </Typography>
          {subcaption && (
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: "text.secondary",
                display: "block",
              }}
            >
              {subcaption}
            </Typography>
          )}
        </Box>
        <Box
          sx={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 0 }}
        >
          {options.enableCheckLayerReport && (
            <HajkToolTip
              title={showTooltips ? "Inkludera lagret i rapport" : ""}
            >
              <Checkbox
                size="small"
                onChange={() => {
                  setControlledLayers((prev) => {
                    if (isSelected()) {
                      return prev.filter((l) => l.id !== selectionFormat.id);
                    } else {
                      return [...prev, selectionFormat];
                    }
                  });
                }}
                checked={isSelected()}
              />
            </HajkToolTip>
          )}
          {hasExpandContent && (
            <HajkToolTip
              title={showTooltips ? "Visa detaljer och noteringar" : ""}
            >
              <IconButton
                size="small"
                onClick={handleExpandClick}
                aria-expanded={expanded}
                aria-label="Visa noteringar"
              >
                <ExpandMoreIcon
                  sx={{
                    transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                    transition: (theme) =>
                      theme.transitions.create("transform", {
                        duration: theme.transitions.duration.shortest,
                      }),
                  }}
                />
              </IconButton>
            </HajkToolTip>
          )}
        </Box>
      </Box>
      <Collapse in={expanded} timeout="auto">
        <Box sx={{ pl: 7, pr: 2, pb: 1.5 }}>
          {paverkasAvText && paverkasAvText.trim().length > 0 && (
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mb: 2,
                whiteSpace: "pre-wrap",
              }}
            >
              {paverkasAvText}
            </Typography>
          )}
          {options.enableCheckLayerReport && (
            <TextField
              label="Notering"
              multiline
              fullWidth
              size="small"
              minRows={1}
              maxRows={4}
              onChange={handleLayerNoteChange}
              value={layerNotes?.id}
            />
          )}
        </Box>
      </Collapse>
      <Divider />
    </>
  );
};

export default FeatureItem;
