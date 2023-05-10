import React, { Component } from "react";
import { styled } from "@mui/material/styles";
import Popper from "@mui/material/Popper";
import Paper from "@mui/material/Paper";
import PanelHeader from "./PanelHeader";

const StyledPopper = styled(Popper)(({ theme }) => ({
  zIndex: 4,
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  maxWidth: "400px",
  background: "white",
}));

const ChildrenContainer = styled("div")(({ theme }) => ({
  padding: "15px",
  overflow: "auto",
}));

/**
 * @summary Currently not implemented popup for infoclick. Similar to how  it worked in Hajk2.
 *
 * @class PopPanel
 * @extends {Component}
 */
class PopPanel extends Component {
  state = {
    panelPosition: false,
    placement: "right-start",
  };

  // TODO: Implement. Add propTypes.

  close = (e) => {
    const { onClose } = this.props;
    if (onClose) onClose();
  };
  componentDidMount() {
    if (this.props.globalObserver) {
      this.props.globalObserver.subscribe("core.toolbarExpanded", (open) => {
        this.setState(
          {
            placement: "right",
          },
          () => {
            this.setState({
              placement: "right-start",
            });
          }
        );
      });
    }
  }

  render() {
    var { children, anchorEl, open } = this.props;
    const { placement } = this.state;
    if (open === undefined) {
      open = false;
    }
    const id = open ? "no-transition-popper" : null;
    return (
      <StyledPopper
        id={id}
        open={open}
        anchorEl={anchorEl}
        placement={placement}
      >
        <StyledPaper>
          <PanelHeader
            title={this.props.title}
            onClose={this.close}
            maximizable={false}
            onMaximize={() => {}}
            onMinimize={() => {}}
          />
          <ChildrenContainer>{children}</ChildrenContainer>
        </StyledPaper>
      </StyledPopper>
    );
  }
}

export default PopPanel;
