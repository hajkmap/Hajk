import React from "react";
import propTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import ArrowLeftIcon from "@material-ui/icons/ArrowLeft";
import ArrowRightIcon from "@material-ui/icons/ArrowRight";
import FeaturePropsParsing from "./FeaturePropsParsing";
import Diagram from "../Diagram";
import HajkTable from "../Table";
import {
  Table,
  TableContainer,
  CircularProgress,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Typography,
  Grid,
} from "@material-ui/core";

const styles = (theme) => ({
  toggler: {
    backgroundColor: theme.palette.primary.main,
  },
  infoContainer: {
    height: "100%",
    cursor: "auto",
    userSelect: "text",
  },
  typography: {
    textAlign: "center",
  },
  columnValue: {
    wordBreak: "break-all",
  },
  columnKey: {
    verticalAlign: "top",
  },
  featureInfoContainer: {
    flex: "auto",
  },
  featureInfo: {
    width: "100%",
  },
  togglerButtonRightContainer: {
    borderRight: `${theme.spacing(0.2)}px solid ${theme.palette.divider}`,
  },
  togglerButtonLeftContainer: {
    borderLeft: `${theme.spacing(0.2)}px solid ${theme.palette.divider}`,
  },
});

class FeatureInfoContainer extends React.PureComponent {
  state = {
    selectedIndex: 0,
  };

  static propTypes = {
    classes: propTypes.object.isRequired,
    features: propTypes.array.isRequired,
    onDisplay: propTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.featurePropsParsing = new FeaturePropsParsing({
      globalObserver: props.globalObserver,
    });
  }

  componentDidMount() {
    this.updateFeatureInformation(0);
  }

  showFeatureInMap = () => {
    const { onDisplay, features } = this.props;
    onDisplay(features[this.state.selectedIndex]);
  };

  stepLeft = () => {
    if (this.state.selectedIndex - 1 > -1) {
      let newIndex = this.state.selectedIndex - 1;
      this.updateFeatureInformation(newIndex);
    }
  };

  stepRight = () => {
    const { features } = this.props;
    if (this.state.selectedIndex + 1 < features.length) {
      let newIndex = this.state.selectedIndex + 1;
      this.updateFeatureInformation(newIndex);
    }
  };

  getToggler = () => {
    const { features, classes } = this.props;
    return (
      <Grid
        alignItems="center"
        justify="space-between"
        className={classes.toggler}
        container
      >
        <Grid item className={classes.togglerButtonRightContainer}>
          <Button
            fullWidth
            disabled={this.state.selectedIndex - 1 < 0}
            onClick={this.stepLeft}
            aria-label="previous"
            id="step-left"
          >
            <ArrowLeftIcon color="secondary" />
          </Button>
        </Grid>
        <Grid item>
          <Typography
            variant="button"
            color="secondary"
            className={classes.typography}
          >
            {this.state.selectedIndex + 1} av {features.length}
          </Typography>
        </Grid>
        <Grid item className={classes.togglerButtonLeftContainer}>
          <Button
            fullWidth
            disabled={this.state.selectedIndex + 1 >= features.length}
            onClick={this.stepRight}
            aria-label="next"
            id="step-right"
          >
            <ArrowRightIcon color="secondary" />
          </Button>
        </Grid>
      </Grid>
    );
  };

  getFeaturesAsDefaultTable(data, caption) {
    const { classes } = this.props;
    // We can't use "i" for coloring every second row, as some rows
    // will be removed (Objects are not printed), so there's a need
    // for a separate counter of rows that actually get printed.
    let j = 0;
    const tableBody = Object.keys(data).map((key, i) => {
      if (typeof data[key] !== "object") {
        ++j;
        return (
          <TableRow key={i} selected={j % 2 === 0}>
            <TableCell className={classes.columnKey} variant="head">
              {key}
            </TableCell>
            <TableCell className={classes.columnValue}>{data[key]}</TableCell>
          </TableRow>
        );
      } else {
        return null;
      }
    });

    return (
      <TableContainer component="div">
        <Table size="small" aria-label="Table with infoclick details">
          <TableBody>{tableBody}</TableBody>
        </Table>
      </TableContainer>
    );
  }

