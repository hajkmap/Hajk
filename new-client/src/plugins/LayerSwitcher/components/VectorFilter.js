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

const styles = (theme) => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  subtitle2: {
    fontWeight: 500,
  },
});

class VectorFilter extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      filterAttribute: props.layer.get("filterAttribute") || "",
      filterValue: props.layer.get("filterValue") || "",
      filterComparer: props.layer.get("filterComparer") || "",
      layerProperties: [],
    };
    this.loadFeatureInfo();
  }

  /**
   * @summary Prepare entries for dropdown, will contain possible values for filterAttribute.
   *
   * @memberof VectorFilter
   */
  loadFeatureInfo = () => {
    const { url, featureType } = this.props.layer.getProperties();
    fetch(
      url +
        `?request=describeFeatureType&outputFormat=application/json&typename=${featureType}`
    ).then((response) => {
      response.json().then((featureInfo) => {
        const featureTypeInfo = featureInfo.featureTypes.find(
          (type) => type.typeName === featureType
        );
        if (featureTypeInfo && Array.isArray(featureTypeInfo.properties)) {
          const layerProperties = featureTypeInfo.properties
            .filter((property) => property.type !== "gml:Geometry")
            .map((property) => property.name);
          this.setState({
            layerProperties,
          });
        }
      });
    });
  };

  handleChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value,
    });
  };

  /**
   * @summary Reads filter options from state, applies them on layer and refreshes the source.
   *
   * @memberof VectorFilter
   */
  setFilter = (e) => {
    this.props.layer.set("filterAttribute", this.state.filterAttribute);
    this.props.layer.set("filterComparer", this.state.filterComparer);
    this.props.layer.set("filterValue", this.state.filterValue);

    this.props.layer.getSource().refresh();
  };

  /**
   * @ Resets the UI to no filter and reloads the source
   *
   * @memberof VectorFilter
   */
  resetFilter = (e) => {
    // Reset the UI
    this.setState({
      filterAttribute: "",
      filterValue: "",
      filterComparer: "",
    });

    // Reset filter options on layer
    this.props.layer.set("filterAttribute", "");
    this.props.layer.set("filterComparer", "");
    this.props.layer.set("filterValue", "");

    // Refresh source
    this.props.layer.getSource().refresh();
  };

  render() {
    const { layer, classes } = this.props;
    if (layer instanceof VectorLayer) {
      return (
        <>
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
                id: "attribute",
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
                id: "comparer",
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
                "aria-label": "Värde",
              }}
            />
          </FormControl>

          <Button variant="contained" color="primary" onClick={this.setFilter}>
            Aktivera
          </Button>
          <Button onClick={this.resetFilter}>Återställ</Button>
        </>
      );
    } else {
      return null;
    }
  }
}

export default withStyles(styles)(VectorFilter);
