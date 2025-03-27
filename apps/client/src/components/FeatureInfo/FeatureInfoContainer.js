import React from "react";
import propTypes from "prop-types";
import { styled } from "@mui/material/styles";
import ArrowLeftIcon from "@mui/icons-material/ArrowLeft";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
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

import FeaturePropsParsing from "./FeaturePropsParsing";
import { getInfoClickInfoFromLayerConfig } from "../../utils/InfoClickHelpers";

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

  getFeatureProperties = (feature) => {
    let properties = feature.getProperties();
    properties = this.featurePropsParsing.extractPropertiesFromJson(properties);
    feature.setProperties(properties);
    return properties;
  };

  async updateFeatureInformation(newIndex) {
    // Let's display to the user that we're working on something...
    this.setState({ loading: true });
    // We're gonna need the current feature...
    const feature = this.props.features[newIndex];
    // ...and the layer that the feature origins from.
    const { layer } = feature;
    // With the feature and it's layer we can grab information needed to create
    // an informative feature-info.
    const { displayName: caption, infoclickDefinition: markdown } =
      getInfoClickInfoFromLayerConfig(feature, layer);

    // When we've grabbed the markdown-definition for the layer, we can create the
    // information that we want to display to the user by combining the definition with
    // the feature properties.
    const properties = this.getFeatureProperties(feature);
    const value = await this.getValue(markdown, properties, caption);
    // Finally, we'll update the state, and highlight the feature in the map.
    this.setState(
      {
        value: value,
        loading: false,
        caption: caption,
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

  isReadyToShowInfo = () => {
    const { caption, value, loading } = this.state;
    return caption && !loading && value;
  };

  renderFeatureInformation = () => {
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
      <InfoContainer
        className="hajk-featureinfo-body"
        alignContent="flex-start"
        container
        spacing={1}
      >
        {features.length > 1 && (
          <Grid className="hajk-featureinfo-navigation" xs={12} item>
            {this.getToggler()}
          </Grid>
        )}
        <Grid
          className="hajk-featureinfo-content"
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
