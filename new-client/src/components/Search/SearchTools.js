import React from "react";
import { createPortal } from "react-dom";
import IconButton from "@material-ui/core/IconButton";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import { withStyles } from "@material-ui/core/styles";
import {
  ListItemIcon,
  Menu,
  MenuItem,
  Paper,
  Tooltip,
  Typography,
} from "@material-ui/core";

import Dialog from "../Dialog.js";
import SearchSettings from "./SearchSettings";

const styles = (theme) => ({});

class SearchTools extends React.PureComponent {
  state = {
    anchorEl: undefined,
    settingsDialog: false,
  };

  constructor(props) {
    super(props);
    this.map = props.map;
  }

  handleMenuItemClick = (event, index, option) => {
    const type = option.type;
    if (type === "SETTINGS") {
      this.setState({ settingsDialog: true });
    } else {
      this.props.app.globalObserver.publish(option["onClickEventName"], option);
    }
    this.setState({ anchorEl: undefined });
  };

  getEnabledTools = () => {
    const { searchTools } = this.props;
    return searchTools.filter((tool) => tool.enabled ?? true);
  };

  renderSettingsDialog = () => {
    const { settingsDialog } = this.state;
    const {
      searchOptions,
      searchSources,
      updateSearchOptions,
      searchModel,
      setSearchSources,
    } = this.props;
    if (settingsDialog) {
      return createPortal(
        <Dialog
          options={{
            text: (
              <SearchSettings
                searchOptions={searchOptions}
                searchSources={searchSources}
                updateSearchOptions={updateSearchOptions}
                setSearchSources={setSearchSources}
                searchModel={searchModel}
              />
            ),
            headerText: "Sökinställningar",
            buttonText: "OK",
          }}
          open={settingsDialog}
          onClose={() => {
            this.setState({
              settingsDialog: false,
            });
          }}
        ></Dialog>,
        document.getElementById("windows-container")
      );
    } else {
      return null;
    }
  };

  render() {
    const { anchorEl } = this.state;
    const enabledTools = this.getEnabledTools();
    return (
      <>
        {this.renderSettingsDialog()}
        <Tooltip title="Fler sökverktyg och inställningar">
          <IconButton
            aria-haspopup="true"
            aria-controls="lock-menu"
            name="searchOptions"
            size="small"
            onClick={(e) =>
              this.setState({
                anchorEl: e.currentTarget,
              })
            }
          >
            <Typography variant="srOnly">
              Öppna dialog med fler inställningar
            </Typography>
            <MoreVertIcon />
          </IconButton>
        </Tooltip>
        <Paper>
          <Menu
            id="lock-menu"
            autoFocus={false}
            anchorEl={anchorEl}
            getContentAnchorEl={null}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "center" }}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={() =>
              this.setState({
                anchorEl: undefined,
              })
            }
          >
            {enabledTools.map((option, index) => (
              <Tooltip key={index} title={option.toolTipTitle ?? ""}>
                <MenuItem
                  onClick={(event) =>
                    this.handleMenuItemClick(event, index, option)
                  }
                >
                  {option.icon ? (
                    <ListItemIcon>{option.icon}</ListItemIcon>
                  ) : null}
                  <Typography variant="srOnly" noWrap>
                    {option.name}
                  </Typography>
                  <Typography variant="inherit" noWrap>
                    {option.name}
                  </Typography>
                </MenuItem>
              </Tooltip>
            ))}
          </Menu>
        </Paper>
      </>
    );
  }
}

export default withStyles(styles)(SearchTools);
