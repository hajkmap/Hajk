import React from "react";
import { IconButton, Paper, Tooltip } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";

import { styled } from "@mui/material/styles";
import { withTranslation } from "react-i18next";

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

const StyledIconButton = styled(IconButton)(() => ({
  minWidth: "unset",
}));

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
    const { t } = this.props;
    return (
      <Tooltip disableInteractive title={t("controls.mapResetter.toolTip")}>
        <StyledPaper>
          <StyledIconButton
            aria-label={t("controls.mapResetter.toolTip")}
            onClick={this.handleClick}
          >
            <HomeIcon />
          </StyledIconButton>
        </StyledPaper>
      </Tooltip>
    );
  }
}

export default withTranslation()(MapResetter);
