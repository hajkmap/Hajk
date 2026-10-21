import React from "react";
import { styled } from "@mui/material/styles";
import withSnackbar from "components/WithSnackbar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { isMobile } from "../../utils/IsMobile";
import { Trans } from "react-i18next";
import i18n from "src/i18n";

const StreetViewWindow = styled("div")(() => ({
  flex: 1,
  position: "absolute !important",
  top: isMobile ? 0 : "54px",
  bottom: 0,
  left: 0,
  right: 0,
}));

const DateWrapper = styled("div")(({ theme }) => ({
  color: theme.palette.common.white,
  position: "absolute",
  zIndex: 1,
  top: isMobile ? 0 : "54px",
  left: 0,
  background: "rgba(0, 0, 0, 0.7)",
  padding: "0px 3px",
  lineHeight: 1.4,
  fontSize: "10px",
}));

class StreetViewView extends React.PureComponent {
  state = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.app = this.props.app;
    this.localObserver = this.props.localObserver;
  }

  componentDidMount() {
    this.localObserver.subscribe("changeImageDate", (imageDate) => {
      this.setState({
        imageDate: imageDate,
      });
    });
    this.localObserver.subscribe("googleMapsApiLoadFailed", () => {
      this.props.snackbar.show(i18n.t("streetView.loadFailed"), "error");
    });
  }

  componentWillUnmount() {
    this.props.model.deactivate();
  }

  renderInfoText() {
    if (!this.props.displayPanorama) {
      return (
        <Typography sx={{ padding: 2 }}>
          <Trans
            i18nKey="streetView.instructions"
            components={{ br: <br /> }}
          />
        </Typography>
      );
    }
  }

  render() {
    return (
      <div>
        {this.renderInfoText()}
        <Box
          sx={{
            minHeight: "200px",
            display: this.props.displayPanorama ? "flex" : "none",
          }}
        >
          <StreetViewWindow id="street-view-window" />
          <DateWrapper id="image-date">
            {this.state.imageDate ? this.state.imageDate : ""}
          </DateWrapper>
        </Box>
      </div>
    );
  }
}

export default withSnackbar(StreetViewView);
