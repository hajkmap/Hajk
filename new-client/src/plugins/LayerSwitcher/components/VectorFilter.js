import React from "react";
import { styled } from "@mui/material/styles";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import Input from "@mui/material/Input";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Vector as VectorLayer } from "ol/layer";
import { hfetch } from "utils/FetchWrapper";

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  margin: theme.spacing(1),
  minWidth: 120,
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
}));

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
    hfetch(
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
    const { layer } = this.props;
    if (layer instanceof VectorLayer) {
      return (
        <>
          <StyledTypography variant="subtitle2">
            Filtrera innehåll baserat på attribut
          </StyledTypography>
          <StyledFormControl>
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
          </StyledFormControl>
          <StyledFormControl>
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
          </StyledFormControl>
          <StyledFormControl>
            <Input
              value={this.state.filterValue}
              onChange={this.handleChange}
              placeholder="Filtervärde"
              inputProps={{
                name: "filterValue",
                "aria-label": "Värde",
              }}
            />
          </StyledFormControl>

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

export default VectorFilter;
