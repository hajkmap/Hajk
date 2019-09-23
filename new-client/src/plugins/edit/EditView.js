import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Toolbar from "./components/Toolbar";
import AttributeEditor from "./components/AttributeEditor";
import Radio from "@material-ui/core/Radio";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";
import Typography from "@material-ui/core/Typography";

const styles = theme => ({
  root: {
    display: "flex"
  },
  formControl: {
    margin: theme.spacing(3)
  },
  group: {
    margin: `${theme.spacing(1)}px 0`
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
    this.props.observer.subscribe("editFeature", attr => {
      this.setState({
        editFeature: this.props.model.editFeature,
        editSource: this.props.model.editSource
      });
    });

    this.props.observer.subscribe("removeFeature", feature => {
      //TODO: confirm
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
        {this.state.sources.map((source, i) => {
          return (
            <FormControlLabel
              value={source.id}
              key={i}
              control={
                <Radio
                  checked={source.id === this.state.selectedSource}
                  onChange={e => {
                    this.setLayer(e.target.value);
                    this.setState({
                      selectedSource: e.target.value
                    });
                  }}
                  value={source.id}
                  name="selected-source"
                  aria-label="A"
                />
              }
              label={source.caption}
            />
          );
        })}
      </FormControl>
    );
  }

  render() {
    return (
      <>
        <div>
          <Toolbar
            ref="toolbar"
            enabled={this.state.enabled}
            model={this.props.model}
            panel={this}
            observer={this.props.observer}
            app={this.props.app}
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
          {this.renderSources()}
        </div>
      </>
    );
  }
}

export default withStyles(styles)(EditView);
