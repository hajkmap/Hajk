import React from "react";
import { Component } from "react";
import { hfetch } from "utils/FetchWrapper";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import Tooltip from "@material-ui/core/Tooltip";
import Paper from "@material-ui/core/Paper";
import { FormControl, InputLabel, MenuItem, Select } from "@material-ui/core";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@material-ui/core";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import DeleteIcon from "@material-ui/icons/Delete";
import DoneIcon from "@material-ui/icons/Done";
import SaveIcon from "@material-ui/icons/SaveSharp";
import WarningIcon from "@material-ui/icons/Warning";
import { withStyles } from "@material-ui/core/styles";
import { blue } from "@material-ui/core/colors";

const ColorButtonBlue = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(blue[500]),
    backgroundColor: blue[500],
    "&:hover": {
      backgroundColor: blue[700],
    },
  },
}))(Button);

const newProductTemplate = {
  name: "",
  group: "",
  workspace: "",
  repository: "",
  maxArea: 100000,
  promptForEmail: false,
  infoUrl: "",
  geoAttribute: "",
  visibleForGroups: [],
};

const defaultState = {
  validationErrors: [],
  active: false,
  index: 0,
  target: "toolbar",
  instruction: "",
  visibleAtStart: false,
  visibleForGroups: [],
  productGroups: ["Fastighetsinformation"],
  showRemoveGroupWarning: false,
  availableRepositories: [],
  currentRepository: null,
  availableWorkspaces: [],
  availableParameters: [],
  newProduct: newProductTemplate,
  products: [],
  newGroupName: "",
  newGroupError: false,
  loading: true,
  loadingError: false,
};

class ToolOptions extends Component {
  constructor(props) {
    super(props);
    this.state = defaultState;
    this.type = "fmeServer";
    this.fmeServerUrl = this.props.model?.attributes?.config.url_base
      ? `${this.props.model.attributes.config.url_base}/fmeproxy`
      : "";
  }

  async componentDidMount() {
    const { newProduct } = this.state;
    // Let's start by fetching all available repositories
    const availableRepositories = await this.getAvailableRepositories();
    const availableWorkspaces = await this.getAvailableWorkspaces(
      availableRepositories[0]
    );
    const availableParameters = await this.getWorkspaceParameters(
      availableRepositories[0],
      availableWorkspaces[0]
    );

    newProduct.repository = availableRepositories[0] ?? "";
    newProduct.workspace = availableWorkspaces[0] ?? "";
    newProduct.geoAttribute = availableParameters[0] ?? "";

    const tool = this.getTool();
    if (tool) {
      this.setState({
        active: true,
        index: tool.index,
        target: tool.options.target || "toolbar",
        position: tool.options.position,
        width: tool.options.width,
        height: tool.options.height,
        instruction: tool.options.instruction,
        visibleAtStart: tool.options.visibleAtStart,
        visibleForGroups:
          tool.options.visibleForGroups || this.state.visibleForGroups,
        productGroups: tool.options.productGroups || this.state.productGroups,
        availableRepositories: availableRepositories,
        currentRepository: availableRepositories[0],
        availableWorkspaces: availableWorkspaces,
        availableParameters: availableParameters,
        newProduct: newProduct,
        products: tool.options.products || this.state.products,
        loading: false,
        // If we fail to fetch repositories, we for sure have a loading error.
        loadingError: availableRepositories.length === 0,
      });
    } else {
      this.setState({
        active: false,
        loading: false,
        // If we fail to fetch repositories, we for sure have a loading error.
        loadingError: availableRepositories.length === 0,
        availableRepositories: availableRepositories,
        currentRepository: availableRepositories[0],
        availableWorkspaces: availableWorkspaces,
        availableParameters: availableParameters,
        newProduct: newProduct,
      });
    }
  }

  getAvailableRepositories = async () => {
    const repositories = [];
    try {
      const response = await hfetch(
        `${this.fmeServerUrl}/fmerest/v3/repositories?limit=-1&offset=-1`
      );
      const data = await response.json();
      if (!data.items) {
        return [];
      }
      data.items.forEach((repo) => {
        repositories.push(repo.name);
      });
      return repositories;
    } catch (error) {
      console.error(
        `Failed to fetch repositories trough the backend. Make sure that the FME-server proxy is properly configured in the backend.`
      );
      return [];
    }
  };

