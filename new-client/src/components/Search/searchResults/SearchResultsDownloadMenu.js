import React from "react";
import { IconButton, Tooltip, Menu, MenuItem, Grid } from "@mui/material";
import GetAppIcon from "@mui/icons-material/GetApp";
import DescriptionIcon from "@mui/icons-material/Description";
import PublicIcon from "@mui/icons-material/Public";
import { styled } from "@mui/material/styles";
import { withTranslation } from "react-i18next";

const MenuTogglerButton = styled(IconButton)(() => ({
  minWidth: 30,
}));

const MenuItemIconWrapper = styled(Grid)(({ theme }) => ({
  paddingRight: theme.spacing(1),
}));

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
    const { localObserver, featureCollections } = this.props;
    localObserver.publish("downloadMenu.exportKMLClick", featureCollections);
    this.setState({ anchorEl: null });
  };

  renderMenuTogglerButton = () => {
    const { t } = this.props;
    return (
      <Tooltip
        disableInteractive
        title={t("core.search.searchResults.tools.download.toolTip")}
      >
        <MenuTogglerButton
          onClick={(e) =>
            this.setState({
              anchorEl: e.currentTarget,
            })
          }
        >
          <GetAppIcon />
        </MenuTogglerButton>
      </Tooltip>
    );
  };

  renderDownloadMenu = () => {
    const { t } = this.props;
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
                <MenuItemIconWrapper item>
                  {downloadOption.icon}
                </MenuItemIconWrapper>
                <Grid item>{t(downloadOption.name)}</Grid>
              </Grid>
            </MenuItem>
          );
        })}
      </Menu>
    );
  };

  render() {
    return (
      <>
        <Tooltip disableInteractive title="Ladda ner objekten">
          <MenuTogglerButton
            onClick={(e) =>
              this.setState({
                anchorEl: e.currentTarget,
              })
            }
          >
            <GetAppIcon />
          </MenuTogglerButton>
        </Tooltip>
        {this.renderDownloadMenu()}
      </>
    );
  }
}

export default withTranslation()(SearchResultsDownloadMenu);
