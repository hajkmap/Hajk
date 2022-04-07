import React from "react";
import { IconEdp } from "./FirIcons";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";
import { withSnackbar } from "notistack";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import { Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Collapse from "@mui/material/Collapse";
import { hfetch } from "utils/FetchWrapper";

const ButtonWithLoader = styled(Button)(({ theme, loading }) => ({
  "& img": {
    opacity: loading === "true" ? 0.3 : 1.0,
  },
}));

const TypographyHeading = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
}));

const CircularProgressButton = styled(CircularProgress)(({ theme }) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  marginTop: -12,
  marginLeft: -12,
}));

const DivBottomContainer = styled("div")(({ theme }) => ({
  paddingTop: theme.spacing(2),
  textAlign: "center",
}));

class FirExportEdpView extends React.PureComponent {
  state = {
    accordionExpanded: false,
    loading: false,
    dataWasSent: false,
  };

  static propTypes = {
    results: PropTypes.array.isRequired,
    model: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
  };

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.options = this.model.app.plugins.fir.options;
  }

  EdpLogo() {
    return (
      <img src={IconEdp()} alt="" style={{ width: "24px", height: "auto" }} />
    );
  }

  getEdpDataAsArray = () => {
    let a = [];

    this.props.results.forEach((feature) => {
      a.push({
        Fnr: feature.get(this.options.edp.idField),
        Fastbet: feature.get(this.options.edp.designationField),
      });
    });

    return a;
  };

  handleEdpClick = () => {
    this.setState({ loading: true });

    let data = new URLSearchParams();
    data.append("json", JSON.stringify(this.getEdpDataAsArray()));
    hfetch(this.options.edp.url, {
      method: "post",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: data,
    })
      .then((res) => {
        clearTimeout(this.tm1);
        clearTimeout(this.tm2);
        this.tm1 = setTimeout(() => {
          this.setState({ loading: false });
          this.setState({ dataWasSent: true });
          this.tm2 = setTimeout(() => {
            this.setState({ dataWasSent: false });
          }, 3000);
        }, 1000);
      })
      .catch((err) => {
        this.setState({ loading: false });
        this.setState({ dataWasSent: false });
        this.props.closeSnackbar(this.snackBar);
        this.snackBar = this.props.enqueueSnackbar(
          "Ett fel inträffade vid exporten till EDP.",
          {
            variant: "error",
          }
        );
      });
  };

  render() {
    return (
      <>
        <Accordion
          disabled={this.props.results.length === 0}
          expanded={
            this.state.accordionExpanded && this.props.results.length > 0
          }
          onChange={() => {
            this.setState({
              accordionExpanded: !this.state.accordionExpanded,
            });
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <TypographyHeading>EDP Vision</TypographyHeading>
          </AccordionSummary>
          <AccordionDetails style={{ display: "block" }}>
            <div>
              <ButtonWithLoader
                fullWidth={true}
                variant="outlined"
                color="primary"
                loading={"" + this.state.loading}
                startIcon={<this.EdpLogo />}
                onClick={this.handleEdpClick}
                disabled={this.state.loading}
              >
                Skicka till EDP
                {this.state.loading && <CircularProgressButton size={24} />}
              </ButtonWithLoader>
              <Collapse in={this.state.dataWasSent}>
                <DivBottomContainer>
                  <strong>{this.props.results.length}</strong> objekt skickades.
                </DivBottomContainer>
              </Collapse>
            </div>
          </AccordionDetails>
        </Accordion>
      </>
    );
  }
}

export default withSnackbar(FirExportEdpView);
