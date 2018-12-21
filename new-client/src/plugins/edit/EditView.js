import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Toolbar from "./components/Toolbar";
import AttributeEditor from "./components/AttributeEditor";

const styles = theme => ({});

class EditView extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      enabled: false,
      checked: false,
      sources: []
    };
  }

  componentDidMount() {
    this.props.observer.on("editFeature", attr => {
      this.setState({
        editFeature: this.props.model.editFeature,
        editSource: this.props.model.editSource
      });
    });

    this.props.observer.on("removeFeature", attr => {
      if (this.props.model.removeFeature) {
        //TODO: confirm
        if (true) {
          var feature = this.props.model.removeFeature;
          this.props.model.select.getFeatures().remove(feature);
          feature.modification = "removed";
          feature.setStyle(this.props.model.getHiddenStyle());
        } else {
          this.props.model.removeFeature = undefined;
        }

        // this.setState({
        //   alert: true,
        //   alertMessage: ` Vill du ta bort markerat obekt?

        //     Tryck därefter på sparaknappen för definitiv verkan.
        //   `,
        //   confirm: true,
        //   confirmAction: () => {
        //     var feature = this.props.model.get("removeFeature");
        //     this.props.model
        //       .get("select")
        //       .getFeatures()
        //       .remove(feature);
        //     feature.modification = "removed";
        //     feature.setStyle(this.props.model.getHiddenStyle());
        //   },
        //   denyAction: () => {
        //     this.setState({ alert: false });
        //     this.props.model.set("removeFeature", undefined);
        //   }
        // });
      }
    });

    this.props.model.loadSources(sources => {
      this.setState({
        sources: sources
      });
    });
  }

  setLayer(source) {
    var clear = () => {
      var time = new Date().getTime() - timer;
      if (time < 1000) {
        setTimeout(() => {
          this.setState({ loading: false });
        }, 1000 - time);
      } else {
        this.setState({ loading: false });
      }
    };

    var changeActiveLayer = () => {
      this.setState({
        checked: source.caption,
        loading: true,
        enabled: true
      });
      this.props.model.setLayer(source, clear);
    };

    var timer = new Date().getTime();

    // TODO: user confirm
    changeActiveLayer();
  }

  getText() {
    return "Editera";
  }

  renderOptions() {
    return this.state.sources.map((source, i) => {
      var id = "edit-layer-" + i;
      return (
        <div key={i}>
          <input
            id={id}
            type="radio"
            name="source"
            checked={this.state.checked === source.caption}
            onChange={e => {
              this.setLayer(source);
            }}
          />
          <label htmlFor={id}>{source.caption}</label>
        </div>
      );
    });
  }

  render() {
    return (
      <>
        <div>
          <Toolbar
            ref="toolbar"
            enabled={this.state.enabled}
            model={this.props.model}
            observer={this.props.observer}
          />
          <ul>{this.renderOptions()}</ul>
          <AttributeEditor
            ref="attributeEditor"
            feature={this.state.editFeature}
            source={this.state.editSource}
            model={this.props.model}
            activeTool={this.state.activeTool}
            observer={this.props.observer}
            panel={this}
          />
        </div>
      </>
    );
  }
}

export default withStyles(styles)(EditView);
