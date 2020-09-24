import React from "react";
import { withStyles } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import Typography from "@material-ui/core/Typography";

import { Paper } from "@material-ui/core";
import { createPortal } from "react-dom";

import Dialog from "../Dialog.js";
import SearchSettings from "./SearchSettings";

const styles = theme => ({});

class SearchTools extends React.PureComponent {
  state = {
    anchorEl: undefined,
    settingsDialog: false
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

  renderSettingsDialog = () => {
    const { settingsDialog } = this.state;
    const {
      searchOptions,
      searchSources,
      updateSearchOptions,
      searchModel,
      setSearchSources
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
            buttonText: "OK"
          }}
          open={settingsDialog}
          onClose={() => {
            this.setState({
              settingsDialog: false
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
    return (
      <div>
        {this.renderSettingsDialog()}
        <IconButton
          aria-haspopup="true"
          aria-controls="lock-menu"
          size="small"
          onClick={e =>
            this.setState({
              anchorEl: e.currentTarget
            })
          }
        >
          <MoreVertIcon />
        </IconButton>
        <Paper>
          <Menu
            id="lock-menu"
            anchorEl={anchorEl}
            getContentAnchorEl={null}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "center" }}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={() =>
              this.setState({
                anchorEl: undefined
              })
            }
          >
            {this.props.searchTools.map((option, index) => (
              <MenuItem
                key={index}
                onClick={event =>
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
            ))}
          </Menu>
        </Paper>
      </div>
    );
  }
}

export default withStyles(styles)(SearchTools);
