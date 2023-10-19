import React, { Component } from "react";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import LaunchIcon from "@mui/icons-material/Launch";
import { Button, IconButton, Grid, Typography, Paper } from "@mui/material";
import CallMadeIcon from "@mui/icons-material/CallMade";
import { styled } from "@mui/material/styles";
import Popover from "@mui/material/Popover";

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginRight: theme.spacing(0.5),
  border: `${theme.spacing(0.1)} solid ${theme.palette.divider}`,
}));

const ContentGridContainer = styled(Grid)(({ theme }) => ({
  padding: theme.spacing(1),
}));

const TitleGridContainer = styled(Grid)(({ theme }) => ({
  paddingLeft: theme.spacing(0.5),
}));

const LinkContainer = styled("div")(({ theme }) => ({
  padding: theme.spacing(0.5),
}));

class BreadCrumb extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hidden: props.layer.getOpacity() === 0,
      anchorEl: null,
      popoverOpen: false,
    };
    this.chapters = this.findChapters(
      this.props.layer.get("name"),
      this.props.chapters
    );
  }

  setHidden = (e) => {
    var o = e.target.getOpacity();
    this.setState({
      hidden: o === 0,
    });
  };

  componentDidMount() {
    this.props.layer.on("change:opacity", this.setHidden);
  }

  componentWillUnmount() {
    this.props.layer.un("change:opacity", this.setHidden);
  }

  setLayerOpacity = (layer) => (event) => {
    this.setState(
      {
        hidden: !this.state.hidden,
      },
      () => {
        layer.setOpacity(this.state.hidden ? 0 : 1);
      }
    );
  };

  setLayerVisibility = (layer) => (event) => {
    if (layer.get("visible")) {
      layer.setOpacity(1);
      this.props.app.globalObserver.publish("layerswitcher.hideLayer", layer);
    }
    layer.set("visible", !layer.get("visible"));
  };

  isOverflow(el) {
    if (!el) return false;
    let original = el.scrollLeft++;
    let overflow = el.scrollLeft-- > original;
    return overflow;
  }

  findChapters(id, chapters) {
    if (!chapters) {
      return [];
    }
    return chapters.reduce((chaptersWithLayer, chapter) => {
      if (Array.isArray(chapter.layers)) {
        if (chapter.layers.some((layerId) => layerId === id)) {
          chaptersWithLayer = [...chaptersWithLayer, chapter];
        }
        if (chapter.chapters.length > 0) {
          chaptersWithLayer = [
            ...chaptersWithLayer,
            ...this.findChapters(id, chapter.chapters),
          ];
        }
      }
      return chaptersWithLayer;
    }, []);
  }

  renderChapterLinks() {
    if (this.chapters && this.chapters.length > 0) {
      if (this.chapters.length > 0) {
        return (
          <LinkContainer>
            {this.chapters.map((chapter, i) => {
              return (
                <div key={i}>
                  <Button
                    size="small"
                    onClick={() => {
                      this.setState({
                        popoverOpen: false,
                      });
                      this.openInformative(chapter);
                    }}
                  >
                    {chapter.header}
                    <CallMadeIcon />
                  </Button>
                </div>
              );
            })}
          </LinkContainer>
        );
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  openInformative = (chapter) => {
    const informativeWindow = this.props.app.windows.find(
      (window) => window.type === "informative"
    );
    informativeWindow.props.custom.open(chapter);
  };

  handleClose = () => {
    this.setState({
      anchorEl: null,
      popoverOpen: false,
    });
  };

  renderChaptersPopover(target) {
    this.setState({
      anchorEl: target,
      popoverOpen: true,
    });
  }

  renderInformativeIcon() {
    if (!this.props.chapters) {
      return null;
    }
    if (this.chapters && this.chapters.length > 0) {
      return (
        <IconButton
          size="small"
          onClick={(e) => {
            this.chapters.length === 1
              ? this.openInformative(this.chapters[0])
              : this.renderChaptersPopover(e.target);
          }}
        >
          <LaunchIcon />
        </IconButton>
      );
    } else {
      return null;
    }
  }

  render() {
    const { layer, title, type } = this.props;
    const { hidden } = this.state;
    return (
      <StyledPaper square={type === "flat"} elevation={0}>
        <ContentGridContainer
          container
          data-type="bread-crumb"
          justifyContent="space-between"
          alignItems="center"
        >
          <Grid item>
            <IconButton
              size="small"
              onClick={this.setLayerOpacity(layer)}
              aria-label="Visa/dölj lagret tillfälligt"
            >
              {!hidden ? <VisibilityIcon /> : <VisibilityOffIcon />}
            </IconButton>
          </Grid>
          {this.renderInformativeIcon()}
          <TitleGridContainer item>
            <Typography
              variant="body2"
              noWrap
              style={{ fontWeight: hidden ? "normal" : "bold" }}
            >
              {title}
            </Typography>
          </TitleGridContainer>
          <Grid item>
            <IconButton
              size="small"
              onClick={this.setLayerVisibility(layer)}
              aria-label="Ta bort lagret från kartan"
            >
              <CloseIcon />
            </IconButton>
          </Grid>
        </ContentGridContainer>
        <Popover
          id="simple-popper"
          open={this.state.popoverOpen}
          anchorEl={this.state.anchorEl}
          onClose={this.handleClose}
          anchorOrigin={{
            vertical: "top",
            horizontal: "center",
          }}
          transformOrigin={{
            vertical: "bottom",
            horizontal: "center",
          }}
        >
          {this.renderChapterLinks()}
        </Popover>
      </StyledPaper>
    );
  }
}

export default BreadCrumb;