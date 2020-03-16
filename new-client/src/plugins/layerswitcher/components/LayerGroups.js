import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
// import LayerGroup from "./LayerGroup.js";
import { TextField } from "@material-ui/core";
import { TreeView, TreeItem } from "@material-ui/lab";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
// import IndeterminateCheckBoxIcon from "@material-ui/icons/IndeterminateCheckBox";

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
      filteredTreeData: this.treeData,
      // expanded: [],
      selected: this.defaultSelected
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

  toggleArrayValue(arrayList, arrayValue) {
    return arrayList.includes(arrayValue)
      ? arrayList.filter(el => el !== arrayValue)
      : [...arrayList, arrayValue];
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
    const icon = this.isLayerVisible(nodes.id) ? (
      <CheckBoxIcon />
    ) : (
      <CheckBoxOutlineBlankIcon />
    );
    return (
      <TreeItem
        key={nodes.id}
        nodeId={nodes.id}
        label={nodes.title}
        endIcon={icon}
      >
        {Array.isArray(nodes.children)
          ? nodes.children.map(node => this.renderTree(node))
          : null}
      </TreeItem>
    );
  };

  isLayerVisible = nodeId => {
    return this.state.selected.includes(nodeId);
  };

  onNodeSelect = (event, nodeId) => {
    const layerId = Number(nodeId);
    // Handle click on Hajk groups - they will have an MD5 as ID, so we can filter them out that way.
    if (Number.isNaN(layerId)) return;

    // Else, we've got a real layer/layergroup with valid ID. Let's add/remove it from our selected state array.
    this.setState({
      selected: this.toggleArrayValue(this.state.selected, nodeId)
    });
    const mapLayer = this.props.model.layerMap[layerId];
    mapLayer.setVisible(!this.isLayerVisible(nodeId));
  };

  // Does nothing compared to default functionality, except that we have access to current array
  // onNodeToggle = (event, nodeIds) => {
  //
  //   this.setState({ expanded: nodeIds });
  // };

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
          // defaultSelected={this.defaultSelected} // We use the controlled "selected" prop
          // expanded={this.state.expanded} // We set defaultExpanded and then let the component handle expansion logic
          selected={this.state.selected}
          multiSelect={false} // We will take care of the select state ourselves, user will of course be allowed to have multiple selected layers at once
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
