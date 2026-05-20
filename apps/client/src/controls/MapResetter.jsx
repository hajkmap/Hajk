import React from "react";
import HomeIcon from "@mui/icons-material/Home";

import ControlButton from "components/ControlButton";

/**
 * @summary Resets map to initial zoom level, centrum coordinate and active layers.
 *
 * @param {object} props
 * @returns {object} React
 */
class MapResetter extends React.PureComponent {
  // TODO: Also reset layers to default visibility!
  handleClick = (e) => {
    const { map } = this.props;
    if (map !== undefined) {
      const view = map.getView();
      const { zoom, center } = this.props.mapConfig.map;
      view.animate({ zoom, center });
    }
  };

  render() {
    return (
      <ControlButton
        tooltip="Återställ kartan till startläget"
        ariaLabel="Återställ kartan till startläget"
        onClick={this.handleClick}
      >
        <HomeIcon />
      </ControlButton>
    );
  }
}

export default MapResetter;
