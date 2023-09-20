import React, { useEffect } from "react";
import {
  Button,
  Checkbox,
  Icon,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
} from "@mui/material";
import { CheckCircleOutline } from "@mui/icons-material";

const FeatureItem = (props) => {
  const { clickedPointsCoordinates, olLayer } = props;
  const layer = props.feature.get("layer");
  const caption = props.feature.get("caption");

  // Determine state from current visibility
  const [selected, setSelected] = React.useState(olLayer.getVisible());
  const [controlled, setControlled] = React.useState(false);

  // Prepare some consts, needed for GetFeatureInfoUrl
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

  const layerVisibilityChanged = (e) => setSelected(!e.oldValue);

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

  const handleToggle = (newVal) => {
    olLayer.setVisible(newVal);
  };

  return (
    <ListItem
    // secondaryAction={
    //     <Checkbox
    //       edge="start"
    //       onChange={() => setControlled(!controlled)}
    //       checked={controlled}
    //     />
    //     <Button onClick={triggerGetFeatureInfo}>
    //       <CheckCircleOutline />
    //     </Button>
    // }
    >
      <ListItemIcon>
        <Icon>{getInfoclickIcon(olLayer)}</Icon>
      </ListItemIcon>
      <ListItemText
        primary={caption}
        secondary={
          olLayer.get("caption") !== caption &&
          `Del av: ${olLayer.get("caption")}`
        }
      />
      <Switch
        edge="end"
        onChange={() => {
          const newVal = !selected;
          setSelected(newVal);
          handleToggle(newVal);
        }}
        checked={selected}
      />
    </ListItem>
  );
};

export default FeatureItem;
