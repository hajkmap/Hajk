import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import Page from "./Page.js";
import Typography from "@material-ui/core/Typography/Typography";

const styles = theme => {
  return {
    text: {
      width: "100%"
    },
    form: {},
    cross: {
      position: "fixed",
      left: "50%",
      top: "50%",
      color: theme.palette.primary.main,
      textShadow: "2px 2px rgba(0, 0, 0, 0.5)",
      userSelect: "none",
      pointerEvents: "none",
      "& i": {
        fontSize: "50px",
        marginLeft: "-27px",
        marginTop: "9px"
      }
    },
    crossButton: {
      marginTop: "10px",
      marginLeft: "-31px",
      pointerEvents: "all"
    },
    saveError: {
      color: "red",
      background: "rgb(255, 200, 200)",
      marginTop: "15px",
      borderRadius: "5px",
      padding: "5px"
    },
    padded: {
      padding: "20px 0"
    },
    button: {
      justifyContent: "left"
    },
    buttonIcon: {
      marginRight: "5px"
    },
    placeIconMap: {
      fontSize: "64px",
      position: "relative",
      right: "32px",
      bottom: "28px"
    },
    localFloristIcon: {
      color: "green",
      fontSize: "64px"
    },
    thank: {
      fontSize: "2.8rem",
      fontWeight: "500"
    },
    thankForm: {
      textAlign: "center"
    },
    anchorOriginBottomCenter: {
      bottom: "60px",
      [theme.breakpoints.up("xs")]: {
        left: "50%",
        right: "auto",
        transform: "translateX(-50%)",
        borderRadius: "4px",
        overflow: "hidden",
        minWidth: "391px"
      },
      [theme.breakpoints.down("xs")]: {
        width: "100%",
        minWidth: "inherit",
        borderRadius: "0"
      }
    },
    formControl: {
      minWidth: 120
    },
    page: {
      background: "blue",
      height: "100%"
    },
    errorText: {
      fontSize: "14pt",
      color: "red"
    }
  };
};

const saveErrorText = "Fel - din kommentar gick inte att spara.";
//const validationErrorText = " - detta fält krävs";
class CollectorForm extends Component {
  state = {
    comment: "",
    saveError: "",
    validationError: "",
    form: [],
    displayPlace: false,
    activePage: 0,
    direction: "right"
  };

  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      form: props.form
    };

    props.model.observer.subscribe("abort", () => {
      this.abort();
    });

    props.model.observer.subscribe("reset", () => {
      // Set the page indicator to -1. This will reset the form properly.
      // Then set the page indicator to 0 to display the first page.
      // Just setting the flag to 0 will not reset the form if there is only one page.
      this.setState(
        {
          activePage: -1
        },
        () => {
          this.setState({
            activePage: 0
          });
        }
      );
    });
  }

  componentDidMount() {
    if (!this.props.model.serviceConfig) {
      this.setState({
        configurationError: true
      });
    }
  }

  saveError = text => {
    this.setState({
      saveError: text || saveErrorText
    });
  };

  renderSaveError() {
    const { classes } = this.props;
    return this.state.saveError ? (
      <div className={classes.saveError}>{this.state.saveError}</div>
    ) : null;
  }

  abort = () => {
    this.props.onClose();
  };

  render() {
    const { activePage, direction } = this.state;
    const { form, serviceConfig, classes } = this.props;
    if (this.state.configurationError) {
      return (
        <Typography className={classes.errorText}>
          Nödvändig konfiguration saknas. Verktyget kan inte användas för
          tillfället.
        </Typography>
      );
    } else {
      return form
        .sort((p1, p2) =>
          p1.order === p2.order ? 0 : p1.order > p2.order ? 1 : -1
        )
        .map(
          (page, i) =>
            activePage === page.order && (
              <Page
                key={i}
                serviceConfig={serviceConfig}
                model={this.props.model}
                active={activePage === page.order}
                numPages={form.length}
                page={page}
                direction={direction}
                options={this.props.options}
                onNextPage={() => {
                  this.setState({
                    activePage: activePage + 1,
                    direction: "left"
                  });
                }}
                onPrevPage={() => {
                  this.setState({
                    activePage: activePage - 1,
                    direction: "right"
                  });
                }}
              ></Page>
            )
        );
    }
  }
}

export default withStyles(styles)(CollectorForm);
