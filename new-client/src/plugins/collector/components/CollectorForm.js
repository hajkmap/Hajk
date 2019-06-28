import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import Page from "./Page.js";

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

    props.model.observer.on("abort", () => {
      this.abort();
    });

    this.state = {
      ...this.state,
      form: props.form
    };
  }

  saveError = text => {
    this.setState({
      saveError: text || saveErrorText
    });
  };

  save = generic => () => {
    this.props.model.save(
      {
        comment: this.state.comment,
        displayPlace: this.state.displayPlace,
        generic: generic
      },
      transactionResult => {
        if (
          transactionResult &&
          transactionResult.transactionSummary &&
          transactionResult.transactionSummary.totalInserted
        ) {
          if (transactionResult.transactionSummary.totalInserted > 0) {
            this.setState({
              comment: "",
              saveError: "",
              validationError: "",
              mode: "success"
            });
          } else {
            this.saveError();
          }
        } else {
          this.saveError();
        }
      },
      error => {
        this.saveError(error);
      }
    );
  };

  renderSaveError() {
    const { classes } = this.props;
    return this.state.saveError ? (
      <div className={classes.saveError}>{this.state.saveError}</div>
    ) : null;
  }

  abort = () => {
    this.reset();
    this.props.onClose();
  };

  render() {
    const { activePage, direction } = this.state;
    const { form, serviceConfig } = this.props;
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

export default withStyles(styles)(CollectorForm);