  getAvailableWorkspaces = async (repositoryName) => {
    if (!repositoryName) {
      return [];
    }

    const workspaces = [];
    try {
      const response = await hfetch(
        `${this.fmeServerUrl}/fmerest/v3/repositories/${repositoryName}/items`
      );
      const data = await response.json();
      if (!data.items) {
        return [];
      }
      data.items.forEach((workspace) => {
        workspaces.push(workspace.name);
      });
      return workspaces;
    } catch (error) {
      console.error(
        `Failed to fetch workspaces trough the backend. Make sure that the FME-server proxy is properly configured in the backend.`
      );
      return [];
    }
  };

  getWorkspaceParameters = async (repositoryName, workspaceName) => {
    if (!repositoryName || !workspaceName) {
      return [];
    }

    const parameters = [];
    try {
      const response = await hfetch(
        `${this.fmeServerUrl}/fmerest/v3/repositories/${repositoryName}/items/${workspaceName}/parameters`
      );
      const data = await response.json();
      if (!data) {
        return [];
      }
      data.forEach((parameter) => {
        parameters.push(parameter.name);
      });
      return parameters;
    } catch (error) {
      return [];
    }
  };

  handleInputChange(event) {
    const t = event.target;
    const name = t.name;
    let value = t.type === "checkbox" ? t.checked : t.value;
    if (typeof value === "string" && value.trim() !== "") {
      value = !isNaN(Number(value)) ? Number(value) : value;
    }
    this.setState({
      [name]: value,
    });
  }

  getTool() {
    return this.props.model
      .get("toolConfig")
      .find((tool) => tool.type === this.type);
  }

  add(tool) {
    this.props.model.get("toolConfig").push(tool);
  }

  remove(tool) {
    this.props.model.set({
      toolConfig: this.props.model
        .get("toolConfig")
        .filter((tool) => tool.type !== this.type),
    });
  }

  replace(tool) {
    this.props.model.get("toolConfig").forEach((t) => {
      if (t.type === this.type) {
        t.options = tool.options;
        t.index = tool.index;
        t.instruction = tool.instruction;
      }
    });
  }

  save() {
    const tool = {
      type: this.type,
      index: this.state.index,
      options: {
        target: this.state.target,
        position: this.state.position,
        width: this.state.width,
        height: this.state.height,
        instruction: this.state.instruction,
        visibleAtStart: this.state.visibleAtStart,
        visibleForGroups: this.state.visibleForGroups.map(
          Function.prototype.call,
          String.prototype.trim
        ),
        productGroups: this.state.productGroups,
        products: this.state.products,
      },
    };

    const existing = this.getTool();

    function update() {
      this.props.model.updateToolConfig(
        this.props.model.get("toolConfig"),
        () => {
          this.props.parent.props.parent.setState({
            alert: true,
            alertMessage: "Uppdateringen lyckades",
          });
        }
      );
    }

    if (!this.state.active) {
      if (existing) {
        const {
          availableRepositories,
          availableWorkspaces,
          availableParameters,
        } = this.state;
        this.props.parent.props.parent.setState({
          alert: true,
          confirm: true,
          alertMessage:
            "Verktyget kommer att tas bort. Nuvarande inställningar kommer att gå förlorade. Vill du fortsätta?",
          confirmAction: () => {
            this.remove();
            update.call(this);
            this.setState({
              ...defaultState,
              loading: false,
              availableRepositories,
              availableWorkspaces,
              availableParameters,
            });
          },
        });
      } else {
        this.remove();
        update.call(this);
      }
    } else {
      if (existing) {
        this.replace(tool);
      } else {
        this.add(tool);
      }
      update.call(this);
    }
  }

