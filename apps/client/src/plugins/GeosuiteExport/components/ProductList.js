import React from "react";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";
import {
  Typography,
  Chip,
  IconButton,
  Box,
  Grid,
  Paper,
  Menu,
  MenuItem,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import WorkIcon from "@mui/icons-material/Work";
import Crop32Icon from "@mui/icons-material/Crop32";

const DivProductList = styled("div")(({ theme }) => ({
  maxHeight: 350,
  overflowY: "scroll",
  overflowX: "hidden",
  marginTop: theme.spacing(1),
  border: `1px solid ${theme.palette.divider}`,
}));

const GridListItemContainer = styled(Grid)(({ theme }) => ({
  padding: theme.spacing(1),
  borderBottom: `${theme.spacing(0.2)}px solid ${theme.palette.divider}`,
}));

const StyledChip = styled(Chip)(() => ({
  minWidth: "40%",
}));

class ProductList extends React.PureComponent {
  state = {
    anchorEl: undefined,
    activeProject: undefined,
    globalExportSetting: "withinArea",
  };

  static propTypes = {
    projects: PropTypes.array.isRequired,
  };

  renderProjectDetails = (project) => {
    let shouldExportAll = project.exportAll;
    if (shouldExportAll) {
      return (
        <Box display="flex" justifyContent="center" gridColumnGap="5%">
          <WorkIcon />
          <Typography>{project.numBoreHolesTotal}</Typography>
        </Box>
      );
    } else {
      return (
        <Box display="flex" gridColumnGap="5%">
          <Crop32Icon />
          <Typography>{project.numBoreHolesSelected}</Typography>
        </Box>
      );
    }
  };

  render() {
    const {
      projects,
      handleExportAll,
      exportPerProject = false,
      handleToggleProjectExport = () => {},
    } = this.props;
    const { anchorEl } = this.state;

    if (projects.length > 0) {
      return (
        <Grid container style={{ marginTop: "10px" }}>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="start" gridColumnGap="8px">
              <StyledChip
                onClick={() => {
                  this.setState({ globalExportSetting: "withinArea" });
                  handleExportAll(false);
                }}
                icon={<Crop32Icon />}
                label="Inom markering"
                size="medium"
                variant={`${
                  this.state.globalExportSetting === "withinArea"
                    ? "default"
                    : "outlined"
                }`}
              />
              <StyledChip
                onClick={() => {
                  this.setState({ globalExportSetting: "withinProject" });
                  handleExportAll(true);
                }}
                icon={<WorkIcon />}
                label=" Hela projekt"
                size="medium"
                variant={`${
                  this.state.globalExportSetting === "withinProject"
                    ? "default"
                    : "outlined"
                }`}
              />
            </Box>
          </Grid>
          <Grid item xs={12} style={{ marginTop: "10px" }}>
            <DivProductList>
              {projects.map((project) => {
                return (
                  <GridListItemContainer
                    key={project.id}
                    container
                    alignContent="center"
                  >
                    <Grid item xs={12}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography
                          noWrap
                          variant="body1"
                          style={{ fontWeight: 500 }}
                        >
                          {project.name}
                        </Typography>
                        {exportPerProject === true && (
                          <IconButton
                            onClick={(e) => {
                              this.setState({
                                anchorEl: e.currentTarget,
                                activeProject: project,
                              });
                            }}
                            size="small"
                            aria-label="Visa projekt export val."
                          >
                            <MoreVertIcon />
                          </IconButton>
                        )}
                      </Box>
                      {project.id === this.state.activeProject?.id && (
                        <Paper elevation={0}>
                          <Menu
                            id="choice-menu"
                            autoFocus={false}
                            anchorEl={anchorEl}
                            getcontentanchorel={null}
                            anchorOrigin={{
                              vertical: "bottom",
                              horizontal: "right",
                            }}
                            transformOrigin={{
                              vertical: "top",
                              horizontal: "center",
                            }}
                            open={Boolean(anchorEl)}
                            onClose={() =>
                              this.setState({
                                anchorEl: undefined,
                              })
                            }
                          >
                            <MenuItem
                              onClick={() => {
                                handleToggleProjectExport(
                                  this.state.activeProject.id,
                                  false
                                );
                                this.setState({
                                  anchorEl: undefined,
                                  globalExportSetting: undefined,
                                });
                              }}
                            >
                              <Box display="flex" gridColumnGap={"8px"}>
                                <Crop32Icon />
                                <Typography>{`Inom markering (${this.state.activeProject?.numBoreHolesSelected})`}</Typography>
                              </Box>
                            </MenuItem>
                            <MenuItem
                              onClick={() => {
                                handleToggleProjectExport(
                                  this.state.activeProject.id,
                                  true
                                );
                                this.setState({
                                  anchorEl: undefined,
                                  globalExportSetting: undefined,
                                });
                              }}
                            >
                              <Box display="flex" gridColumnGap={"8px"}>
                                <WorkIcon />
                                <Typography>{`Hela projekt (${this.state.activeProject?.numBoreHolesTotal})`}</Typography>
                              </Box>
                            </MenuItem>
                          </Menu>
                        </Paper>
                      )}
                    </Grid>
                    <Grid item xs={9} md={10}>
                      <Typography>{`Id: ${project.id}`}</Typography>
                    </Grid>
                    <Grid item xs={3} md={2} style={{ paddingRight: "5%" }}>
                      <Box display="flex" gridColumnGap="5%">
                        {this.renderProjectDetails(project)}
                      </Box>
                    </Grid>
                  </GridListItemContainer>
                );
              })}
            </DivProductList>
          </Grid>
        </Grid>
      );
    } else {
      return (
        <div>
          <Typography color="error">
            Inget resultat. Gå tillbaka och markera ett nytt område.
          </Typography>
        </div>
      );
    }
  }
}
export default ProductList;
