import React from "react";
import makeStyles from "@mui/styles/makeStyles";
import IconButton from "@mui/material/IconButton";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";

const useStyles = makeStyles((theme) => ({}));
/**
 * @summary Renders a Download button which on click downloads the current layer as KML
 *
 * @param {Object} { index = 0, parent }
 * @returns {React.Component}
 */
function DownloadLink({ index = 0, layer, enableDownloadLink = false }) {
  const layerName = Array.isArray(layer.subLayers)
    ? encodeURI(layer.subLayers[index])
    : null;
  const wmsUrl = layer.get("url");
  const downloadUrl = `${wmsUrl}/kml?layers=${layerName}&mode=download`;
  const classes = useStyles();

  const handleDownloadClick = () => {
    document.location = downloadUrl;
  };

  return enableDownloadLink
    ? layerName !== null && (
        <IconButton
          aria-label="download"
          className={classes.button}
          onClick={handleDownloadClick}
          size="small"
        >
          <CloudDownloadIcon />
        </IconButton>
      )
    : null;
}

export default DownloadLink;
