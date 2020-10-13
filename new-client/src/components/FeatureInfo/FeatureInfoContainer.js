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
  ButtonGroup,
  Button,
  Typography,
  Grid,
} from "@material-ui/core";

const styles = (theme) => ({
  stepButton: {
    width: "20%",
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "space-between",
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
    this.setNewFeatureInformation(0);
  }

  showFeatureInMap = () => {
    this.props.onDisplay(this.props.features[this.state.selectedIndex - 1]);
  };

  stepLeft = () => {
    if (this.state.selectedIndex - 1 > -1) {
      let newIndex = this.state.selectedIndex - 1;
      this.setNewFeatureInformation(newIndex);
    }
  };

  stepRight = () => {
    const { features } = this.props;
    if (this.state.selectedIndex + 1 < features.length) {
      let newIndex = this.state.selectedIndex + 1;
      this.setNewFeatureInformation(newIndex);
    }
  };

  getStepButton = (onClickFunction, icon, disabled) => {
    const { classes } = this.props;
    return (
      <Button
        disabled={disabled}
        className={classes.stepButton}
        onClick={onClickFunction}
        aria-label="Previous"
        id="step-left"
      >
        {icon}
      </Button>
    );
  };

  getToggler = () => {
    const { features, classes } = this.props;
    return (
      <>
        <ButtonGroup
          fullWidth
          className={classes.buttonGroup}
          aria-label="Browse through infoclick results"
          color="primary"
          size="small"
          variant="contained"
        >
          {this.getStepButton(
            this.stepLeft,
            <ArrowLeftIcon />,
            this.state.selectedIndex - 1 < 0
          )}
          {this.getStepButton(
            this.stepRight,
            <ArrowRightIcon />,
            this.state.selectedIndex + 1 >= features.length
          )}
        </ButtonGroup>
      </>
    );
  };

  getFeaturesAsDefaultTable(data, caption) {
    // We can't use "i" for coloring every second row, as some rows
    // will be removed (Objects are not printed), so there's a need
    // for a separate counter of rows that actually get printed.
    let j = 0;
    const tableBody = Object.keys(data).map((key, i) => {
      if (typeof data[key] !== "object") {
        ++j;
        return (
          <TableRow key={i} selected={j % 2 === 0}>
            <TableCell variant="head">{key}</TableCell>
            <TableCell>{data[key]}</TableCell>
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

  getFeatureProperties = (feature) => {
    let properties = feature.getProperties();
    properties = this.featurePropsParsing.extractPropertiesFromJson(properties);
    feature.setProperties(properties);
    return properties;
  };

  async setNewFeatureInformation(newIndex) {
    let feature = this.props.features[newIndex];
    const layerInfo = feature.layer.get("layerInfo");
    let markdown = layerInfo?.information;
    let caption = layerInfo?.caption;

    let layer,
      shortcodes = [];

    //Problem with geojson returned from AGS - Missing id on feature - how to handle?
    if (feature.layer.layersInfo && feature.getId()) {
      layer = Object.keys(feature.layer.layersInfo).find((id) => {
        const fid = feature.getId().split(".")[0];
        const layerId = id.split(":").length === 2 ? id.split(":")[1] : id;
        return fid === layerId;
      });
    }

    // Deal with layer groups that have a caption on sublayer. Layer groups will
    // have a 'layersInfo' (NB pluralis on layerSInfo), and if it exists,
    // let's overwrite the previously saved caption.
    // Below I'm using the new optional chaining operator (
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining),
    // which will return the new caption, if exists, or a falsy value. If falsy value is returned,
    // just fall back to the previous value of caption.
    caption = feature.layer?.layersInfo?.[layer]?.caption || caption;

    // Same goes for infobox, I'm shortening the code significantly using the optional chaining.
    // Features coming from search result have infobox set on Feature instead of Layer due to
    // different features sharing same vector layer.
    markdown =
      feature?.infobox ||
      feature.layer?.layersInfo?.[layer]?.infobox ||
      markdown;

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
      <>
        <Typography variant="button" align="center" component="h6">
          {caption}
        </Typography>
        {markdown ? (
          value.featureInfo.map((element, index) => {
            console.log(element, "eelemt");
            return <React.Fragment key={index}>{element}</React.Fragment>;
          })
        ) : (
          <div className={classes.textContent}>{value}</div>
        )}

        {shortcodes.length > 0 &&
          this.renderShortcodes(
            shortcodes,
            this.props.features[this.state.selectedIndex - 1]
          )}
      </>
    );
  };

  render() {
    return (
      <Grid direction="column" container>
        <Grid item>{this.getToggler()}</Grid>
        <Grid item>
          {this.state.loading && <CircularProgress />}
          {this.isReadyToShowInfo() && this.renderFeatureInformation()}
        </Grid>
      </Grid>
    );
  }
}

export default withStyles(styles)(FeatureInfoContainer);
