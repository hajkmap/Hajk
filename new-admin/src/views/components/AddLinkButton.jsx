import React from "react";
import { Component } from "react";
import ReactModal from "react-modal";
import Button from "@material-ui/core/Button";
import { withStyles } from "@material-ui/core/styles";
import LinkIcon from "@material-ui/icons/Link";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import DescriptionIcon from "@material-ui/icons/Description";
import MapIcon from "@material-ui/icons/Map";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import NativeSelect from "@material-ui/core/NativeSelect";
import TextField from "@material-ui/core/TextField";

const LinkButton = withStyles((theme) => ({
  root: {
    color: "#999",
    height: "40px",
    marginRight: "16px",
    display: "inline-block",
    padding: "5px",
    border: "1px solid #ccc",
    borderRadius: 0,
    "&:hover": {
      backgroundColor: "#ccc",
    },
  },
}))(Button);

class AddLinkButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      url: "something",
      linkMenuVisible: false,
      anchorEl: null,
      documentLinkVisible: false,
      mapLinkVisible: false,
      linkVisible: false,
    };
  }

  addLink() {
    var linkType = "document-link";
    var testLink = "/documentsource/";
    this.setState({
      linkMenuVisible: false,
    });
    this.props.addLink(linkType, testLink);
  }

  urlChanged(e) {
    this.setState({
      url: e.target.value,
    });
  }

  renderAddLinkMenu() {
    return (
      <Menu
        id="add-link-menu"
        anchorEl={this.state.anchorEl}
        open={this.state.linkMenuVisible}
        onClose={this.closeLinkMenu}
      >
        <MenuItem
          onClick={() => {
            this.setState({
              linkMenuVisible: !this.state.linkMenuVisible,
              documentLinkVisible: !this.state.documentLinkVisible,
              mapLinkVisible: false,
              linkVisible: false,
            });
          }}
        >
          <ListItemIcon>
            <DescriptionIcon />
          </ListItemIcon>
          Dokumentlänk
        </MenuItem>
        <MenuItem
          onClick={() => {
            this.setState({
              linkMenuVisible: !this.state.linkMenuVisible,
              documentLinkVisible: false,
              mapLinkVisible: !this.state.mapLinkVisible,
              linkVisible: false,
            });
          }}
        >
          <ListItemIcon>
            <MapIcon />
          </ListItemIcon>
          Kartlänk
        </MenuItem>
        <MenuItem
          onClick={() => {
            this.setState({
              linkMenuVisible: !this.state.linkMenuVisible,
              documentLinkVisible: false,
              mapLinkVisible: false,
              linkVisible: !this.state.linkVisible,
            });
          }}
        >
          <ListItemIcon>
            <LinkIcon />
          </ListItemIcon>
          Webblänk
        </MenuItem>
      </Menu>
    );
  }

  openLinkMenu = (event) => {
    this.setState({
      linkMenuVisible: true,
      anchorEl: event.currentTarget,
    });
  };

  closeLinkMenu = () => {
    this.setState({
      linkMenuVisible: false,
    });
  };

  renderAddDocumentLinkDialog() {
    return (
      <ReactModal
        isOpen={this.state.documentLinkVisible}
        onRequestClose={(e) => this.closeDocumentLinkDialog()}
        className="modal document-editor-modal"
        overlayClassName="Overlay"
        appElement={document.getElementById("root")}
      >
        <div className="modal-content">
          <div className="modal-header">
            <DescriptionIcon />
            <h5 className="modal-title">Dokumentlänk</h5>
            <button
              type="button"
              className="close"
              data-dismiss="modal"
              aria-label="Close"
              onClick={(e) => this.closeDocumentLinkDialog()}
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <form noValidate autoComplete="off">
              <TextField
                className="document-link-input"
                label="(Titel) <a>titel</a>"
              />
              <TextField
                className="document-link-input"
                label="(Dokument) data-document"
              />
              <TextField
                className="document-link-input"
                label="(Rubrik) data-header-identifier"
              />
            </form>
            <NativeSelect
              id="demo-customized-select-native"
              className="document-link-input"
            >
              <option aria-label="None" value="" />
              <option value={10}>data-document</option>
              <option value={20}>Dokument 2</option>
              <option value={30}>Dokument 3</option>
            </NativeSelect>
            <NativeSelect
              id="demo-customized-select-native"
              className="document-link-input"
            >
              <option aria-label="None" value="" />
              <option value={10}>data-header-identifier</option>
              <option value={20}>Rubrik 2</option>
              <option value={30}>Rubrik 3</option>
            </NativeSelect>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                this.addLink();
              }}
            >
              Infoga
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              data-dismiss="modal"
              onClick={(e) => this.closeDocumentLinkDialog()}
            >
              Avbryt
            </button>
          </div>
        </div>
      </ReactModal>
    );
  }

  closeDocumentLinkDialog() {
    this.setState({
      documentLinkVisible: false,
    });
  }

  renderAddMapLinkDialog() {
    return (
      <ReactModal
        isOpen={this.state.mapLinkVisible}
        onRequestClose={(e) => this.closeMapLinkDialog()}
        className="modal document-editor-modal"
        overlayClassName="Overlay"
        appElement={document.getElementById("root")}
      >
        <div className="modal-content">
          <div className="modal-header">
            <DescriptionIcon />
            <h5 className="modal-title">Kartlänk</h5>
            <button
              type="button"
              className="close"
              data-dismiss="modal"
              aria-label="Close"
              onClick={(e) => this.closeMapLinkDialog()}
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <form noValidate autoComplete="off">
              <TextField
                className="map-link-input"
                label="(Titel) <a>titel</a>"
              />
              <TextField className="document-link-input" label="(URL) " />
            </form>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                this.addLink();
              }}
            >
              Infoga
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              data-dismiss="modal"
              onClick={(e) => this.closeMapLinkDialog()}
            >
              Avbryt
            </button>
          </div>
        </div>
      </ReactModal>
    );
  }

  closeMapLinkDialog() {
    this.setState({
      mapLinkVisible: false,
    });
  }

  renderAddLinkDialog() {
    return (
      <ReactModal
        isOpen={this.state.linkVisible}
        onRequestClose={(e) => this.closeLinkDialog()}
        className="modal document-editor-modal"
        overlayClassName="Overlay"
        appElement={document.getElementById("root")}
      >
        <div className="modal-content">
          <div className="modal-header">
            <DescriptionIcon />
            <h5 className="modal-title">Webblänk</h5>
            <button
              type="button"
              className="close"
              data-dismiss="modal"
              aria-label="Close"
              onClick={(e) => this.closeLinkDialog()}
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <form noValidate autoComplete="off">
              <TextField
                className="map-link-input"
                label="(Titel) <a>titel</a>"
              />
              <TextField
                className="document-link-input"
                label="(URL) data-document"
              />
            </form>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                this.addLink();
              }}
            >
              Infoga
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              data-dismiss="modal"
              onClick={(e) => this.closeLinkDialog()}
            >
              Avbryt
            </button>
          </div>
        </div>
      </ReactModal>
    );
  }

  closeLinkDialog() {
    this.setState({
      linkVisible: false,
    });
  }

  render() {
    return (
      <div className="document-editor-controls">
        <LinkButton
          aria-label="More"
          aria-owns={this.state.linkMenuVisible ? "add-link-menu" : null}
          aria-haspopup="true"
          onClick={this.openLinkMenu}
        >
          <LinkIcon />
          <ArrowDropDownIcon />
        </LinkButton>
        {this.renderAddLinkMenu()}
        {this.renderAddDocumentLinkDialog()}
        {this.renderAddMapLinkDialog()}
        {this.renderAddLinkDialog()}
      </div>
    );
  }
}

export default AddLinkButton;
