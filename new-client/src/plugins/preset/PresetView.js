import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import { MenuItem } from "@material-ui/core";

const styles = theme => ({});

class PresetView extends React.PureComponent {
  state = {};

  static propTypes = {
    model: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    enqueueSnackbar: PropTypes.func.isRequired
  };

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
  }

  renderMenuItems = () => {
    let menuItems = [];
    this.model.app.plugins.preset.options.presetList.forEach((item, index) => {
      menuItems.push(
        <MenuItem
          key={index}
          onClick={event => this.handleOnClick(event, item)}
        >
          {item.name}
        </MenuItem>
      );
    });
    return menuItems;
  };

  handleOnClick = (event, item) => {
    let url = item.presetUrl.toLowerCase();
    if (
      url.indexOf("&x=") > 0 &&
      url.indexOf("&y=") > 0 &&
      url.indexOf("&z=") > 0
    ) {
      let url = item.presetUrl.split("&");
      let x = url[1].substring(2);
      let y = url[2].substring(2);
      let z = url[3].substring(2);
      const view = this.model.map.getView();
      view.animate({
        center: [x, y],
        zoom: z
      });
    } else {
      this.props.enqueueSnackbar(
        "Länken till platsen är tyvärr felaktig. Kontakta administratören av karttjänsten för att åtgärda felet.",
        {
          variant: "warning"
        }
      );
      console.error(
        "Fel i verktyget Snabbval. Länken til : \n" +
          item.name +
          "\n" +
          item.presetUrl +
          "\när tyvärr felaktig. Någon av följande parametrar saknas: &x=, &y=, &z= eller innehåller fel."
      );
    }
  };

  render() {
    return <>{this.renderMenuItems()}</>;
  }
}

export default withStyles(styles)(withSnackbar(PresetView));
