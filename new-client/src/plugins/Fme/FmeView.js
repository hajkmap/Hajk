import React from "react";
import PropTypes from "prop-types";
import { withSnackbar } from "notistack";
import { styled } from "@mui/material/styles";
import FormControl from "@mui/material/FormControl";
import NativeSelect from "@mui/material/NativeSelect";
import InputLabel from "@mui/material/InputLabel";
import Input from "@mui/material/Input";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";

const StyledButton = styled(Button)(({ theme }) => ({
  width: "100%",
  marginBottom: theme.spacing(2),
}));

class FmeView extends React.PureComponent {
  // Initialize state - this is the correct way of doing it nowadays.
  state = {
    productType: "",
    productId: "",
    productParams: [],
    email: "",
    authorizedForDownload: false,
  };

  static propTypes = {
    model: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
    enqueueSnackbar: PropTypes.func.isRequired,
    closeSnackbar: PropTypes.func.isRequired,
  };

  static defaultProps = {};

  constructor(props) {
    // If you're not using some of properties defined below, remove them from your code.
    // They are shown here for demonstration purposes only.
    super(props);
    this.model = this.props.model;
    //this.localObserver = this.props.localObserver;
    //this.globalObserver = this.props.app.globalObserver;

    // Get a unique list of product types
    this.productTypes = [
      ...new Set(this.model.options.products.map((data) => data.type)),
    ];
    // Manipulate state directly in constructor
    this.state.productType = this.productTypes[0];
    var product = this.model.findFirstProductWithType(this.productTypes[0]);
    if (product) {
      this.state.productId = product.id;
      let params = product.parameters;
      this.model.addValuesToParams(params, product.geoAttribute);
      this.state.productParams = params;
    }
    this.state.email = this.model.options.email;
  }

  setProductIdAndParams(productId) {
    this.setState({ productId: productId });

    let product = this.model.findProductById(productId);
    let params = this.model.getProductParams(productId);
    this.model.addValuesToParams(params, product.geoAttribute);

    this.setState({ productParams: params });
  }

  handleProductTypeChange = () => (event) => {
    let productType = event.target.value;
    this.setState({ productType: productType });
    // Set the product to the first product of the selected type (category)
    let product = this.model.findFirstProductWithType(productType);
    if (product) {
      this.setProductIdAndParams(product.id);
    }
  };

  handleProductChange = () => (event) => {
    let productId = event.target.value;

    this.setProductIdAndParams(productId);
  };

  handleChange = (name) => (event) => {
    if (name === "authorizedForDownload") {
      this.setState({ [name]: event.target.checked });
    } else {
      this.setState({ [name]: event.target.value });
    }
  };

  handleParamChange = (param, option) => (event) => {
    let state_params = this.state.productParams;
    let state_param = this.model.findProductParamByName(
      state_params,
      param.name
    );
    // TODO: Add more types that FME supports
    if (param.type === "TEXT") {
      state_param.value = event.target.value;
    } else if (param.type === "LOOKUP_LISTBOX") {
      // More than one value may be selected
      state_param.value[this.model.prefixOptionValue(option.value)] =
        event.target.checked;
    } else if (param.type === "LOOKUP_CHOICE") {
      // Only  one value may be selected
      state_param.value = event.target.value;
    }
    this.setState({ productParams: state_params });
    this.forceUpdate(); // Why? Probably because of the React key warning
  };

  buttonDrawArea = () => {
    this.model.addInteraction(false);
  };

  buttonDrawRect = () => {
    this.model.addInteraction(true);
  };

