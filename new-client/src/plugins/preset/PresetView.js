import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import { MenuItem } from "@material-ui/core";

// Define JSS styles that will be used in this component.
// Examle below utilizes the very powerful "theme" object
// that gives access to some constants, see: https://material-ui.com/customization/default-theme/
const styles = theme => ({
  buttonWithBottomMargin: {
    marginBottom: theme.spacing(2)
  }
});

class PresetView extends React.PureComponent {
  // Initialize state - this is the correct way of doing it nowadays.
  state = {
    counter: 0
  };

  // propTypes and defaultProps are static properties, declared
  // as high as possible within the component code. They should
  // be immediately visible to other devs reading the file,
  // since they serve as documentation.
  static propTypes = {
    model: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    enqueueSnackbar: PropTypes.func.isRequired
  };

  static defaultProps = {};

  constructor(props) {
    // If you're not using some of properties defined below, remove them from your code.
    // They are shown here for demonstration purposes only.
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;
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

// Exporting like this adds some props to PresetView.
// withStyles will add a 'classes' prop, while withSnackbar
// adds a function (enqueueSnackbar()
// that can be used throughout the Component.
export default withStyles(styles)(withSnackbar(PresetView));
