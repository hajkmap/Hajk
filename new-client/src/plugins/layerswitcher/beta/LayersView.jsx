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

const styles = theme => ({
  iconContainer: {
    width: "auto"
  },
  group: {
    marginLeft: 32
  },
  treeItemRoot: {
    marginLeft: -18
  },
  treeViewRoot: {
    marginLeft: 20
  }
});

class LayersView extends React.PureComponent {
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

    console.log("pre: ", props.groups);
    this.treeData = this.fixIncomingData(props.groups);
    console.log("post: ", this.treeData);

    this.state = {
      chapters: [],
      groups: props.groups,
      layersFilterValue: "",
      filteredTreeData: this.treeData,
      // expanded: [],
      selected: this.defaultSelected
    };

    // Let all layers subscribe to visibility changed event.
    // We do it to ensure that our checkboxes are updated whether layer visiblity is changed
    // in some other way than by clicking on a layer in LayerSwitcher.
    for (let [layerId, layer] of Object.entries(props.model.layerMap)) {
      // When layer's visibility is changed, ensure that correct checkboxes are ticked.
      layer.on("change:visible", e => {
        this.toggleCheckboxForLayer(layerId);
      });
    }

    // If Informative is loaded, inject the "chapters" so we can take care of rendering "go-to chapter" buttons next to layer's name.
    props.app.globalObserver.subscribe("informativeLoaded", chapters => {
      if (Array.isArray(chapters)) {
        this.setState({
          chapters: chapters
        });
      }
    });
  }
  /**
   * @summary Re-format the incoming layers object to fit the TreeView/TreeItem model.
   *
   * @param {*} groups
   * @returns {Object[]} Groups of groups and layers
   */
  fixIncomingData = groups => {
    const iterateLayers = layers => {
      return layers.map(l => {
        // If config says layer should be visible at start, put it into our state
        l.visibleAtStart === true && this.defaultSelected.push(l.id);

        return {
          id: l.id,
          title: this.props.model.layerMap[l.id].get("caption")
        };
      });
    };

    const iterateGroups = groups => {
      return groups.map(g => {
        // If config says that current group should be expanded at start, put it into our state
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

  toggleCheckboxForLayer(layerId) {
    // this.state.selected is an array that holds ids of visible layers.
    // By updating the array, we ensure that React checks the correct checkboxes.
    this.setState(state => {
      const selected = this.toggleArrayValue(state.selected, layerId);
      return { selected };
    });
  }

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

  // handleClickOnCheckbox = (e, nodeId) => {
  //
  // };

  handleClickOnToggle = (e, nodeId) => {};

  renderTree = nodes => {
    const { classes } = this.props;
    const hasChildren = Array.isArray(nodes.children);

    const selectedIcon = this.isLayerVisible(nodes.id) ? (
      <CheckBoxIcon
        onClick={e => {
          this.onNodeSelect(e, nodes.id);
        }}
      />
    ) : (
      <CheckBoxOutlineBlankIcon
        onClick={e => {
          this.onNodeSelect(e, nodes.id);
        }}
      />
    );

    const collapseIcon = hasChildren ? (
      <>
        <ExpandMoreIcon
          onClick={e => {
            this.handleClickOnToggle(nodes.id);
          }}
        />
        {selectedIcon}
      </>
    ) : (
      selectedIcon
    );
    const expandIcon = hasChildren ? (
      <>
        <ChevronRightIcon
          onClick={e => {
            this.handleClickOnToggle(nodes.id);
          }}
        />
        {selectedIcon}
      </>
    ) : (
      selectedIcon
    );

    const label = (
      <div
        onClick={e => {
          this.onNodeSelect(e, nodes.id);
        }}
      >
        {nodes.title}
      </div>
    );

    return (
      <TreeItem
        key={nodes.id}
        nodeId={nodes.id}
        label={label}
        // endIcon={selectedIcon}
        collapseIcon={collapseIcon}
        expandIcon={expandIcon}
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();

          return false;
        }}
        classes={{
          iconContainer: classes.iconContainer,
          group: classes.group,
          // If item has children, it will have a collapse/expand button. In that case, we need
          // justify a bit to compensate for the margin, so that all checkboxes will line up nicely.
          root: hasChildren ? classes.treeItemRoot : false
        }}
      >
        <>
          {/* <Typography>Hej</Typography> */}
          {Array.isArray(nodes.children)
            ? nodes.children.map(node => this.renderTree(node))
            : null}
        </>
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
    const mapLayer = this.props.model.layerMap[layerId];
    mapLayer.setVisible(!this.isLayerVisible(nodeId));
  };

  render() {
    const { layersFilterValue, filteredTreeData } = this.state;
    const { classes } = this.props;

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
          // defaultCollapseIcon={<ExpandMoreIcon />}
          // defaultExpandIcon={<ChevronRightIcon />}
          // defaultSelected={this.defaultSelected} // We use the controlled "selected" prop
          // expanded={this.state.expanded} // We set defaultExpanded and then let the component handle expansion logic
          defaultExpanded={this.defaultExpanded}
          selected={this.state.selected}
          multiSelect={false} // We will take care of the select state ourselves, user will of course be allowed to have multiple selected layers at once
          // disableSelection={true}
          // onNodeSelect={this.onNodeSelect}
          onNodeToggle={e => {
            return false;
          }}
          className={classes.treeViewRoot}
        >
          {filteredTreeData.map(this.renderTree)}
        </TreeView>
      </div>
    );
  }
}

export default withStyles(styles)(LayersView);