  handleAuthGroupsChange(event) {
    const target = event.target;
    const value = target.value;
    let groups = [];

    try {
      groups = value.split(",");
    } catch (error) {
      console.log(`Någonting gick fel: ${error}`);
    }

    this.setState({
      visibleForGroups: value !== "" ? groups : [],
    });
  }

  handleNewGroupChange = (e) => {
    const groupNameExists = this.state.productGroups.includes(e.target.value);
    this.setState({
      newGroupName: e.target.value,
      newGroupError: groupNameExists,
    });
  };

  handleAddNewGroupClick = () => {
    const { productGroups } = this.state;
    productGroups.push(this.state.newGroupName);
    this.setState({ productGroups, newGroupName: "" });
  };

  handleRemoveGroupClick = (group) => {
    const { productGroups } = this.state;
    const updatedGroups = productGroups.filter((g) => {
      return g !== group;
    });
    if (updatedGroups.length === 0) {
      this.setState({
        showRemoveGroupWarning: true,
      });
    } else {
      this.setState({
        productGroups: updatedGroups,
      });
    }
  };

  // Terrible, i know. But it is admin after all ;)
  handleNewProductChange = (field, newValue) => {
    const { newProduct } = this.state;
    newProduct[field] = newValue;
    this.setState({
      newProduct,
    });
  };

  // When we change the active repository when creating a new product, we
  // must make sure to fetch the new workspaces and so on.
  handleCurrentRepositoryChange = async (newRepository) => {
    const { newProduct } = this.state;
    const availableWorkspaces = await this.getAvailableWorkspaces(
      newRepository
    );
    const newWorkspace =
      availableWorkspaces.length > 0 ? availableWorkspaces[0] : null;
    const availableParameters = !newWorkspace
      ? []
      : await this.getWorkspaceParameters(newRepository, newWorkspace);

    newProduct.repository = newRepository;
    newProduct.workspace = newWorkspace;
    newProduct.geoAttribute = availableParameters[0] ?? "";

    this.setState({
      newProduct: newProduct,
      currentRepository: newRepository,
      availableWorkspaces: availableWorkspaces,
      availableParameters: availableParameters,
    });
  };

  // When we change the active workspace when creating a new product, we
  // must make sure to fetch the new workspace parameters and so on.
  handleCurrentWorkspaceChange = async (newWorkspace) => {
    const { currentRepository } = this.state;
    const { newProduct } = this.state;
    const availableParameters = !newWorkspace
      ? []
      : await this.getWorkspaceParameters(currentRepository, newWorkspace);

    newProduct.workspace = newWorkspace;
    newProduct.geoAttribute = availableParameters[0] ?? "";

    this.setState({
      newProduct: newProduct,
      availableParameters: availableParameters,
    });
  };

  // Checks wether the new product parameters are OK
  newProductIsValid = () => {
    const { newProduct, productGroups, products } = this.state;
    // If the new product group does not exist in the available groups, the new product is not OK
    if (!productGroups.includes(newProduct.group)) {
      return false;
    }
    // If the new product name is shorter than 3 chars, the new product is not OK
    if (newProduct.name.length < 3) {
      return false;
    }
    // If the new product name exists in the same group, the new product is not OK
    const productsWithSameName = products.filter((product) => {
      return (
        product.name === newProduct.name && product.group === newProduct.group
      );
    });
    if (productsWithSameName.length !== 0) {
      return false;
    }
    // Otherwise, the new product is OK
    return true;
  };

  // Adds the new product to the array of products
  handleAddNewProduct = () => {
    const { newProduct, products } = this.state;
    products.push(newProduct);
    this.setState({
      products: products,
      newProduct: { ...newProduct, name: "", group: "" },
    });
  };

  // Removes the product to the array of products
  handleRemoveProductClick = (e, product) => {
    const { products } = this.state;
    // Let's stop the event
    e.stopPropagation();
    e.preventDefault();
    // A product can be distinguished with its name and group
    const filteredProducts = products.filter((p) => {
      if (p.name === product.name && p.group === product.group) {
        return false;
      }
      return true;
    });
    this.setState({ products: filteredProducts });
  };

