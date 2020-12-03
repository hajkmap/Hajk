import React, { Component } from "react";
import propTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import CloseIcon from "@material-ui/icons/Close";
import FullscreenIcon from "@material-ui/icons/Fullscreen";
import FullscreenExitIcon from "@material-ui/icons/FullscreenExit";
import AspectRatioIcon from "@material-ui/icons/AspectRatio";
import { Hidden, Typography } from "@material-ui/core";

import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";

const styles = (theme) => {
  return {
    header: {
      padding: `${theme.spacing(1)}px ${theme.spacing(2)}px`,
      borderBottom: `4px solid ${theme.palette.primary.main}`,
      userSelect: "none",
      display: "flex",
      justifyContent: "space-between",
      minHeight: 46,
    },
    icons: {
      display: "flex",
      alignItems: "center",
      "&>*": {
        marginLeft: theme.spacing(1),
      },
    },
    icon: {
      cursor: "pointer",
      "&:hover": {
        background: theme.palette.action.hover,
      },
    },
    formControl: {
      marginLeft: "0px",
      minWidth: 200,
    },
    selectInput: {
      padding: 5,
    },
  };
};

const searchTypes = {
  DEFAULT: "Välj sökmetod",
  JOURNEYS: "Sök Turer",
  LINES: "Sök Linjer",
  STOPS: "Sök Hållplatser",
};

class PanelHeader extends Component {
  static propTypes = {
    allowMaximizedWindow: propTypes.bool.isRequired,
    classes: propTypes.object.isRequired,
    color: propTypes.string,
    mode: propTypes.oneOf(["window", "maximized", "minimized"]),
    onClose: propTypes.func.isRequired,
    onMaximize: propTypes.func.isRequired,
    onMinimize: propTypes.func.isRequired,
    title: propTypes.string.isRequired,
  };

  constructor(props) {
    super(props);

    this.localObserver = this.props.localObserver;
  }

  renderCustomHeaderButtons = () => {
    const { customHeaderButtons, classes } = this.props;
    return customHeaderButtons.map((buttonInfo, index) => {
      const HeaderActionIcon = buttonInfo.icon.type;
      return (
        <HeaderActionIcon
          onClick={buttonInfo.onClickCallback}
          className={classes.icon}
          key={index}
        />
      );
    });
  };

  shouldRenderCustomHeaderButtons = () => {
    const { customHeaderButtons } = this.props;
    return customHeaderButtons && customHeaderButtons.length > 0;
  };

  handleChange = (e) => {
    var typeOfSearch = searchTypes[e.target.value];
    this.localObserver.publish("vtsearch-chosen", typeOfSearch);
  };

  renderHeader = () => {
    const { vtsearch } = this.props;

    if (vtsearch) return this.renderDropDownMenuHeader();

    return this.renderTextHeader();
  };

  renderTextHeader = () => {
    const { classes } = this.props;

    return (
      <Typography variant="button" align="left" noWrap={true}>
        {this.props.title}
      </Typography>
    );
  };

  renderDropDownMenuHeader = () => {
    const { classes } = this.props;

    return (
      <FormControl variant="outlined" className={classes.formControl}>
        <Select
          classes={{ root: classes.selectInput }}
          native
          onChange={this.handleChange}
          inputProps={{
            name: "searchType",
            id: "search-type",
          }}
        >
          {Object.keys(searchTypes).map((key) => {
            return (
              <option key={key} value={key}>
                {searchTypes[key]}
              </option>
            );
          })}
        </Select>
      </FormControl>
    );
  };

  render() {
    const { allowMaximizedWindow, classes, mode } = this.props;
    return (
      <header
        className={classes.header}
        style={{ borderColor: this.props.color }} // Allow for dynamic override of accent border color
      >
        {this.renderHeader()}
        <nav className={classes.icons}>
          {this.shouldRenderCustomHeaderButtons() &&
            this.renderCustomHeaderButtons()}
          {mode !== "maximized" && // If window isn't in fit screen mode currently…
            (mode === "minimized" ? ( // … but it's minimized…
              <FullscreenIcon // …render the maximize icon.
                onClick={this.props.onMaximize}
                className={classes.icon}
              />
            ) : (
              // If it's already in "window" mode though, render the minimize icon.
              <FullscreenExitIcon
                onClick={this.props.onMinimize}
                className={classes.icon}
              />
            ))}
          <Hidden xsDown>
            {allowMaximizedWindow && ( // If we're not on mobile and config allows fit-to-screen…
              <AspectRatioIcon // … render the action button. Note: it will remain the same…
                onClick={this.props.onMaximize} // for both "maximized" and "window" modes.
                className={classes.icon}
              />
            )}
          </Hidden>
          <CloseIcon onClick={this.props.onClose} className={classes.icon} />
        </nav>
      </header>
    );
  }
}

export default withStyles(styles)(PanelHeader);
