import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Toolbar from "./components/Toolbar";
import AttributeEditor from "./components/AttributeEditor";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";
import Typography from "@material-ui/core/Typography";

const styles = theme => ({
  root: {
    display: "flex"
  },
  formControl: {
    margin: theme.spacing.unit * 3
  },
  group: {
    margin: `${theme.spacing.unit}px 0`
  }
});

class EditView extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      enabled: false,
      checked: false,
      sources: props.model.getSources(),
      selectedSource: undefined
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
  }

  setLayer(serviceId) {
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
        loading: true,
        enabled: true
      });
      this.props.model.setLayer(serviceId, clear);
    };

    var timer = new Date().getTime();

    // TODO: user confirm
    this.props.model.reset();
    changeActiveLayer();
  }

  getText() {
    return "Editera";
  }

  renderSources() {
    const { classes } = this.props;
    return (
      <FormControl component="fieldset" className={classes.formControl}>
        <Typography variant="subtitle1">Välj data för redigering</Typography>
        <RadioGroup
          aria-label="Services"
          name="services"
          className={classes.group}
          value={this.state.selectedSource}
          onChange={e => {
            this.setLayer(e.target.value);
            this.setState({
              selectedSource: e.target.value
            });
          }}
        >
          {this.state.sources.map((source, i) => {
            return (
              <FormControlLabel
                key={i}
                value={source.id}
                control={<Radio />}
                label={source.caption}
              />
            );
          })}
        </RadioGroup>
      </FormControl>
    );
  }

  render() {
    return (
      <>
        <div>
          {this.renderSources()}
          <Toolbar
            ref="toolbar"
            enabled={this.state.enabled}
            model={this.props.model}
            panel={this}
            observer={this.props.observer}
          />
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
