import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import FormControl from "@material-ui/core/FormControl";
import NativeSelect from "@material-ui/core/NativeSelect";

// Define JSS styles that will be used in this component.
// Examle below utilizes the very powerful "theme" object
// that gives access to some constants, see: https://material-ui.com/customization/default-theme/
const styles = theme => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120
  },
  selectEmpty: {
    marginTop: theme.spacing(2)
  }
});

//TODO - Only mockup //Tobias
const searchTypes = {
  JOURNEYS: "Journeys",
  LINES: "Lines"
};

class SearchSelectorView extends React.PureComponent {
  // Initialize state - this is the correct way of doing it nowadays.
  state = {
    activeSearchType: "JOURNEYS"
  };

  // propTypes and defaultProps are static properties, declared
  // as high as possible within the component code. They should
  // be immediately visible to other devs reading the file,
  // since they serve as documentation.
  static propTypes = {
    model: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired
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

  handleChange = e => {
    this.setState({
      activeSearchType: e.value
    });
  };

  render() {
    const { classes } = this.props;
    return (
      <FormControl variant="outlined" className={classes.formControl}>
        <NativeSelect
          value={this.state.activeSearchType}
          onChange={this.handleChange}
          inputProps={{
            name: "searchType",
            id: "search-type"
          }}
        >
          {Object.keys(searchTypes).map(key => {
            return (
              <option key={key} value={key}>
                {searchTypes[key]}
              </option>
            );
          })}
        </NativeSelect>
      </FormControl>
      //Depending on state.activeSearch we can render different search modules // Tobias
    );
  }
}

// Exporting like this adds some props to DummyView.
// withStyles will add a 'classes' prop, while withSnackbar
// adds to functions (enqueueSnackbar() and closeSnackbar())
// that can be used throughout the Component.
export default withStyles(styles)(SearchSelectorView);
