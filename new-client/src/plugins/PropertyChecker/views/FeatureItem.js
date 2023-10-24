import React, { useEffect, useId } from "react";
import { styled } from "@mui/material/styles";

import {
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Collapse,
  IconButton,
  Switch,
  TextField,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const ExpandMore = styled((props) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? "rotate(0deg)" : "rotate(180deg)",
  marginLeft: "auto",
  transition: theme.transitions.create("transform", {
    duration: theme.transitions.duration.shortest,
  }),
}));

const FeatureItem = (props) => {
  const {
    layerNotes,
    setLayerNotes,
    controlledLayers,
    setControlledLayers,
    olLayer,
    propertyName,
  } = props;

  // Some commonly used properties that we want to extract.
  const id = useId();
  const layer = props.feature.get("layer");
  const caption = props.feature.get("caption");
  // For Hajk group layers, we want to append a small
  // text saying that "this layer is part of group layer X".
  const subcaption =
    olLayer.get("caption") !== caption
      ? `del av: ${olLayer.get("caption")}`
      : null;

  // Define an object that will be used when keeping track
  // of user-selected layers that should be printed inside the
  // Report dialog.
  const selectionFormat = {
    id, // We want to distinguish by something more unique than merely the caption.
    layer,
    caption,
    subcaption,
    propertyName, // We want to keep track of which property a given layer belongs to, print only current selected property's.
  };

  // Used to keep track of OL Layer's current visibility.
  const [visible, setVisible] = React.useState(olLayer.getVisible());
  const layerVisibilityChanged = (e) => setVisible(!e.oldValue);

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

  const handleLayerToggle = () => {
    const newVal = !visible;
    setVisible(newVal);
    olLayer.setVisible(newVal);
  };

  const isSelected = () =>
    controlledLayers.filter((l) => l.id === selectionFormat.id).length > 0;

  const handleLayerNoteChange = (e) => {
    setLayerNotes({ ...layerNotes, ...{ [id]: e.target.value } });
  };

  return (
    <Card variant="outlined">
      <CardHeader
        avatar={
          <Switch edge="start" onChange={handleLayerToggle} checked={visible} />
        }
        action={
          <>
            <Checkbox
              onChange={(e) => {
                setControlledLayers((prev) => {
                  // If layer is already selected using the checkbox…
                  if (isSelected()) {
                    // … let's uncheck the box by the removing element with current layer's ID.
                    return prev.filter((l) => l.id !== selectionFormat.id);
                  } else {
                    // Else, let's check the box by adding the new element.
                    return [...prev, selectionFormat];
                  }
                });
              }}
              checked={isSelected()}
            />
            <ExpandMore
              expand={expanded}
              onClick={handleExpandClick}
              aria-expanded={expanded}
              aria-label="Visa noteringar"
            >
              <ExpandMoreIcon />
            </ExpandMore>
          </>
        }
        title={caption}
        subheader={subcaption}
      />

      <Collapse in={expanded} timeout="auto">
        <CardContent>
          <TextField
            label="Notering"
            multiline
            fullWidth
            size="small"
            maxRows={4}
            onChange={handleLayerNoteChange}
            value={layerNotes?.id}
          />
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default FeatureItem;
