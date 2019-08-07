import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";
import Input from "@material-ui/core/Input";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import { Vector as VectorLayer } from "ol/layer";

const styles = theme => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120
  },
  subtitle2: {
    fontWeight: 500
  }
});

class VectorFilter extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      filterAttribute: props.layer.get("filterAttribute") || "",
      filterValue: props.layer.get("filterValue") || "",
      filterComparer: props.layer.get("filterComparer") || "",
      layerProperties: []
    };
    this.loadFeatureInfo();
  }

  loadFeatureInfo = () => {
    const { layer } = this.props;
    const url = layer.getProperties().url;
    const featureType = layer.getProperties().featureType;
    fetch(
      url +
        `?request=describeFeatureType&outputFormat=application/json&typename=${featureType}`
    ).then(response => {
      response.json().then(featureInfo => {
        var featureTypeInfo = featureInfo.featureTypes.find(
          type => type.typeName === featureType
        );
        if (featureTypeInfo && Array.isArray(featureTypeInfo.properties)) {
          var layerProperties = featureTypeInfo.properties
            .filter(property => property.type !== "gml:Geometry")
            .map(property => property.name);
          this.setState({
            layerProperties: layerProperties
          });
        }
      });
    });
  };

  handleChange = e => {
    this.setState({
      [e.target.name]: e.target.value
    });
  };

  setFilter = e => {
    const { filterAttribute, filterValue, filterComparer } = this.state;
    var vectorSource = this.props.layer.getSource();
    this.features = vectorSource.getFeatures();
    this.props.layer.set("filterAttribute", filterAttribute);
    this.props.layer.set("filterValue", filterValue);
    this.props.layer.set("filterComparer", filterComparer);
    vectorSource.clear();
  };

  resetFilter = e => {
    var vectorSource = this.props.layer.getSource();
    vectorSource.clear();
    this.props.layer.set("filterAttribute", undefined);
    this.props.layer.set("filterValue", undefined);
    this.props.layer.set("filterComparer", undefined);
    setTimeout(() => {
      this.setState({
        filterAttribute: "",
        filterValue: "",
        filterComparer: ""
      });
    }, 200);
  };

  render() {
    const { layer, classes } = this.props;
    if (layer instanceof VectorLayer) {
      return (
        <div>
          <Typography className={classes.subtitle2} variant="subtitle2">
            Filtrera innehåll baserat på attribut
          </Typography>
          <FormControl className={classes.formControl}>
            <InputLabel htmlFor="attribute">Attribut</InputLabel>
            <Select
              value={this.state.filterAttribute}
              onChange={this.handleChange}
              inputProps={{
                name: "filterAttribute",
                id: "attribute"
              }}
            >
              {this.state.layerProperties.map((property, i) => {
                return (
                  <MenuItem key={i} value={property}>
                    {property}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <FormControl className={classes.formControl}>
            <InputLabel htmlFor="comparer">Jämförare</InputLabel>
            <Select
              value={this.state.filterComparer}
              onChange={this.handleChange}
              inputProps={{
                name: "filterComparer",
                id: "comparer"
              }}
            >
              <MenuItem value="gt">Större än</MenuItem>
              <MenuItem value="lt">Mindre än</MenuItem>
              <MenuItem value="eq">Lika med</MenuItem>
              <MenuItem value="not">Skilt från</MenuItem>
            </Select>
          </FormControl>
          <FormControl className={classes.formControl}>
            <Input
              value={this.state.filterValue}
              onChange={this.handleChange}
              placeholder="Filtervärde"
              inputProps={{
                name: "filterValue",
                "aria-label": "Värde"
              }}
            />
          </FormControl>
          <div>
            <Button
              variant="contained"
              color="primary"
              onClick={this.setFilter}
            >
              Aktivera
            </Button>
            &nbsp;
            <Button onClick={this.resetFilter}>Återställ</Button>
          </div>
        </div>
      );
    } else {
      return null;
    }
  }
}

export default withStyles(styles)(VectorFilter);
