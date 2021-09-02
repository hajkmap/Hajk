import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withTranslation } from "react-i18next";
import { Button, Tooltip, Menu, MenuItem, Grid } from "@material-ui/core";
import GetAppIcon from "@material-ui/icons/GetApp";
import DescriptionIcon from "@material-ui/icons/Description";
import PublicIcon from "@material-ui/icons/Public";

const styles = (theme) => ({
  menuTogglerButton: {
    minWidth: 30,
  },
  menuItemIcon: {
    paddingRight: theme.spacing(1),
  },
});

class SearchResultsDownloadMenu extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      anchorEl: null,
    };

    this.downloadOptions = [
      {
        name: "core.search.searchResults.tools.download.options.xlsx",
        icon: <DescriptionIcon />,
        type: "Excel",
        enabled: true,
        onClick: this.handleXLSXDownloadClick,
      },
      {
        name: "core.search.searchResults.tools.download.options.kml",
        icon: <PublicIcon />,
        type: "kml",
        enabled: true,
        onClick: this.handleKMLDownloadClick,
      },
    ];
  }

  handleXLSXDownloadClick = () => {
    const { localObserver, featureCollections, featureId } = this.props;
    localObserver.publish("downloadMenu.exportXLSXClick", {
      featureCollections: featureCollections,
      featureId: featureId,
    });
    this.setState({ anchorEl: null });
  };

  handleKMLDownloadClick = () => {
    const { localObserver, featureCollections, featureId } = this.props;
    localObserver.publish("downloadMenu.exportKMLClick", {
      featureCollections: featureCollections,
      featureId: featureId,
    });
    this.setState({ anchorEl: null });
  };

  renderMenuTogglerButton = () => {
    const { classes, t } = this.props;
    return (
      <Tooltip title={t("core.search.searchResults.tools.download.toolTip")}>
        <Button
          className={classes.menuTogglerButton}
          onClick={(e) =>
            this.setState({
              anchorEl: e.currentTarget,
            })
          }
        >
          <GetAppIcon />
        </Button>
      </Tooltip>
    );
  };

  renderDownloadMenu = () => {
    const { classes, t } = this.props;
    const { anchorEl } = this.state;
    const enabledDownloadOptions = this.downloadOptions.filter((option) => {
      return option.enabled;
    });
    return (
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => this.setState({ anchorEl: null })}
      >
        {enabledDownloadOptions.map((downloadOption, index) => {
          return (
            <MenuItem key={index} onClick={downloadOption.onClick}>
              <Grid container>
                <Grid item className={classes.menuItemIcon}>
                  {downloadOption.icon}
                </Grid>
                <Grid item>{t(downloadOption.name)}</Grid>
              </Grid>
            </MenuItem>
          );
        })}
      </Menu>
    );
  };

  render() {
    const { classes } = this.props;
    return (
      <>
        <Tooltip title="Ladda ner objekten">
          <Button
            className={classes.menuTogglerButton}
            onClick={(e) =>
              this.setState({
                anchorEl: e.currentTarget,
              })
            }
          >
            <GetAppIcon />
          </Button>
        </Tooltip>
        {this.renderDownloadMenu()}
      </>
    );
  }
}

export default withTranslation()(withStyles(styles)(SearchResultsDownloadMenu));
