import React from "react";
import { withStyles, withTheme } from "@material-ui/core/styles";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";

const styles = theme => ({
  root: {}
});

class NestedListItem extends React.PureComponent {
  static defaultProps = { hasSubMenu: false, showSubMenu: false };
  render() {
    console.log(this.props.hasSubMenu, "hasSubMenu");
    console.log(this.props.showSubMenu, "this.props.showSubMenu");
    return (
      <ListItem
        divider
        button
        size="small"
        onClick={this.props.onClick}
        style={{
          paddingLeft: this.props.theme.spacing(this.props.level),
          borderLeft: `8px solid ${this.props.borderColor}`
        }}
      >
        {this.props.icon ? (
          <ListItemIcon>{this.props.icon}</ListItemIcon>
        ) : null}
        {this.props.title && <ListItemText>{this.props.title}</ListItemText>}
        {this.props.hasSubMenu &&
          (this.props.showSubMenu ? <ExpandLess /> : <ExpandMore />)}
      </ListItem>
    );
  }
}

export default withStyles(styles)(withTheme(NestedListItem));
