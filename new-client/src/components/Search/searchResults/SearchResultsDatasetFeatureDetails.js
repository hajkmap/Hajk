import React from "react";
import FeaturePropsParsing from "../../FeatureInfo/FeaturePropsParsing";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Typography,
  Grid,
  Button,
  Tooltip,
} from "@mui/material";
import ArrowLeftIcon from "@mui/icons-material/ArrowLeft";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import { styled } from "@mui/material/styles";

const StyledTableCell = styled(TableCell)(() => ({
  paddingLeft: 0,
  wordBreak: "break-all",
  width: "50%",
}));

const FeatureDetailsContainer = styled(Grid)(({ theme }) => ({
  maxWidth: "100%",
  paddingLeft: theme.spacing(1),
  paddingRight: theme.spacing(1),
}));

const HeaderContainer = styled(Grid)(({ theme }) => ({
  paddingTop: theme.spacing(1),
}));

const HeaderTypography = styled(Typography)(() => ({
  maxWidth: "100%",
  fontSize: 18,
}));

const TogglerButton = styled(Button)(() => ({
  minWidth: 26,
  padding: 0,
}));

class SearchResultsDatasetFeatureDetails extends React.PureComponent {
  state = {
    infoBox: null,
  };

  constructor(props) {
    super(props);

    this.featurePropsParsing = new FeaturePropsParsing({
      globalObserver: props.app.globalObserver,
      options:
        props.app.appModel.config.mapConfig.tools.find(
          (t) => t.type === "infoclick"
        )?.options || [], // featurePropsParsing needs to know if FeatureInfo is configured to allow HTML or not, so we pass on its' options
    });
  }

  componentDidMount = () => {
    this.getInfoBox();
  };

  componentDidUpdate = (prevProps) => {
    const { feature } = this.props;
    const prevFeature = prevProps.feature;
    if (feature !== prevFeature) {
      this.getInfoBox();
    }
  };

  getInfoBox = () => {
    if (this.shouldRenderCustomInfoBox()) {
      this.getHtmlItemInfoBox();
    } else {
      this.getDefaultInfoBox();
    }
  };

  shouldRenderCustomInfoBox = () => {
    const { feature } = this.props;
    const source = feature.source ?? this.props.source;
    return source.infobox && source.infobox !== "";
  };

  getHtmlItemInfoBox = () => {
    const { feature } = this.props;
    const source = feature.source ?? this.props.source;
    feature.properties = this.featurePropsParsing.extractPropertiesFromJson(
      feature.properties
    );
    this.featurePropsParsing
      .setMarkdownAndProperties({
        markdown: source.infobox,
        properties: feature.properties,
      })
      .mergeFeaturePropsWithMarkdown()
      .then((MarkdownComponent) => {
        this.setState({ infoBox: MarkdownComponent });
      });
  };

  getDefaultInfoBox = () => {
    this.setState({ infoBox: this.renderDefaultInfoBox() });
  };

  renderTableCell = (content, position) => {
    const textToRender = Array.isArray(content) ? content.join(", ") : content;
    return (
      <StyledTableCell
        align={position}
        style={position === "right" ? { paddingRight: 0 } : null}
      >
        {textToRender}
      </StyledTableCell>
    );
  };

  renderDefaultInfoBox = () => {
    const { feature } = this.props;
    return (
      <TableContainer>
        <Table size="small">
          <TableBody>
            {Object.entries(feature.properties).map((row) => {
              return (
                <TableRow key={row[0]}>
                  {this.renderTableCell(row[0])}
                  {this.renderTableCell(row[1], "right")}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  handleTogglerPressed = (nextFeatureIndex) => {
    const { setActiveFeature, features } = this.props;
    const nextFeature = features[nextFeatureIndex];
    setActiveFeature(nextFeature);
  };

  getFeatureIndex = (feature, features) => {
    return (
      features?.findIndex((f) => {
        return f.id === feature.id;
      }) ?? -1
    );
  };

  renderFeatureToggler = () => {
    const { feature, features } = this.props;
    const numFeaturesInCollection = features.length;
    const currentFeatureIndex = this.getFeatureIndex(feature, features);

    const buttonLeftDisabled = currentFeatureIndex - 1 < 0;
    const buttonRightDisabled =
      currentFeatureIndex + 1 >= numFeaturesInCollection;

    return (
      <Grid container item alignItems="center" justifyContent="space-between">
        <Grid item>
          <Tooltip
            disableInteractive
            title={
              !buttonLeftDisabled
                ? "Visa föregående objekt i resultatlistan"
                : ""
            }
          >
            <span>
              <TogglerButton
                size="small"
                variant="outlined"
                disabled={buttonLeftDisabled}
                onClick={() =>
                  this.handleTogglerPressed(currentFeatureIndex - 1)
                }
                aria-label="show-previous-feature"
                id="step-left"
              >
                <ArrowLeftIcon
                  fontSize="small"
                  color={buttonLeftDisabled ? "disabled" : "action"}
                />
              </TogglerButton>
            </span>
          </Tooltip>
        </Grid>
        <Grid item>
          <Tooltip
            disableInteractive
            title={
              !buttonRightDisabled ? "Visa nästa objekt i resultatlistan" : ""
            }
          >
            <span>
              <TogglerButton
                size="small"
                variant="outlined"
                disabled={buttonRightDisabled}
                onClick={() =>
                  this.handleTogglerPressed(currentFeatureIndex + 1)
                }
                aria-label="show-next-feature"
                id="step-left"
              >
                <ArrowRightIcon
                  fontSize="small"
                  color={buttonRightDisabled ? "disabled" : "action"}
                />
              </TogglerButton>
            </span>
          </Tooltip>
        </Grid>
      </Grid>
    );
  };

  renderFeatureTitle = () => {
    const { featureTitle } = this.props;
    return (
      <HeaderTypography noWrap component="div" variant="button" align="left">
        {featureTitle}
      </HeaderTypography>
    );
  };

  render() {
    const { features, enableFeatureToggler } = this.props;
    const { infoBox } = this.state;
    const shouldRenderToggler =
      (enableFeatureToggler ?? true) && features?.length > 1;
    return (
      <FeatureDetailsContainer container>
        <HeaderContainer container alignItems="center">
          <Grid
            item
            xs={shouldRenderToggler ? 9 : 12}
            md={shouldRenderToggler ? 10 : 12}
          >
            {this.renderFeatureTitle()}
          </Grid>
          {shouldRenderToggler && (
            <Grid item xs={3} md={2}>
              {this.renderFeatureToggler()}
            </Grid>
          )}
        </HeaderContainer>
        {infoBox && (
          <Grid item xs={12}>
            {infoBox}
          </Grid>
        )}
      </FeatureDetailsContainer>
    );
  }
}
export default SearchResultsDatasetFeatureDetails;
