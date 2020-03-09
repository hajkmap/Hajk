import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import LayerGroup from "./LayerGroup.js";
import { TextField } from "@material-ui/core";

const styles = theme => ({});

class LayerGroups extends React.PureComponent {
  static defaultProps = {};

  static propTypes = {
    app: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    display: PropTypes.bool.isRequired,
    groups: PropTypes.array.isRequired,
    model: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      chapters: [],
      groups: props.groups,
      layersFilterValue: ""
    };

    props.app.globalObserver.subscribe("informativeLoaded", chapters => {
      if (Array.isArray(chapters)) {
        this.setState({
          chapters: chapters
        });
      }
    });
  }

  componentDidMount() {
    this.props.groups.map(console.log);
  }

  copy(o) {
    return Object.assign({}, o);
  }

  layerNameMatch = m => {
    const layer = this.props.app.layers.find(l => l.id === m.id);
    const v = this.state.layersFilterValue;

    if (layer !== undefined && layer.hasOwnProperty("caption")) {
      // If 'caption' contains our search string, keep this layer in results
      if (layer.caption.toLowerCase().includes(v)) return true;
    }
  };

  filterLayers = o => {
    // GOOD STARTING POINT: https://stackoverflow.com/questions/38132146/recursively-filter-array-of-objects
    const v = this.state.layersFilterValue;
    // Top level groups already have a name, so let's check directly
    if (o.name && o.name.toLowerCase().includes(v)) return true;
    // If name doesn't exist it could mean that we entered the recursive
    // phase of filter. If so, see if we have an ID.
    else if (o.id) {
      // If ID exists, try to extract one layer using the current layer ID.
      const layer = this.props.app.layers.find(l => l.id === o.id);
      // If layer was found, see if it has a 'caption' property.
      if (layer !== undefined && layer.hasOwnProperty("caption")) {
        // If 'caption' contains our search string, keep this layer in results
        if (layer.caption.toLowerCase().includes(v)) return true;
      }
    }

    // Call our filter function recursively if 'layers' property exists.
    if (o.layers) {
      o.layers = o.layers.map(this.copy).filter(this.layerNameMatch);
    }

    // TODO: Also handle o.layers
    if (o.groups) {
      return (o.groups = o.groups.map(this.copy).filter(this.filterLayers))
        .length;
    }
  };

  handleFilterLayers = e => {
    const v = e.target.value;
    this.setState({ layersFilterValue: v }, () => {
      // Special case if empty string
      if (v.length === 0) {
        this.setState({ groups: this.props.groups });
      } else {
        const r = this.props.groups.map(this.copy).filter(this.filterLayers);
        console.log("*** Filtered groups ***", r);
        this.setState({ groups: r });
      }
    });
  };

  render() {
    return (
      <div
        style={{
          display: this.props.display ? "block" : "none"
        }}
      >
        <TextField
          id="layers-filter"
          label="Filtera lager"
          onChange={this.handleFilterLayers}
          value={this.state.layersFilterValue}
          variant="filled"
          fullWidth
        />
        {this.state.groups.map((group, i) => {
          console.log("Rendering group: ", group);
          return (
            <LayerGroup
              app={this.props.app}
              chapters={this.state.chapters}
              group={group}
              key={i}
              model={this.props.model}
            />
          );
        })}
      </div>
    );
  }
}

export default withStyles(styles)(LayerGroups);
