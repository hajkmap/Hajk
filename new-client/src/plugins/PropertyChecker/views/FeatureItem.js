import React, { useEffect, useId } from "react";
import {
  Button,
  Checkbox,
  Icon,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Switch,
} from "@mui/material";
import { CheckCircleOutline } from "@mui/icons-material";

const FeatureItem = (props) => {
  const {
    clickedPointsCoordinates,
    controlledLayers,
    olLayer,
    propertyName,
    setControlledLayers,
  } = props;

  // Some commonly used properties that we want to extract.
  const id = useId();
  const layer = props.feature.get("layer");
  const caption = props.feature.get("caption");
  // For Hajk group layers, we want to append a small
  // text saying that "this layer is part of group layer X".
  const subcaption =
    olLayer.get("caption") !== caption
      ? `Del av: ${olLayer.get("caption")}`
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

  // Prepare some consts, needed for GetFeatureInfoUrl.
  const resolution = olLayer.getMapInternal().getView().getResolution();
  const referenceSystem = olLayer
    .getMapInternal()
    .getView()
    .getProjection()
    .getCode();

  const triggerGetFeatureInfo = () => {
    // TODO: Instead of this, I could rather reuse
    // MapClickModel#query(olLayer, {coordinate: clickedPointsCoordinates})
    const params = { INFO_FORMAT: olLayer.getSource().getParams().INFO_FORMAT };
    const getFeatureInfoUrl = olLayer
      .getSource()
      .getFeatureInfoUrl(
        clickedPointsCoordinates,
        resolution,
        referenceSystem,
        params
      );
    console.log("Will trigger GetFeatureInfo for ", clickedPointsCoordinates);
    console.log("getFeatureInfoUrl: ", getFeatureInfoUrl);
  };

  // Helper to get layer's infoclick icon, as configured in Admin
  const getInfoclickIcon = (l) =>
    l.get("layerInfo")?.layersInfo[layer]?.infoclickIcon ||
    l.get("layerInfo")?.infoclickIcon;

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

  return (
    <ListItem
      disablePadding
      secondaryAction={
        <Checkbox
          edge="start"
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
        // <Button onClick={triggerGetFeatureInfo}>
        //   <CheckCircleOutline />
        // </Button>
      }
    >
      <ListItemButton onClick={handleLayerToggle} disableRipple>
        <ListItemIcon>
          <Icon>{getInfoclickIcon(olLayer)}</Icon>
        </ListItemIcon>
        <ListItemText primary={caption} secondary={subcaption} />
        <Switch edge="end" onChange={handleLayerToggle} checked={visible} />
      </ListItemButton>
    </ListItem>
  );
};

export default FeatureItem;