  // TODO: Move order function to FmeModel
  buttonDoOrder = () => {
    let product = this.model.findProductById(this.state.productId);
    let params = this.model.getParamsForOrder(
      this.state.productParams,
      this.state.email,
      product.geoAttribute,
      product.maxArea
    );
    let fmeServer = this.model.options.fmeServer;

    if (params.success) {
      let url =
        fmeServer.host +
        "fmedatadownload/" +
        fmeServer.repository +
        "/" +
        product.fmeWorkspace;

      // Default options are marked with *
      fetch(url, {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, *cors, same-origin
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        credentials: "include", // include, *same-origin, omit
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "fmetoken token=" + fmeServer.token,
        },
        redirect: "follow", // manual, *follow, error
        referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: params.params, // body data type must match "Content-Type" header
      })
        .then((response) => response.json())
        .then((ret) => {
          console.log("Fetch OK: ", ret);
          if (ret.serviceResponse.statusInfo.status === "success") {
            this.props.enqueueSnackbar(
              "Beställningen har mottagits! Resultatet skickas till " +
                ret.serviceResponse.email
            );
          } else {
            this.props.enqueueSnackbar(
              "Beställningen kunde tyvärr inte utföras "
            );
          }
        })
        .catch((err) => {
          console.log("Fetch Error: ", err);
          this.props.enqueueSnackbar(
            "Beställningen kunde tyvärr inte utföras: " + err.toString()
          );
        });

      //this.props.enqueueSnackbar("Request parameters: " + params.params);
    } else {
      this.props.enqueueSnackbar(params.errMsg);
    }
  };

  renderProducts() {
    // Get list of products and set currently selected product (if not already set)
    const products = [];
    this.model.options.products.forEach((element) => {
      if (this.state.productType === element.type) {
        products.push(element);
      }
    });

    return (
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel variant="standard" htmlFor="productId">
            Produkt:
          </InputLabel>
          <NativeSelect
            value={this.state.productId}
            onChange={this.handleProductChange()}
            input={<Input name="product" id="productId" />}
          >
            {products.map((value, index) => {
              return (
                <option key={index} value={value.id}>
                  {value.name}
                </option>
              );
            })}
          </NativeSelect>
        </FormControl>
      </Grid>
    );
  }

  renderProductParams() {
    let params = [];
    if (this.state.productParams) {
      params = this.state.productParams;
    }

    let geoAttribute = this.model.findProductById(
      this.state.productId
    ).geoAttribute;

    return (
      <Grid container item xs={12}>
        <Grid item xs={12}>
          <Typography variant="caption">Ange val för produkten:</Typography>
        </Grid>
        {params.map((param, index) => {
          // TODO: Add more types that FME supports
          if (param.type === "TEXT" && param.name === geoAttribute) {
            return null;
          } else if (param.type === "TEXT") {
            return (
              <Grid key={`TEXT_${index}`} item xs={12}>
                <Grid item xs={12}>
                  <Typography variant="caption">{param.description}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id={param.name}
                    key={param.value}
                    value={param.value}
                    onChange={this.handleParamChange(param, null)}
                  />
                </Grid>
              </Grid>
            );
          } else if (param.type === "LOOKUP_LISTBOX") {
            // More than one value may be selected
            return (
              <Grid key={`LOOKUP_LISTBOX_${index}`} container item xs={12}>
                <Grid item xs={12}>
                  <Typography variant="caption">{param.description}</Typography>
                </Grid>
                {param.listOptions.map((option, index) => {
                  return (
                    <Grid key={`LOOKUP_LISTBOX_${index}`} item xs={12}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            name={option.value}
                            checked={
                              param.value[
                                this.model.prefixOptionValue(option.value)
                              ]
                            }
                            onChange={this.handleParamChange(param, option)}
                            color="primary"
                          />
                        }
                        label={option.caption}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            );
          } else if (param.type === "LOOKUP_CHOICE") {
            // Only  one value may be selected
            return (
              <Grid key={`LOOKUP_CHOICE_${index}`} container item xs={12}>
                <Grid container item xs={12}>
                  <Typography variant="caption">{param.description}</Typography>
                </Grid>
                <Grid container item xs={12}>
                  <NativeSelect
                    fullWidth
                    value={param.value}
                    onChange={this.handleParamChange(param, null)}
                    input={<Input name={param.name} />}
                  >
                    {param.listOptions.map((option, index) => {
                      return (
                        <option
                          key={`LOOKUP_LISTBOX_${index}`}
                          value={option.value}
                        >
                          {option.caption}
                        </option>
                      );
                    })}
                  </NativeSelect>
                </Grid>
              </Grid>
            );
          } else {
            return "NOT_SUPPORTED";
          }
        })}
      </Grid>
    );
  }

  render() {
    return (
      <Grid container spacing={1}>
        <Grid container item xs={12}>
          <Paper sx={{ padding: 1, width: "100%" }}>
            <Grid item xs={12}>
              <Typography variant="caption">Rita område för uttag:</Typography>
            </Grid>
            <Grid container item xs={12} spacing={1}>
              <Grid item>
                <Button variant="contained" onClick={this.buttonDrawArea}>
                  Yta
                </Button>
              </Grid>
              <Grid item>
                <Button variant="contained" onClick={this.buttonDrawRect}>
                  Rektangel
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid container item xs={12}>
          <Box sx={{ padding: 1, width: "100%" }}>
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ marginBottom: 1 }}>
                <InputLabel variant="standard" htmlFor="categoryId">
                  Produktkategori:
                </InputLabel>
                <NativeSelect
                  value={this.state.productType}
                  onChange={this.handleProductTypeChange()}
                  input={<Input name="category" id="categoryId" />}
                >
                  {this.productTypes.map((value, index) => {
                    return (
                      <option key={index} value={value}>
                        {value}
                      </option>
                    );
                  })}
                </NativeSelect>
              </FormControl>
            </Grid>
            {this.renderProducts()}
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ padding: 1, width: "100%" }}>
            {this.renderProductParams()}
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ padding: 1, width: "100%" }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <TextField
                  id="mailID"
                  label="E-post"
                  value={this.state.email}
                  onChange={this.handleChange("email")}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                sx={{ marginTop: 1, marginBottom: 1 }}
                variant="standard"
                control={
                  <Checkbox
                    checked={this.state.authorizedForDownload}
                    onChange={this.handleChange("authorizedForDownload")}
                    color="primary"
                  />
                }
                label="Jag är behörig att ladda ner geodata via giltigt geodataavtal"
              />
            </Grid>
            <Grid item xs={12}>
              <StyledButton
                variant="contained"
                disabled={!this.state.authorizedForDownload}
                onClick={this.buttonDoOrder}
              >
                Beställ
              </StyledButton>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    );
  }
}

export default withSnackbar(FmeView);
