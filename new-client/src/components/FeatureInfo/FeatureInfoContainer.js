import React from "react";
import propTypes from "prop-types";
import { styled } from "@mui/material/styles";
import ArrowLeftIcon from "@mui/icons-material/ArrowLeft";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import FeaturePropsParsing from "./FeaturePropsParsing";
// import Diagram from "../Diagram";
// import HajkTable from "../Table";
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
} from "@mui/material";

const InfoContainer = styled(Grid)(() => ({
  height: "100%",
  cursor: "auto",
  userSelect: "text",
}));

const StyledTableContainer = styled(TableContainer)(() => ({
  marginBottom: "1.1rem",
}));

const TableCellKey = styled(TableCell)(() => ({
  verticalAlign: "top",
}));

const TableCellValue = styled(TableCell)(() => ({
  wordBreak: "break-all",
}));

const TogglerButtonRightContainer = styled(Grid)(({ theme }) => ({
  borderRight: `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
}));

const TogglerButtonLeftContainer = styled(Grid)(({ theme }) => ({
  borderLeft: `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
}));

class FeatureInfoContainer extends React.PureComponent {
  state = {
    selectedIndex: 0,
  };

  static propTypes = {
    features: propTypes.array.isRequired,
    onDisplay: propTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.featurePropsParsing = new FeaturePropsParsing({
      globalObserver: props.globalObserver,
      options: props.options,
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
    const { features } = this.props;
    return (
      <Grid
        alignItems="center"
        justifyContent="space-between"
        sx={{ backgroundColor: "primary.main" }}
        container
      >
        <TogglerButtonRightContainer item>
          <Button
            fullWidth
            disabled={this.state.selectedIndex - 1 < 0}
            onClick={this.stepLeft}
            aria-label="previous"
            id="step-left"
            sx={{ color: "primary.contrastText" }}
          >
            <ArrowLeftIcon />
          </Button>
        </TogglerButtonRightContainer>
        <Grid item>
          <Typography
            variant="button"
            sx={{ textAlign: "center", color: "primary.contrastText" }}
          >
            {this.state.selectedIndex + 1} av {features.length}
          </Typography>
        </Grid>
        <TogglerButtonLeftContainer item>
          <Button
            fullWidth
            disabled={this.state.selectedIndex + 1 >= features.length}
            onClick={this.stepRight}
            aria-label="next"
            id="step-right"
            sx={{ color: "primary.contrastText" }}
          >
            <ArrowRightIcon />
          </Button>
        </TogglerButtonLeftContainer>
      </Grid>
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
            <TableCellKey variant="head">{key}</TableCellKey>
            <TableCellValue>{data[key]}</TableCellValue>
          </TableRow>
        );
      } else {
        return null;
      }
    });

    return (
      <StyledTableContainer component="div">
        <Table size="small" aria-label="Table with infoclick details">
          <TableBody>{tableBody}</TableBody>
        </Table>
      </StyledTableContainer>
    );
  }

  // shortcode(str) {
  //   const codes = [];
  //   let shortcodes = str.match(/\[(.*?)\]/g);
  //   shortcodes = shortcodes === null ? [] : shortcodes;

  //   if (shortcodes) {
  //     shortcodes.forEach((code) => {
  //       str = str.replace(code, "");
  //       var params = code.replace("[", "").replace("]", "").split(" ");
  //       var c = {};

  //       params.forEach((param, i) => {
  //         if (i === 0) {
  //           c.shortcode = param;
  //         } else {
  //           let parts = param.split("=");
  //           c[parts[0]] = param.replace(parts[0] + "=", "").replace(/"/g, "");
  //         }
  //       });
  //       codes.push(c);
  //     });
  //     return {
  //       str: str,
  //       codes: codes,
  //     };
  //   } else {
  //     return;
  //   }
  // }

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

    // Get current id of feature and find out if it occurs in the layersInfo array.
    let featureId = feature.getId();
    let layersInfo = layerInfo.layersInfo;
    let layerId = Object.keys(layersInfo).find((key) =>
      featureId.includes(layersInfo[key].id)
    );

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
    if (layerId) {
      caption = layersInfo[layerId]?.caption || caption;
    }
    markdown = this.getMarkdownFromLocalInfoBox(feature, layer, markdown);

    // Disabled shortcodes for now as they mess with Markdown tags
    // for Links and Imgs that use "[" and "]".
    // if (markdown) {
    //   let transformed = this.shortcode(markdown);
    //   if (transformed) {
    //     shortcodes = transformed.codes;
    //     markdown = transformed.str;
    //   }
    // }

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
      return await this.featurePropsParsing
        .setMarkdownAndProperties({ markdown, properties })
        .mergeFeaturePropsWithMarkdown();
    } else {
      return this.getFeaturesAsDefaultTable(properties, caption);
    }
  };

  // renderShortcodes(shortcodes, feature) {
  //   return shortcodes.map((shortcode, i) => {
  //     switch (shortcode.shortcode) {
  //       case "diagram":
  //         return (
  //           <Diagram key={i} source={shortcode.source} feature={feature} />
  //         );
  //       case "table":
  //         return (
  //           <HajkTable key={i} source={shortcode.source} feature={feature} />
  //         );
  //       default:
  //         return null;
  //     }
  //   });
  // }

  isReadyToShowInfo = () => {
    const { caption, value, loading, shortcodes } = this.state;
    return caption && !loading && value && shortcodes;
  };

  renderFeatureInformation = () => {
    // const { caption, value, shortcodes, markdown } = this.state;
    const { caption, value } = this.state;

    return (
      <Grid sx={{ width: "100%" }} item>
        <Typography variant="button" align="center" component="h6" gutterBottom>
          {caption}
        </Typography>
        {value}
      </Grid>
    );
  };

  render() {
    const { features } = this.props;
    const featureInfoLoaded = this.isReadyToShowInfo();
    return (
      <InfoContainer alignContent="flex-start" container spacing={1}>
        {features.length > 1 && (
          <Grid xs={12} item>
            {this.getToggler()}
          </Grid>
        )}
        <Grid
          justifyContent="center"
          alignContent={featureInfoLoaded ? "flex-start" : "center"}
          sx={{ flex: "auto" }}
          item
          container
        >
          {featureInfoLoaded ? (
            this.renderFeatureInformation()
          ) : (
            <CircularProgress />
          )}
        </Grid>
      </InfoContainer>
    );
  }
}

export default FeatureInfoContainer;
