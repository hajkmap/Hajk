import React from "react";
import { createPortal } from "react-dom";
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  ListItemIcon,
  Menu,
  MenuItem,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import { visuallyHidden } from "@mui/utils";

import Dialog from "../Dialog/Dialog";
import SearchSettings from "./SearchSettings";

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
      enabledSearchOptions,
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
                enabledSearchOptions={enabledSearchOptions}
              />
            ),
            headerText: "Sökinställningar",
            buttonText: "OK",
            useLegacyNonMarkdownRenderer: true,
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
        <Tooltip disableInteractive title="Fler sökverktyg och inställningar">
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
            <span style={visuallyHidden}>
              Öppna dialog med fler inställningar
            </span>
            <MoreVertIcon />
          </IconButton>
        </Tooltip>
        <Paper>
          <Menu
            id="lock-menu"
            autoFocus={false}
            anchorEl={anchorEl}
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
              <Tooltip
                disableInteractive
                key={index}
                title={option.toolTipTitle ?? ""}
              >
                <MenuItem
                  onClick={(event) =>
                    this.handleMenuItemClick(event, index, option)
                  }
                >
                  {option.icon ? (
                    <ListItemIcon>{option.icon}</ListItemIcon>
                  ) : null}
                  <span style={visuallyHidden}>{option.name}</span>
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

export default SearchTools;
