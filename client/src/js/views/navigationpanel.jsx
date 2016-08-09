/** */
var panels = {
  'infopanel': require('views/infopanel'),
  'layerpanel': require('views/layerpanel'),
  'bookmarkpanel': require('views/bookmarkpanel'),
  'searchpanel': require('views/searchpanel'),
  'coordinatespanel': require('views/coordinatespanel'),
  'exportpanel': require('views/exportpanel'),
  'drawpanel': require('views/drawpanel'),
  'editpanel': require('views/editpanel'),
  'anchorpanel': require('views/anchorpanel')
};
/**
 *
 *
 */
var NavigationPanel = React.createClass({
  /**
   *
   *
   */
  getDefaultProps : function () {
    return {
      /** */
      items: []
    };
  },
  /**
   *
   *
   */
  getInitialState: function () {
    return {
      toggled: false,
      minimized: false,
      activePanel: undefined
    };
  },
  /**
   *
   *
   */
  componentDidMount: function () {

    this.props.model.on("change:activePanel", (sender, panel) => {
       this.setState({
        'activePanel' : panel,
        'minimized': false
      });
      //this.props.model.set("toggled", false);
    });

    this.props.model.on("change:visible", (sender, visible) => {
      this.setState({
        'toggled': visible
      });
    });

    this.props.model.on("change:toggled", (sender, visible) => {
      this.setState({ 'minimized': true}); //visible });
    });

  },
  /**
   *
   *
   */
  toggle: function () {

    if (this.state.activePanel) {
      //this.props.model.set("visible", !this.props.model.get("visible"));
      this.props.model.set("toggled", !this.props.model.get("toggled"));
    }

  },
  maximize: function () {
    if (this.state.minimized) {
      this.setState({
        minimized: false
      });
    }
  },
  /**
   *
   *
   */
  render: function () {

    var classes = this.state.toggled ? 'navigation-panel' : 'navigation-panel folded';

    if (this.state.minimized) {
      classes += " minimized btn btn-default fa fa-expand";
    }

    var panelInstance = null;
    var Panel = null;

    if (this.state.activePanel) {
      Panel = panels[this.state.activePanel.type.toLowerCase()];
      panelInstance = (
        <Panel
          model={this.state.activePanel.model}
          onCloseClicked={_.bind(this.toggle, this)}
          minimized={this.state.minimized}
        />
      )
    }

    return (
      <div className={classes} onClick={this.maximize}>
        {panelInstance}
      </div>
    );
  }
});

module.exports = NavigationPanel;
