import React, { useEffect } from "react";
import {
  Button,
  Checkbox,
  Icon,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Switch,
  ToggleButton,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { getMergedSearchAndHashParams } from "utils/getMergedSearchAndHashParams";

const FeatureItem = (props) => {
  const id = props.feature.get("id");
  const layer = props.feature.get("layer");
  const caption = props.feature.get("caption");

  const [olLayer] = React.useState(() =>
    props.olMap.getAllLayers().find((l) => l.get("name") === id)
  );

  if (olLayer === undefined) {
    console.error("olLayer undefined: ", id, layer, caption);
  }

  // Let's use the optional chaining operator here. We don't know
  // for sure if olLayer contains a layer (a miss, due to layer's
  // misconfiguration in Admin) will result in undefined here).
  const isLayerVisible = () => olLayer?.getVisible();

  // Determine state from current visibility
  const [selected, setSelected] = React.useState(isLayerVisible);
  const [controlled, setControlled] = React.useState(false);

  const { clickedPointsCoordinates, globalObserver } = props;

  const triggerGetFeatureInfo = () => {
    console.log("Will trigger GetFeatureInfo for ", clickedPointsCoordinates);
  };

  const layerVisibilityChanged = (e) => setSelected(!e.oldValue);

  const getInfoclickIcon = (l) =>
    l.get("layerInfo").layersInfo[layer].infoclickIcon ||
    l.get("layerInfo").infoclickIcon;

  // Let's listen to layer's own onChange event. This allows
  // us to reflect the current visibility state in our list.
  React.useEffect(() => {
    olLayer?.on("change:visible", layerVisibilityChanged);
    return () => {
      olLayer?.un("change:visible", layerVisibilityChanged);
    };
  }, [olLayer]);

  const handleToggle = (newVal) => {
    console.log(`Will set visibility to ${newVal} for layer ${id}`);
    olLayer?.setVisible(newVal);
  };

  return olLayer !== undefined ? (
    <ListItem
      secondaryAction={
        <Switch
          edge="end"
          onChange={() => {
            const newVal = !selected;
            setSelected(newVal);
            handleToggle(newVal);
          }}
          checked={selected}
        />
      }
    >
      {/* <ListItemIcon>
        <Checkbox
          edge="start"
          onChange={() => setControlled(!controlled)}
          checked={controlled}
        />
      </ListItemIcon> */}
      <ListItemIcon>
        <Icon>{getInfoclickIcon(olLayer)}</Icon>
      </ListItemIcon>
      <ListItemText
        primary={olLayer.get("caption")}
        secondary={olLayer.get("caption") !== caption && caption}
      />

      {/* <Button onClick={triggerGetFeatureInfo}>
        <CheckIcon />
      </Button> */}
    </ListItem>
  ) : (
    <ListItem>
      <ListItemIcon>
        <Icon color="error">error</Icon>
      </ListItemIcon>
      <ListItemText
        primary="Felkonfigurerat lager"
        secondary={`Kontakta administratör. Uppge "ID=${id}, sublayer=${layer}".`}
      />
    </ListItem>
  );
};

export default FeatureItem;