  shortcode(str) {
    var codes = [];
    var shortcodes = str.match(/\[(.*?)\]/g);
    shortcodes = shortcodes === null ? [] : shortcodes;

    if (shortcodes) {
      shortcodes.forEach((code) => {
        str = str.replace(code, "");
        var params = code.replace("[", "").replace("]", "").split(" ");
        var c = {};

        params.forEach((param, i) => {
          if (i === 0) {
            c.shortcode = param;
          } else {
            let parts = param.split("=");
            c[parts[0]] = param.replace(parts[0] + "=", "").replace(/"/g, "");
          }
        });
        codes.push(c);
      });
      return {
        str: str,
        codes: codes,
      };
    } else {
      return;
    }
  }

  getMarkdownFromLocalInfoBox = (feature, layer, markdown) => {
    // Same goes for infobox, I'm shortening the code significantly using the optional chaining.
    // Features coming from search result have infobox set on Feature instead of Layer due to
    // different features sharing same vector layer.
    return (
      feature?.infobox ||
      feature.layer?.layersInfo?.[layer]?.infobox ||
      markdown
    );
  };

  getAGSCompatibleLayer = (feature) => {
    return Object.keys(feature.layer.layersInfo).find((id) => {
      const fid = feature.getId().split(".")[0];
      const layerId = id.split(":").length === 2 ? id.split(":")[1] : id;
      return fid === layerId;
    });
  };

  getFeatureProperties = (feature) => {
    let properties = feature.getProperties();
    properties = this.featurePropsParsing.extractPropertiesFromJson(properties);
    feature.setProperties(properties);
    return properties;
  };

  async updateFeatureInformation(newIndex) {
    let feature = this.props.features[newIndex];
    const layerInfo = feature.layer.get("layerInfo");

    let markdown = layerInfo?.information,
      caption = layerInfo?.caption,
      layer,
      shortcodes = [];

    //Problem with geojson returned from AGS - Missing id on feature - how to handle?
    if (feature.layer.layersInfo && feature.getId()) {
      layer = this.getAGSCompatibleLayer(feature);
    }

    // Deal with layer groups that have a caption on sublayer. Layer groups will
    // have a 'layersInfo' (NB pluralis on layerSInfo), and if it exists,
    // let's overwrite the previously saved caption.
    // Below I'm using the new optional chaining operator (
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining),
    // which will return the new caption, if exists, or a falsy value. If falsy value is returned,
    // just fall back to the previous value of caption.
    caption = feature.layer?.layersInfo?.[layer]?.caption || caption;
    markdown = this.getMarkdownFromLocalInfoBox(feature, layer, markdown);

    if (markdown) {
      let transformed = this.shortcode(markdown);
      if (transformed) {
        shortcodes = transformed.codes;
        markdown = transformed.str;
      }
    }

    this.setState({ loading: true });

    let properties = this.getFeatureProperties(feature);
    const value = await this.getValue(markdown, properties, caption);

    this.setState(
      {
        value: value,
        loading: false,
        caption: caption,
        shortcodes: shortcodes,
        selectedIndex: newIndex,
        markdown: markdown,
      },
      () => {
        this.showFeatureInMap();
      }
    );
  }

  getValue = async (markdown, properties, caption) => {
    if (markdown) {
      return await this.featurePropsParsing.mergeFeaturePropsWithMarkdown(
        markdown,
        properties
      );
    } else {
      return this.getFeaturesAsDefaultTable(properties, caption);
    }
  };

  renderShortcodes(shortcodes, feature) {
    return shortcodes.map((shortcode, i) => {
      switch (shortcode.shortcode) {
        case "diagram":
          return (
            <Diagram key={i} source={shortcode.source} feature={feature} />
          );
        case "table":
          return (
            <HajkTable key={i} source={shortcode.source} feature={feature} />
          );
        default:
          return null;
      }
    });
  }

  isReadyToShowInfo = () => {
    const { caption, value, loading, shortcodes } = this.state;
    return caption && !loading && value && shortcodes;
  };

  renderFeatureInformation = () => {
    const { caption, value, shortcodes, markdown } = this.state;
    const { classes } = this.props;

    return (
      <Grid className={classes.featureInfo} item>
        <Typography variant="button" align="center" component="h6">
          {caption}
        </Typography>
        {markdown ? (
          value.map((element, index) => {
            return <React.Fragment key={index}>{element}</React.Fragment>;
          })
        ) : (
          <React.Fragment>{value}</React.Fragment>
        )}

        {shortcodes.length > 0 &&
          this.renderShortcodes(
            shortcodes,
            this.props.features[this.state.selectedIndex - 1]
          )}
      </Grid>
    );
  };

  render() {
    const { classes, features } = this.props;
    const featureInfoLoaded = this.isReadyToShowInfo();
    return (
      <Grid
        alignContent="flex-start"
        className={classes.infoContainer}
        container
        spacing={1}
      >
        {features.length > 1 && (
          <Grid xs={12} item>
            {this.getToggler()}
          </Grid>
        )}
        <Grid
          justify="center"
          alignContent={featureInfoLoaded ? "flex-start" : "center"}
          className={classes.featureInfoContainer}
          item
          container
        >
          {featureInfoLoaded ? (
            this.renderFeatureInformation()
          ) : (
            <CircularProgress />
          )}
        </Grid>
      </Grid>
    );
  }
}

export default withStyles(styles)(FeatureInfoContainer);
