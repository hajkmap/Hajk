import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import FormControl from "@material-ui/core/FormControl";
import NativeSelect from "@material-ui/core/NativeSelect";
import InputLabel from "@material-ui/core/InputLabel";
import Input from "@material-ui/core/Input";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import Typography from "@material-ui/core/Typography/Typography";
import Grid from "@material-ui/core/Grid";

// Define JSS styles that will be used in this component.
const styles = (theme) => ({
  buttonWithBottomMargin: {
    marginBottom: theme.spacing(2),
  },
  buttonWithLeftMargin: {
    marginLeft: theme.spacing(2),
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  toolbar: {
    padding: "5px",
    borderRadius: "4px",
    boxShadow:
      "0px 1px 3px 0px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 2px 1px -1px rgba(0, 0, 0, 0.12)",
  },
  toolbarRow: {},
  gridParam: {
    margin: theme.spacing(1),
  },
});

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
    classes: PropTypes.object.isRequired,
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

  render() {
    const { classes } = this.props;

    return (
      <>
        <div className={classes.toolbar}>
          <Typography variant="caption">Rita område för uttag:</Typography>
          <div className={classes.toolbarRow}>
            <Button variant="contained" onClick={this.buttonDrawArea}>
              Yta
            </Button>
            <Button
              className={classes.buttonWithLeftMargin}
              variant="contained"
              onClick={this.buttonDrawRect}
            >
              Rektangel
            </Button>
          </div>
        </div>
        <div className={classes.row}>
          <FormControl className={classes.formControl}>
            <InputLabel htmlFor="categoryId">Produktkategori:</InputLabel>
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
        </div>
        {this.renderProducts()}
        {this.renderProductParams()}
        <div className={classes.row}>
          <FormControl className={classes.formControl}>
            <TextField
              id="mailID"
              label="E-post"
              value={this.state.email}
              onChange={this.handleChange("email")}
            />
          </FormControl>
        </div>
        <div className={classes.row}>
          <br></br>
          <FormControlLabel
            control={
              <Checkbox
                checked={this.state.authorizedForDownload}
                onChange={this.handleChange("authorizedForDownload")}
                color="primary"
              />
            }
            label="Jag är behörig att ladda ner geodata via giltigt geodataavtal"
          />
        </div>
        <div className={classes.row}>
          <br></br>
        </div>
        <Button
          className={classes.buttonWithBottomMargin}
          variant="contained"
          disabled={!this.state.authorizedForDownload}
          onClick={this.buttonDoOrder}
        >
          Beställ
        </Button>
      </>
    );
  }

  renderProducts() {
    const { classes } = this.props;

    // Get list of products and set currently selected product (if not already set)
    const products = [];
    this.model.options.products.forEach((element) => {
      if (this.state.productType === element.type) {
        products.push(element);
      }
    });

    return (
      <>
        <div className={classes.row}>
          <FormControl className={classes.formControl}>
            <InputLabel htmlFor="productId">Produkt:</InputLabel>
            <NativeSelect
              value={this.state.productId}
              onChange={this.handleProductChange()}
              input={<Input name="product" id="productId" />}
            >
              {products.map((value, index) => {
                return (
                  <option key={value.id} value={value.id}>
                    {value.name}
                  </option>
                );
              })}
            </NativeSelect>
          </FormControl>
        </div>
      </>
    );
  }

  renderProductParams() {
    const { classes } = this.props;

    let params = [];
    if (this.state.productParams) {
      params = this.state.productParams;
    }

    let geoAttribute = this.model.findProductById(
      this.state.productId
    ).geoAttribute;

    return (
      <>
        <div className={classes.root}>
          <div className={classes.toolbar}>
            <Grid container spacing={0} className={classes.gridParam}>
              <Grid item xs>
                <Typography variant="caption">
                  Ange val för produkten:
                </Typography>
              </Grid>
            </Grid>
            {params.map((param, index) => {
              // TODO: Add more types that FME supports
              if (param.type === "TEXT" && param.name === geoAttribute) {
                return ""; // Do nothing
              } else if (param.type === "TEXT") {
                return (
                  <>
                    <Grid container spacing={0} className={classes.gridParam}>
                      <Grid item xs>
                        <Typography variant="caption">
                          {param.description}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid container spacing={0} className={classes.gridParam}>
                      <Grid item xs>
                        <TextField
                          id={param.name}
                          key={param.value}
                          value={param.value}
                          onChange={this.handleParamChange(param, null)}
                        />
                      </Grid>
                    </Grid>
                  </>
                );
              } else if (param.type === "LOOKUP_LISTBOX") {
                // More than one value may be selected
                return (
                  <>
                    <Grid container spacing={0} className={classes.gridParam}>
                      <Grid item xs>
                        <Typography variant="caption">
                          {param.description}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid container spacing={0} className={classes.gridParam}>
                      {param.listOptions.map((option, ind) => {
                        return (
                          <Grid item xs>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  key={ind}
                                  name={option.value}
                                  checked={
                                    param.value[
                                      this.model.prefixOptionValue(option.value)
                                    ]
                                  }
                                  onChange={this.handleParamChange(
                                    param,
                                    option
                                  )}
                                  color="primary"
                                />
                              }
                              label={option.caption}
                            />
                          </Grid>
                        );
                      })}
                    </Grid>
                  </>
                );
              } else if (param.type === "LOOKUP_CHOICE") {
                // Only  one value may be selected
                return (
                  <>
                    <Grid container spacing={0} className={classes.gridParam}>
                      <Grid item xs>
                        <Typography variant="caption">
                          {param.description}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid container spacing={0} className={classes.gridParam}>
                      <Grid item xs>
                        <NativeSelect
                          value={param.value}
                          onChange={this.handleParamChange(param, null)}
                          input={<Input name={param.name} />}
                        >
                          {param.listOptions.map((option, index) => {
                            return (
                              <option key={option.value} value={option.value}>
                                {option.caption}
                              </option>
                            );
                          })}
                        </NativeSelect>
                      </Grid>
                    </Grid>
                  </>
                );
              } else {
                return "NOT_SUPPORTED";
              }
            })}
          </div>
        </div>
      </>
    );
  }
}

// Exporting like this adds some props to FmeView.
// withStyles will add a 'classes' prop, while withSnackbar
// adds to functions (enqueueSnackbar() and closeSnackbar())
// that can be used throughout the Component.
export default withStyles(styles)(withSnackbar(FmeView));
