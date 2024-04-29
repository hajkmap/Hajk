import React from "react";
import { IconButton, Menu, MenuItem, Grid } from "@mui/material";
import GetAppIcon from "@mui/icons-material/GetApp";
import DescriptionIcon from "@mui/icons-material/Description";
import PublicIcon from "@mui/icons-material/Public";
import { styled } from "@mui/material/styles";
import HajkToolTip from "components/HajkToolTip";

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
        name: "Ladda ner till Excel",
        icon: <DescriptionIcon />,
        type: "Excel",
        enabled: true,
        onClick: this.handleXLSXDownloadClick,
      },
      {
        name: "Ladda ner till KML",
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
    return (
      <HajkToolTip title="Ladda ner objekten">
        <MenuTogglerButton
          onClick={(e) =>
            this.setState({
              anchorEl: e.currentTarget,
            })
          }
        >
          <GetAppIcon />
        </MenuTogglerButton>
      </HajkToolTip>
    );
  };

  renderDownloadMenu = () => {
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
                <Grid item>{downloadOption.name}</Grid>
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
        <HajkToolTip title="Ladda ner objekten">
          <MenuTogglerButton
            onClick={(e) =>
              this.setState({
                anchorEl: e.currentTarget,
              })
            }
          >
            <GetAppIcon />
          </MenuTogglerButton>
        </HajkToolTip>
        {this.renderDownloadMenu()}
      </>
    );
  }
}

export default SearchResultsDownloadMenu;
