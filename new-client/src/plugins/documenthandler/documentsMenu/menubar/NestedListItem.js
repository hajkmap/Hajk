import React from "react";
import { withStyles, withTheme } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";

class NestedListItem extends React.PureComponent {
  render() {
    return (
      <ListItem
        button
        size="small"
        onClick={this.props.onCLick}
        style={{ paddingLeft: this.props.theme.spacing(this.props.level) }}
      >
        {this.props.icon ? (
          <ListItemIcon>{this.props.icon}</ListItemIcon>
        ) : null}
        {this.props.title && <ListItemText>{this.props.title}</ListItemText>}
      </ListItem>
    );
  }
}

export default withTheme(NestedListItem);