  // The visibleForGroups parameter should be an array and not a string
  // let's split the string and add the segments to the array.
  handleProductVisibleForGroupsChange = (groupsString) => {
    const { newProduct } = this.state;
    const groups =
      groupsString === ""
        ? []
        : groupsString.split(",").map((group) => group.trim());
    newProduct.visibleForGroups = groups;
    this.setState({
      newProduct,
    });
  };

  renderModal() {
    return (
      <Dialog
        open={this.state.showRemoveGroupWarning}
        onClose={() => this.setState({ showRemoveGroupWarning: false })}
      >
        <DialogTitle>Kan inte radera gruppen</DialogTitle>
        <DialogContent>
          Gruppen gick inte att radera eftersom det måste finnas minst en grupp.
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            className="btn"
            onClick={() => this.setState({ showRemoveGroupWarning: false })}
            startIcon={<DoneIcon />}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  renderVisibleForGroups() {
    if (this.props.parent.props.parent.state.authActive) {
      return (
        <div>
          <label htmlFor="visibleForGroups">Tillträde</label>
          <input
            id="visibleForGroups"
            value={this.state.visibleForGroups}
            type="text"
            name="visibleForGroups"
            onChange={(e) => {
              this.handleAuthGroupsChange(e);
            }}
          />
        </div>
      );
    } else {
      return null;
    }
  }

  renderProductGroups = () => {
    return (
      <Grid container>
        {this.state.productGroups.map((group, index) => {
          return (
            <Grid item key={index}>
              <Paper
                elevation={6}
                style={{ padding: 8, marginTop: 16, marginRight: 16 }}
              >
                <Typography component="span">{group}</Typography>
                <IconButton
                  size="small"
                  component="span"
                  onClick={() => this.handleRemoveGroupClick(group)}
                >
                  <DeleteIcon />
                </IconButton>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  renderProducts = () => {
    const { products, productGroups } = this.state;
    return (
      <Grid container style={{ marginBottom: 16 }}>
        <Paper elevation={6} style={{ padding: 16 }}>
          <Grid item xs={12} style={{ marginBottom: 8 }}>
            <Typography variant="button">Aktiva produkter:</Typography>
          </Grid>
          <Grid item xs={12}>
            {products.length > 0 ? (
              products.map((product, index) => {
                return (
                  <Accordion square key={index} style={{ marginBottom: 16 }}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      id="workspace-header"
                    >
                      <Grid
                        container
                        item
                        xs={12}
                        alignItems="center"
                        justify="space-between"
                      >
                        <Typography>{product.name}</Typography>
                        <Grid
                          container
                          item
                          xs={3}
                          alignItems="center"
                          justify="flex-end"
                        >
                          {!productGroups.includes(product.group) && (
                            <Tooltip
                              title={`Gruppen som produkten tillhör verkar vara raderad... Produkten kommer inte synas i Hajk. Lägg till en grupp (${product.group}) för att åtgärda felet`}
                            >
                              <WarningIcon color="secondary" />
                            </Tooltip>
                          )}
                          <IconButton
                            size="small"
                            component="span"
                            onClick={(e) =>
                              this.handleRemoveProductClick(e, product)
                            }
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </AccordionSummary>
                    <AccordionDetails>
                      {this.renderProductInfo(product)}
                    </AccordionDetails>
                  </Accordion>
                );
              })
            ) : (
              <Typography>
                Just nu finns det inga aktiva produkter. Lägg till den första!
              </Typography>
            )}
          </Grid>
        </Paper>
      </Grid>
    );
  };

  renderCreateNewProduct = () => {
    return (
      <Grid container style={{ marginBottom: 16 }}>
        <Paper elevation={6} style={{ padding: 16 }}>
          <Grid item xs={12} style={{ marginBottom: 8 }}>
            <Typography variant="button">Lägg till ny produkt:</Typography>
          </Grid>
          {this.renderCreateProductForm()}
        </Paper>
      </Grid>
    );
  };

  renderCreateProductForm = () => {
    const { newProduct, availableParameters } = this.state;
    const newProductIsValid = this.newProductIsValid();
    return (
      <Grid item xs={12} id="fmeWorkspaceInfo">
        <TextField
          label="Namn"
          fullWidth
          variant="outlined"
          placeholder="Namn på arbetsytan"
          onChange={(e) => this.handleNewProductChange("name", e.target.value)}
          value={newProduct.name}
        />
        <FormControl fullWidth style={{ marginTop: 16 }}>
          <InputLabel variant="outlined" id="select-repository-label">
            Repository
          </InputLabel>
          <Select
            labelId="select-repository-label"
            fullWidth
            label="Repository"
            variant="outlined"
            placeholder="Repository"
            onChange={(e) => this.handleCurrentRepositoryChange(e.target.value)}
            id="select-repository"
            value={newProduct.repository}
          >
            {this.state.availableRepositories.map((repo, index) => {
              return (
                <MenuItem key={index} value={repo}>
                  {repo}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
        <FormControl fullWidth style={{ marginTop: 16 }}>
          <InputLabel variant="outlined" id="select-group-label">
            Grupp
          </InputLabel>
          <Select
            labelId="select-group-label"
            fullWidth
            label="Grupp"
            variant="outlined"
            placeholder="Repository"
            onChange={(e) =>
              this.handleNewProductChange("group", e.target.value)
            }
            id="select-repository"
            value={newProduct.group}
          >
            {this.state.productGroups.map((group, index) => {
              return (
                <MenuItem key={index} value={group}>
                  {group}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
        <FormControl fullWidth style={{ marginTop: 16 }}>
          <InputLabel variant="outlined" id="select-workspace-label">
            Arbetsyta
          </InputLabel>
          <Select
            labelId="select-workspace-label"
            fullWidth
            label="Arbetsyta"
            variant="outlined"
            onChange={(e) => this.handleCurrentWorkspaceChange(e.target.value)}
            placeholder="Arbetsyta"
            id="select-workspace"
            value={newProduct.workspace}
          >
            {this.state.availableWorkspaces.map((workspace, index) => {
              return (
                <MenuItem key={index} value={workspace}>
                  {workspace}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
        <FormControl fullWidth style={{ marginTop: 16 }}>
          <InputLabel variant="outlined" id="select-workspace-label">
            Geometri-attribut
          </InputLabel>
          <Select
            labelId="select-geoAttribute-label"
            fullWidth
            label="Geometri-attribut"
            variant="outlined"
            placeholder="Geometri-attribut"
            onChange={(e) =>
              this.handleNewProductChange("geoAttribute", e.target.value)
            }
            id="select-workspace"
            value={newProduct.geoAttribute}
          >
            <MenuItem key={"select-geom-base-item"} value={"none"}>
              Inget
            </MenuItem>
            {availableParameters.map((parameter, index) => {
              return (
                <MenuItem key={index} value={parameter}>
                  {parameter}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
        <TextField
          label="Area-begränsning (m2)"
          type="number"
          fullWidth
          variant="outlined"
          placeholder="Begränsa hur stora geometri-objekt som kan skickas till servern."
          style={{ marginTop: 16 }}
          onChange={(e) =>
            this.handleNewProductChange("maxArea", e.target.value)
          }
          error={this.state.newGroupError}
          value={newProduct.maxArea ?? 10000}
        />
        <TextField
          label="Informationsdokument, länk"
          fullWidth
          variant="outlined"
          placeholder="Länk till eventuellt informations-dokument"
          style={{ marginTop: 16 }}
          onChange={(e) =>
            this.handleNewProductChange("infoUrl", e.target.value)
          }
          error={this.state.newGroupError}
          value={newProduct.infoUrl ?? ""}
        />
        <TextField
          label="Begränsa till AD-grupper:"
          fullWidth
          variant="outlined"
          placeholder="Lämna fältet tomt för att arbetsytan skall vara tillgänglig för alla."
          style={{ marginTop: 16, marginBottom: 16 }}
          onChange={(e) =>
            this.handleProductVisibleForGroupsChange(e.target.value)
          }
          value={newProduct.visibleForGroups ?? ""}
        />
        <Grid
          container
          item
          xs={12}
          justify="flex-end"
          style={{ marginBottom: 8 }}
        >
          <Typography variant="caption">
            Nedan bestäms om workspaces skall köras som Data-download eller
            inte. Vad betyder det då? Jo, om denna parameter sätts till "Ja" så
            kommer användarna vara tvugna att ange sin epost-adress. Denna
            adressen kommer sedan skickas med till FME-server under ett
            user_email attribut. Känns detta oklart? Konsultera FME-server
            dokumentationen.
          </Typography>
        </Grid>
        <FormControl fullWidth style={{ marginTop: 16 }}>
          <InputLabel variant="outlined" id="select-prompt-email-label">
            Ska workspacet köras som Data-download?
          </InputLabel>
          <Select
            labelId="select-prompt-email-label"
            fullWidth
            label="Ska workspacet köras som Data-download?"
            variant="outlined"
            placeholder="Ska workspacet köras som Data-download?"
            onChange={(e) =>
              this.handleNewProductChange("promptForEmail", e.target.value)
            }
            id="select-workspace"
            value={newProduct.promptForEmail}
          >
            <MenuItem key={"select-promptForEmail-true"} value={true}>
              Ja
            </MenuItem>
            <MenuItem key={"select-promptForEmail-false"} value={false}>
              Nej
            </MenuItem>
          </Select>
        </FormControl>
        <Grid
          container
          item
          xs={12}
          justify="flex-end"
          style={{ marginBottom: 16 }}
        >
          <Typography variant="caption">
            Observera att namnet på produkten måste bestå av mer än 3 tecken
            samt att namnet måste skilja sig från de andra produkterna i samma
            grupp.
          </Typography>
        </Grid>
        <Grid container item xs={12} justify="flex-end">
          <Button
            disabled={!newProductIsValid}
            onClick={this.handleAddNewProduct}
            variant="contained"
          >
            Lägg till
          </Button>
        </Grid>
      </Grid>
    );
  };

  renderProductInfo = (product) => {
    return (
      <Grid item xs={12} id="fmeWorkspaceInfo">
        <Grid item xs={12}>
          <Typography variant="button">{`Produktnamn: ${product.name}`}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="button">{`Tillhör grupp: ${product.group}`}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="button">{`FME-repository: ${product.repository}`}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="button">{`FME-arbetsyta: ${product.workspace}`}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="button">{`Geometri-attribut: ${product.geoAttribute}`}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="button">{`Area begränsad till: ${product.maxArea} m2`}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="button">{`Informationslänk: ${product.infoUrl}`}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="button">
            {product.visibleForGroups.length > 0
              ? `Begränsad till följande AD-grupper: ${product.visibleForGroups}`
              : "Produkten kan användas av vem som helst"}
          </Typography>
        </Grid>
      </Grid>
    );
  };

  renderToolSettings = () => {
    return (
      <div id="fmeGroupArea">
        <form>
          <p>
            <ColorButtonBlue
              variant="contained"
              className="btn"
              onClick={(e) => {
                e.preventDefault();
                this.save();
              }}
              startIcon={<SaveIcon />}
            >
              Spara
            </ColorButtonBlue>
          </p>
          <div>
            <input
              id="active"
              name="active"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.active}
            />
            &nbsp;
            <label htmlFor="active">Aktiverad</label>
          </div>
          <div className="separator">Fönsterinställningar</div>
          <div>
            <label htmlFor="index">Sorteringsordning</label>
            <input
              id="index"
              name="index"
              type="number"
              min="0"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.index}
            />
          </div>
          <div>
            <label htmlFor="target">Verktygsplacering</label>
            <select
              id="target"
              name="target"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.target}
            >
              <option value="toolbar">Drawer</option>
              <option value="left">Widget left</option>
              <option value="right">Widget right</option>
              <option value="control">Control button</option>
            </select>
          </div>
          <div>
            <label htmlFor="position">
              Fönsterplacering{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Placering av verktygets fönster. Anges som antingen 'left' eller 'right'."
              />
            </label>
            <select
              id="position"
              name="position"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.position}
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
          <div>
            <label htmlFor="width">
              Fönsterbredd{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Bredd i pixlar på verktygets fönster. Anges som ett numeriskt värde. Lämna tomt för att använda standardbredd."
              />
            </label>
            <input
              id="width"
              name="width"
              type="number"
              min="0"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.width}
            />
          </div>
          <div>
            <label htmlFor="height">
              Fönsterhöjd{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Höjd i pixlar på verktygets fönster. Anges antingen numeriskt (pixlar), 'dynamic' för att automatiskt anpassa höjden efter innehållet eller 'auto' att använda maximal höjd."
              />
            </label>
            <input
              id="height"
              name="height"
              type="text"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.height}
            />
          </div>
          <div className="separator">Övriga inställningar</div>
          <div>
            <input
              id="visibleAtStart"
              name="visibleAtStart"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.visibleAtStart}
            />
            &nbsp;
            <label htmlFor="visibleAtStart">Synlig vid start</label>
          </div>
          <div>
            <label htmlFor="instruction">
              Instruktion{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Visas som tooltip vid mouseover på verktygsknappen"
              />
            </label>
            <textarea
              type="text"
              id="instruction"
              name="instruction"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.instruction ? atob(this.state.instruction) : ""}
            />
          </div>
          <div>{this.renderVisibleForGroups()}</div>
          <div className="separator">Grupper</div>
          <Grid container item xs={12}>
            <Grid item xs={12}>
              <p>
                <i>
                  En arbetsyta skall kopplas till en grupp för att användarna
                  enkelt skall kunna hitta den arbetsyta de letar efter. <br />
                  Här kan grupper läggas till eller raderas efter tycke och
                  smak.
                </i>
              </p>
            </Grid>
            <Grid container item xs={12}>
              <Grid container item xs={12} alignItems="flex-start" spacing={1}>
                <Grid item>
                  <TextField
                    size="small"
                    variant="outlined"
                    placeholder="Gruppnamn"
                    error={this.state.newGroupError}
                    value={this.state.newGroupName}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        this.handleAddNewGroupClick();
                      }
                    }}
                    onChange={this.handleNewGroupChange}
                    id="new-fme-group-input"
                    helperText={
                      this.state.newGroupError
                        ? "En grupp med det namnet finns redan"
                        : ""
                    }
                  />
                </Grid>
                <Grid item>
                  <Button
                    disabled={
                      this.state.newGroupError ||
                      this.state.newGroupName.length < 3
                    }
                    onClick={this.handleAddNewGroupClick}
                    variant="contained"
                  >
                    Lägg till grupp
                  </Button>
                </Grid>
              </Grid>
            </Grid>
            {this.renderProductGroups()}
          </Grid>
          <div className="separator">Produkter</div>
          <Grid container>
            <Grid item xs={12}>
              <p>
                <i>
                  Nedan kan produkter läggas till eller tas bort. I dagsläget
                  finns det ingen möjlighet att redigera en tillagd produkt,
                  utan istället får produkten tas bort och skapas upp igen. För
                  att förenkla adderandet av nya produkter så hämtas alla
                  tillgängliga repositories samt arbetsytor från FME-server.
                  Observera att det bara är de arbetsytor och repositories som
                  FME-användaren (angiven i backend) har tillgång till som
                  listas.
                </i>
              </p>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                {this.renderCreateNewProduct()}
              </Grid>
              <Grid item xs={6}>
                {this.renderProducts()}
              </Grid>
            </Grid>
          </Grid>
        </form>
        {this.renderModal()}
      </div>
    );
  };

  render() {
    return this.state.loading ? (
      <p>Hämtar data från FME-server...</p>
    ) : !this.state.loadingError ? (
      this.renderToolSettings()
    ) : (
      <p>
        Konfigurationsfel. Kunde inte koppla upp mot FME-server. <br /> Kolla
        över inställningarna i backend och säkerställ att FME-server-proxyn är
        aktiverad och konfigurerad.
      </p>
    );
  }
}

export default ToolOptions;
