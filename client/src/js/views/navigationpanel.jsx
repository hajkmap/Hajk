/** */
var panels = {
  'infopanel': require('views/infopanel'),
  'layerpanel': require('views/layerpanel'),
  'bookmarkpanel': require('views/bookmarkpanel'),
  'searchpanel': require('views/searchpanel'),
  'coordinatespanel': require('views/coordinatespanel'),
  'exportpanel': require('views/exportpanel'),
  'drawpanel': require('views/drawpanel'),
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
      activePanel: undefined
    };
  },
  /**
   *
   *
   */
  componentDidMount: function () {

    this.props.model.on("change:activePanel", (sender, panel) => {
       this.setState({ "activePanel" : panel });
    });

    console.log("MODEL", this.props.model);

    this.props.model.on("change:visible", (sender, visible) => {
      this.setState({ 'toggled': visible });
    });

  },
  /**
   *
   *
   */
  toggle: function () {

    if (this.state.activePanel) {
      this.props.model.set("visible", !this.props.model.get("visible"));
    }

  },
  /**
   *
   *
   */
  render: function () {
    var classes = this.state.toggled ? 'navigation-panel' : 'navigation-panel folded';
    var btn_classes =  this.state.toggled ? 'toggle-button fa fa-times' :
                                            'toggle-button fa fa-expand toggle-button-expand';

    var panelInstance = null;
    var Panel = null;

    if (this.state.activePanel) {
      Panel = panels[this.state.activePanel.type.toLowerCase()];
      panelInstance = <Panel model={this.state.activePanel.model} onCloseClicked={_.bind(this.toggle, this)} />
    }

    return (
      <div className={classes}>
        {panelInstance}
      </div>
    );

    // } else {
    //   return (
    //     <div className="collapsed-naviation-panel">
    //       <button
    //         role="button"
    //         className="btn btn-default"
    //         disabled={!this.state.activePanel}
    //         onClick={this.toggle}>
    //         <i className="fa fa-expand"></i>
    //       </button>
    //     </div>
    //   );
    // }
  }
});

module.exports = NavigationPanel;
