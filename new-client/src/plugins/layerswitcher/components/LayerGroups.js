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
  treeData = null;

  constructor(props) {
    super(props);

    // Clean up the groups prop so we obtain a nice tree that can be used in our TreeView
    this.treeData = this.fixIncomingData(props.groups);

    this.state = {
      chapters: [],
      groups: props.groups,
      layersFilterValue: "",
      filteredTreeData: this.treeData
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

  copy(o) {
    return Object.assign({}, o);
  }

  filterLayers = o => {
    // GOOD STARTING POINT: https://stackoverflow.com/questions/38132146/recursively-filter-array-of-objects
    const { layersFilterValue } = this.state;
    // Check top level, if match, return, including all children
    if (
      o.title &&
      o.title.toLowerCase().includes(layersFilterValue.toLowerCase())
    )
      return true;

    // Else, let's run this recursively on children
    if (o.children) {
      return (o.children = o.children.map(this.copy).filter(this.filterLayers))
        .length;
    }
  };

  handleChangeInLayersFilter = e => {
    const layersFilterValue = e.target.value;
    this.setState({ layersFilterValue }, () => {
      if (layersFilterValue.length === 0) {
        // Special case if empty string, reset to full tree data obtained in constructor()
        this.setState({ filteredTreeData: this.treeData });
      } else {
        const filteredTreeData = this.treeData
          .map(this.copy)
          .filter(this.filterLayers);
        this.setState({ filteredTreeData });
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
    const { layersFilterValue, filteredTreeData } = this.state;

    return (
      <div
        style={{
          display: this.props.display ? "block" : "none"
        }}
      >
        <TextField
          id="layers-filter"
          label="Filtera lager"
          onChange={this.handleChangeInLayersFilter}
          value={layersFilterValue}
          variant="outlined"
          fullWidth
        />
        <TreeView
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpanded={this.defaultExpanded}
          defaultExpandIcon={<ChevronRightIcon />}
          defaultSelected={this.defaultSelected}
          multiSelect={true}
          onNodeSelect={this.onNodeSelect}
          onNodeToggle={this.onNodeToggle}
        >
          {filteredTreeData.map(this.renderTree)}
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
