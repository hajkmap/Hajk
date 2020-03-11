import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
// import LayerGroup from "./LayerGroup.js";
import { TextField } from "@material-ui/core";
import { TreeView, TreeItem } from "@material-ui/lab";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";

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

  defaultExpanded = [];
  defaultSelected = [];

  constructor(props) {
    super(props);
    console.log("props: ", props);
    console.log("crap: ", props.groups);
    const fixed = this.fixIncomingData(props.groups);
    console.log("fixed: ", fixed);

    this.state = {
      chapters: [],
      groups: props.groups,
      layersFilterValue: "",
      fixed
    };

    props.app.globalObserver.subscribe("informativeLoaded", chapters => {
      if (Array.isArray(chapters)) {
        this.setState({
          chapters: chapters
        });
      }
    });
  }

  fixIncomingData = groups => {
    const iterateLayers = layers => {
      return layers.map(l => {
        l.visibleAtStart === true && this.defaultSelected.push(l.id);

        return {
          id: l.id,
          title: this.props.model.layerMap[l.id].get("caption")
        };
      });
    };

    const iterateGroups = groups => {
      return groups.map(g => {
        g.expanded === true && this.defaultExpanded.push(g.id);
        return {
          id: g.id,
          title: g.name,
          children: [...iterateGroups(g.groups), ...iterateLayers(g.layers)]
        };
      });
    };

    return iterateGroups(groups);
  };

  componentDidMount() {}

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
    console.log("Searching for: ", v);
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

  renderTree = nodes => {
    return (
      <TreeItem key={nodes.id} nodeId={nodes.id} label={nodes.title}>
        {Array.isArray(nodes.children)
          ? nodes.children.map(node => this.renderTree(node))
          : null}
      </TreeItem>
    );
  };

  onNodeSelect = (event, nodeIds) => {
    console.log("select: ", event, nodeIds);
  };

  onNodeToggle = (event, nodeIds) => {
    console.log("toggle: ", event, nodeIds);
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
          variant="outlined"
          fullWidth
        />
        <TreeView
          // className={classes.root}
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpanded={this.defaultExpanded}
          defaultExpandIcon={<ChevronRightIcon />}
          defaultSelected={this.defaultSelected}
          multiSelect={true}
          onNodeSelect={this.onNodeSelect}
          onNodeToggle={this.onNodeToggle}
        >
          {this.state.fixed.map(this.renderTree)}
        </TreeView>

        {/* {this.state.groups.map((group, i) => {
          return (
            <LayerGroup
              app={this.props.app}
              chapters={this.state.chapters}
              group={group}
              key={i}
              model={this.props.model}
            />
          );
        })} */}
      </div>
    );
  }
}

export default withStyles(styles)(LayerGroups);
