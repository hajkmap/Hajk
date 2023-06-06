import React from "react";
import { createPortal } from "react-dom";
import { styled } from "@mui/material/styles";
import propTypes from "prop-types";

import { IconButton, Paper, Tooltip } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

import Dialog from "../components/Dialog/Dialog";
import { functionalOk as functionalCookieOk } from "models/Cookie";

import { withTranslation } from "react-i18next";

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

const StyledIconButton = styled(IconButton)(() => ({
  minWidth: "unset",
}));

class Information extends React.PureComponent {
  static propTypes = {
    options: propTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.type = "Information"; // Special case - plugins that don't use BaseWindowPlugin must specify .type here
    this.options = props.options;
    this.state = {
      dialogOpen: false,
    };
  }

  componentDidMount() {
    let dialogOpen = this.options.visibleAtStart;

    if (this.options.visibleAtStart === true) {
      if (
        this.options.showInfoOnce === true &&
        parseInt(
          window.localStorage.getItem("pluginInformationMessageShown")
        ) === 1
      ) {
        dialogOpen = false;
      } else {
        if (this.options.showInfoOnce === true && functionalCookieOk()) {
          window.localStorage.setItem("pluginInformationMessageShown", 1);
        }
        dialogOpen = true;
      }
    } else {
      dialogOpen = false;
    }

    this.setState({
      dialogOpen,
    });
  }

  onClose = () => {
    this.setState({
      dialogOpen: false,
    });
  };

  handleOnClick = () => {
    this.setState({
      dialogOpen: true,
    });
  };

  renderDialog() {
    const { headerText, text, buttonText } = this.props.options;

    return createPortal(
      <Dialog
        options={{
          headerText,
          text,
          buttonText,
          useLegacyNonMarkdownRenderer: true, // Preserve backward compatibility with how Dialog used to work prior ReactMarkdown
        }}
        open={this.state.dialogOpen}
        onClose={this.onClose}
      />,
      document.getElementById("windows-container")
    );
  }

  render() {
    const { t } = this.props;
    return (
      <>
        {this.renderDialog()}
        <Tooltip
          disableInteractive
          title={this.options.title || t("controls.information.title")}
        >
          <StyledPaper>
            <StyledIconButton
              aria-label={this.options.title || t("controls.information.title")}
              onClick={this.handleOnClick}
            >
              <InfoIcon />
            </StyledIconButton>
          </StyledPaper>
        </Tooltip>
      </>
    );
  }
}

export default withTranslation()(Information);
