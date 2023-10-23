import * as React from "react";

import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";

import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import TableViewOutlinedIcon from "@mui/icons-material/TableViewOutlined";

export default function LayerItemOptions({
  layer,
  app,
  enqueueSnackbar,
  subLayerIndex = 0,
}) {
  // Element that we will anchor the options menu to is
  // held in state. If it's null (unanchored), we can tell
  // that the menu should be hidden.
  const [anchorEl, setAnchorEl] = React.useState(null);

  const optionsMenuIsOpen = Boolean(anchorEl);
  const layerInfo = layer.get("layerInfo");

  // Show the options menu by setting an anchor element
  const handleShowMoreOptionsClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setAnchorEl(e.currentTarget);
  };

  // Hides the options menu by resetting the anchor element
  const onOptionsMenuClose = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setAnchorEl(null);
  };

  // Check that layer is downloadable
  const isDownloadable = () => {
    return (
      app.config.mapConfig.map.enableDownloadLink &&
      Array.isArray(layer.subLayers)
    );
  };

  // Handle download action
  const handleDownload = (e) => {
    e.stopPropagation();
    setAnchorEl(null);
    // Construct link
    const layerName = Array.isArray(layer.subLayers)
      ? encodeURI(layer.subLayers[subLayerIndex])
      : null;
    const wmsUrl = layer.get("url");
    const downloadUrl = `${wmsUrl}/kml?layers=${layerName}&mode=download`;
    document.location = downloadUrl;
  };

  // Shows attribute table
  const handleAttributeTable = async (e) => {
    e.stopPropagation();
    setAnchorEl(null);
    try {
      const url = layer.getSource().get("url").replace("wms", "wfs");
      const { LAYERS } = layer.getSource().getParams();
      // If URL already contains a query string part, we want to glue them together.
      const glue = url.includes("?") ? "&" : "?";
      const getFeatureUrl = `${url}${glue}service=WFS&version=1.0.0&request=GetFeature&typeName=${LAYERS}&maxFeatures=5000&outputFormat=application%2Fjson`;
      const describeFeatureTypeUrl = `${url}${glue}service=WFS&version=1.0.0&request=DescribeFeatureType&typeName=${LAYERS}&outputFormat=application%2Fjson`;
      // TODO: QGIS Server doesn't support JSON response for DescribeFeatureType. We must
      // fetch the result as GML2 and then parse it accordingly. This will require
      // some more work than the current approach.
      // const describeFeatureTypeUrl = `${url}${glue}service=WFS&version=1.0.0&request=DescribeFeatureType&typeName=${LAYERS}`;
      const r1 = await fetch(getFeatureUrl);
      const features = await r1.json();
      const r2 = await fetch(describeFeatureTypeUrl);
      const description = await r2.json();

      const columns = description.featureTypes
        .find((f) => f.typeName === LAYERS) // featureTypes contains an object, where typeName will be the same as the layer name we requested
        .properties.filter((c) => !c.type.toLowerCase().includes("gml")) // Best guess to try to filter out the geometry column, we don't want to show it
        .map((c) => {
          // Prepare an object that has the format of 'columns' prop for MUI's DataGrid
          return {
            field: c.name,
            headerName: c.name,
            type: c.localType === "int" ? "number" : c.localType, // DataGrid wants 'number', not 'int', see https://mui.com/components/data-grid/columns/#column-types
            flex: 1,
          };
        });

      const rows = features.features.map((r, i) => {
        return { ...r.properties, id: i };
      });

      app.globalObserver.publish("core.showAttributeTable", {
        title: `${this.caption} (${LAYERS})`,
        content: { columns, rows },
      });
    } catch (error) {
      console.error(error);
      console.log(this);
      const caption = layer.get("caption");
      enqueueSnackbar(
        `Serverfel: attributtabellen för lagret "${caption}" kunde inte visas`,
        { variant: "error" }
      );
    }
  };

  return !layerInfo.showAttributeTableButton && !isDownloadable() ? null : (
    <>
      <IconButton
        size="small"
        aria-controls={optionsMenuIsOpen ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={optionsMenuIsOpen ? "true" : undefined}
        onClick={handleShowMoreOptionsClick}
      >
        <Tooltip title="Val för lager">
          <MoreVertOutlinedIcon />
        </Tooltip>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={optionsMenuIsOpen}
        onClose={onOptionsMenuClose}
        variant={"menu"}
      >
        {layerInfo.showAttributeTableButton && (
          <MenuItem onClick={handleAttributeTable}>
            <ListItemIcon>
              <TableViewOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Visa attributtabell</ListItemText>
          </MenuItem>
        )}
        {isDownloadable() && (
          <MenuItem onClick={handleDownload}>
            <ListItemIcon>
              <FileDownloadOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Ladda ner</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
