import React from "react";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import ImageIcon from "@mui/icons-material/MapTwoTone";
import Icon from "@mui/material/Icon";
import { useMapClickViewerContext } from "../MapClickViewerContext";

const FeatureCollectionsListView = (props) => {
  const {
    featureCollections,
    selectedFeatureCollection,
    setSelectedFeatureCollection,
  } = props;

  const { appModel, featurePropsParsing } = useMapClickViewerContext();

  const useLevel1FeatureHighlight =
    featurePropsParsing?.options?.useLevel1FeatureHighlight;

  let highlightTimeout = null;

  const handleCollectionClicked = (layerId) => {
    endHighlight();
    setSelectedFeatureCollection(layerId);
  };

  const beginHighlight = (features) => {
    // We need to handle the occasion where there are a lot of features here.
    // So lets throttle/delay the highlighting if there's many features to prevent UI Freeze.
    // Still the possibility exist that this could become slow thats why this feature is optional in the collection view.

    clearTimeout(highlightTimeout);

    highlightTimeout = setTimeout(
      () => {
        appModel.highlight(features);
      },
      // More than 20 features forces heavier throttle
      // Yes... it's not only the number of features but also the complexity of each geometry.
      // But at least we'll try something to prevent some of it.
      features.length <= 20 ? 50 : 400
    );
  };

  const endHighlight = () => {
    clearTimeout(highlightTimeout);
    appModel.highlight(false);
  };

  return (
    <List>
      {featureCollections.map((fc, i) => {
        return (
          <ListItemButton
            key={i}
            selected={selectedFeatureCollection === fc.layerId}
            onClick={() => handleCollectionClicked(fc.layerId)}
            {...(useLevel1FeatureHighlight === true
              ? {
                  onMouseEnter: () => beginHighlight(fc.features),
                  onMouseLeave: () => endHighlight(),
                }
              : {})}
          >
            <ListItemAvatar>
              <Avatar>
                {fc.infoclickIcon.trim().length > 0 ? (
                  <Icon>{fc.infoclickIcon}</Icon>
                ) : (
                  <ImageIcon />
                )}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={fc.displayName}
              secondary={`${fc.numHits} träffar`}
            />
          </ListItemButton>
        );
      })}
    </List>
  );
};

export default FeatureCollectionsListView;
