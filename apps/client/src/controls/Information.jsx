import React from "react";
import { createPortal } from "react-dom";
import propTypes from "prop-types";

import InfoIcon from "@mui/icons-material/Info";

import Dialog from "../components/Dialog/Dialog";
import { functionalOk as functionalCookieOk } from "../models/Cookie";
import ControlButton from "components/ControlButton";

class Information extends React.PureComponent {
  static propTypes = {
    options: propTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.type = "Information"; // Special case - plugins that don't use BaseWindowPlugin must specify .type here
    this.options = props.options;
    this.title = this.options.title || "Om kartan";
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
        type={this.type}
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
    return (
      <>
        {this.renderDialog()}
        <ControlButton
          tooltip={this.title}
          ariaLabel={this.title}
          onClick={this.handleOnClick}
        >
          <InfoIcon />
        </ControlButton>
      </>
    );
  }
}

export default Information;
