import React from "react";
import { withSnackbar } from "notistack";
import { styled } from "@mui/material/styles";
import { Button, Typography, Grid, Link } from "@mui/material";
import IconWarning from "@mui/icons-material/Warning";
import CallMadeIcon from "@mui/icons-material/CallMade";
import InfoIcon from "@mui/icons-material/Info";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import RadioButtonChecked from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUnchecked from "@mui/icons-material/RadioButtonUnchecked";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import CloseIcon from "@mui/icons-material/Close";
import TableViewIcon from "@mui/icons-material/TableView";
import LayerGroupItem from "./LayerGroupItem.js";
import LayerSettings from "./LayerSettings.js";
import DownloadLink from "./DownloadLink.js";
import HajkToolTip from "components/HajkToolTip";

const LayerItemContainer = styled("div")(({ theme }) => ({
  paddingLeft: "0",
  borderBottom: `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
}));

const LayerItemWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  marginTop: "0",
}));

const LayerTogglerButtonWrapper = styled("div")(() => ({
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
  float: "left",
  marginRight: "5px",
}));

const InfoTextContainer = styled("div")(({ theme }) => ({
  margin: "10px 45px",
}));

const Caption = styled(Typography)(({ theme }) => ({
  cursor: "pointer",
  fontSize: theme.typography.pxToRem(15),
}));

const LegendIcon = styled("img")(({ theme }) => ({
  width: theme.typography.pxToRem(18),
  height: theme.typography.pxToRem(18),
  marginRight: "5px",
}));

const LayerButtonsContainer = styled("div")(() => ({
  display: "flex",
  alignItems: "center",
}));

const LayerButtonWrapper = styled("div")(() => ({
  display: "flex",
  alignItems: "center",
  width: 35,
  height: 35,
  cursor: "pointer",
}));

const StyledList = styled("ul")(() => ({
  padding: 0,
  margin: 0,
  listStyle: "none",
}));

class LayerItem extends React.PureComponent {
  constructor(props) {
    super(props);
    const { layer } = props;
    const layerInfo = layer.get("layerInfo");

    this.isBackgroundLayer = layerInfo.layerType === "base";
    this.rotateMap = layer.get("rotateMap");
    this.caption = layerInfo.caption;
    this.name = layer.get("name");
    this.legend = layerInfo.legend;
    this.legendIcon = layerInfo.legendIcon;
    this.infoTitle = layerInfo.infoTitle;
    this.infoText = layerInfo.infoText;
    this.infoUrl = layerInfo.infoUrl;
    this.infoUrlText = layerInfo.infoUrlText;
    this.infoOpenDataLink = layerInfo.infoOpenDataLink;
    this.infoOwner = layerInfo.infoOwner;
    this.localObserver = layer.localObserver;
    this.showAttributeTableButton = layerInfo.showAttributeTableButton || false;
    this.usesMinMaxZoom = this.layerUsesMinMaxZoom();
    this.minMaxZoomAlertOnToggleOnly = layer.get("minMaxZoomAlertOnToggleOnly");

    this.state = {
      visible: layer.get("visible"),
      status: "ok",
      zoomVisible: true,
      open: false,
      toggleSettings: false,
      infoVisible: false,
    };

    // Subscribe to events sent when another background layer is clicked and
    // disable all other layers to implement the RadioButton behaviour
    if (this.isBackgroundLayer) {
      layer.localObserver.subscribe("backgroundLayerChanged", (activeLayer) => {
        if (activeLayer !== this.name) {
          if (!layer.isFakeMapLayer) {
            layer.setVisible(false);
          }
          this.setState({
            visible: false,
          });
        }
      });
    }
  }

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount() {
    // Setup some listeners triggered whenever the layer visibility changes:
    this.props.layer.on?.("change:visible", (e) => {
      // Grab the new value…
      const visible = !e.oldValue;

      // …and update the radio button state.
      this.setState({
        visible,
      });

      this.listenToZoomChange(visible);

      // Also, check if we need to auto-rotate the map
      if (visible === true && this.isBackgroundLayer) {
        this.changeRotation();
      }
    });

    // Check if we should display a zoom warning at start
    if (this.state.visible) {
      this.triggerZoomCheck(null, this.state.visible);
    }

    // Check if we should auto-rotate the map at start
    if (this.state.visible === true && this.isBackgroundLayer === true) {
      this.changeRotation();
    }

    this.listenToZoomChange(this.state.visible);

    // Set load status by subscribing to a global event. Expect ID (int) of layer
    // and status (string "ok"|"loaderror"). Also, once status was set to "loaderror",
    // don't change it back to "ok": we'll get a response for each tile, so most of
    // the tiles might be "ok", but if only one of the tiles has "loaderror", we
    // consider that the layer has failed loading and want to inform the user.
    this.props.app.globalObserver.subscribe(
      "layerswitcher.wmsLayerLoadStatus",
      (d) => {
        this.state.status !== "loaderror" &&
          this.name === d.id &&
          this.setState({
            status: d.status,
          });
      }
    );
  }

  changeRotation() {
    // Retrieve the current rotation in a standardized manner
    const newRotation = this.rotateMap?.toLowerCase();

    // Determine rotation in radians
    if (["n", "e", "s", "w"].includes(newRotation)) {
      let radians = 0;
      switch (newRotation) {
        case "n":
          radians = 0;
          break;
        case "e":
          radians = -(Math.PI / 2);
          break;
        case "s":
          radians = Math.PI;
          break;
        case "w":
          radians = Math.PI / 2;
          break;
        default:
          break;
      }

      // Grab the OL View
      const View = this.props.app.map.getView();

      // Rotate the map if current rotation differs from the new rotation
      if (View.getRotation() !== radians) {
        View.animate({
          rotation: radians,
        });
      }
    }
  }

  layerUsesMinMaxZoom() {
    const lprops = this.props.layer.getProperties();
    const maxZ = lprops.maxZoom ?? 0;
    const minZ = lprops.minZoom ?? 0;
    // When reading min/max-Zoom from layer, its not consistent with the
    // initial values from config. Suddenly Infinity is used.
    return (maxZ > 0 && maxZ < Infinity) || (minZ > 0 && minZ < Infinity);
  }

  zoomEndHandler = (e) => {
    const zoom = this.props.model.olMap.getView().getZoom();
    const lprops = this.props.layer.getProperties();
    const layerIsZoomVisible = zoom > lprops.minZoom && zoom <= lprops.maxZoom;

    let showSnack = false;

    if (this.minMaxZoomAlertOnToggleOnly === true) {
      if (!this.state.visible && !layerIsZoomVisible && e?.type === "click") {
        showSnack = true;
      }
    } else {
      if (
        !layerIsZoomVisible &&
        (this.state.zoomVisible || !this.state.visible)
      ) {
        showSnack = true;
      }
    }

    if (showSnack === true) {
      this.showZoomSnack();
    }

    this.setState({
      zoomVisible: layerIsZoomVisible,
    });
    return layerIsZoomVisible;
  };

  listenToZoomChange(bListen) {
    if (!this.usesMinMaxZoom) return;

    const eventName = "core.zoomEnd";
    if (bListen && !this.zoomEndListener) {
      this.zoomEndListener = this.props.app.globalObserver.subscribe(
        eventName,
        this.zoomEndHandler
      );
    } else {
      if (this.zoomEndListener) {
        this.props.app.globalObserver.unsubscribe(
          eventName,
          this.zoomEndListener
        );
        this.zoomEndListener = null;
      }
    }
  }

  showZoomSnack() {
    if (this.zoomWarningSnack) return;

    // We're fetching layerInfo object from the layer object.
    const layerInfo = this.props.layer.get("layerInfo");

    // If layerInfo is defined, we get layersInfo from it.
    // Otherwise, layersInfo is set as undefined.
    const layersInfo = layerInfo ? layerInfo.layersInfo : undefined;

    // If the layer is a LayerGroupItem (meaning it contains more than one object in the "layersInfo" array),
    // then no message should be displayed.
    // Here we also ensure that layersInfo is defined and contains more than one layer
    // before trying to access its keys. This prevents a TypeError when layersInfo
    // is undefined.
    if (layersInfo && Object.keys(layersInfo).length > 1) {
      return;
    }

    this.zoomWarningSnack = this.props.enqueueSnackbar(
      `Lagret "${this.caption}"  är inte synligt vid aktuell zoomnivå.`,
      {
        variant: "warning",
        preventDuplicate: true,
        onClose: () => {
          this.zoomWarningSnack = null;
        },
      }
    );
  }

  triggerZoomCheck(e, visible) {
    if (!this.usesMinMaxZoom) return;

    this.zoomEndHandler(e);

    if (visible === false) {
      if (!this.zoomWarningSnack) return;
      this.props.closeSnackbar(this.zoomWarningSnack);
      this.zoomWarningSnack = null;
    }
  }

  /**
   * Toggle visibility of this layer item.
   * Also, if layer is being hidden, reset "status" (if layer loading failed,
   * "status" is "loaderror", and it should be reset if user unchecks layer).
   * @instance
   */
  toggleVisible = (e) => {
    const layer = this.props.layer;
    if (this.isBackgroundLayer) {
      document.getElementById("map").style.backgroundColor = "#FFF"; // sets the default background color to white
      if (layer.isFakeMapLayer) {
        switch (this.name) {
          case "-2":
            document.getElementById("map").style.backgroundColor = "#000";
            break;
          case "-1":
          default:
            document.getElementById("map").style.backgroundColor = "#FFF";
            break;
        }
      } else {
        layer.setVisible(true);
      }
      this.setState({ visible: true });
      // Publish event to ensure all other background layers are disabled
      layer.localObserver.publish("backgroundLayerChanged", this.name);
    } else {
      const visible = !this.state.visible;
      this.setState({
        visible,
      });
      this.props.layer.setVisible(visible);
      this.triggerZoomCheck(e, visible);
    }
  };

  /**
   * Render the load information component.
   * @instance
   * @return {external:ReactElement}
   */
  renderStatusButton() {
    return (
      this.state.status === "loaderror" && (
        <HajkToolTip title="Lagret kunde inte laddas in. Kartservern svarar inte.">
          <LayerButtonWrapper>
            <IconWarning />
          </LayerButtonWrapper>
        </HajkToolTip>
      )
    );
  }

  renderInfoButton = () => {
    return this.isInfoEmpty() ? null : (
      <HajkToolTip title="Mer information om lagret">
        <LayerButtonWrapper>
          {this.state.infoVisible ? (
            <RemoveCircleIcon onClick={this.toggleInfo} />
          ) : (
            <InfoIcon
              onClick={this.toggleInfo}
              sx={{
                boxShadow: this.state.infoVisible
                  ? "rgb(204, 204, 204) 2px 3px 1px"
                  : "inherit",
                borderRadius: "100%",
              }}
            />
          )}
        </LayerButtonWrapper>
      </HajkToolTip>
    );
  };

  renderMoreButton = () => {
    return (
      <HajkToolTip title="Fler inställningar">
        <LayerButtonWrapper>
          {this.state.toggleSettings ? (
            <CloseIcon onClick={this.toggleSettings} />
          ) : (
            <MoreHorizIcon onClick={this.toggleSettings} />
          )}
        </LayerButtonWrapper>
      </HajkToolTip>
    );
  };

  isInfoEmpty() {
    let chaptersWithLayer = this.findChapters(this.name, this.props.chapters);
    return !(
      this.infoCaption ||
      this.infoUrl ||
      this.infoOwner ||
      this.infoText ||
      chaptersWithLayer.length > 0
    );
  }

  openInformative = (chapter) => (e) => {
    this.props.onOpenChapter(chapter);
  };

  findChapters(id, chapters) {
    let result = [];
    if (Array.isArray(chapters)) {
      result = chapters.reduce((chaptersWithLayer, chapter) => {
        if (Array.isArray(chapter.layers)) {
          if (chapter.layers.some((layerId) => layerId === id)) {
            chaptersWithLayer = [...chaptersWithLayer, chapter];
          }
          if (chapter.chapters.length > 0) {
            chaptersWithLayer = [
              ...chaptersWithLayer,
              ...this.findChapters(id, chapter.chapters),
            ];
          }
        }
        return chaptersWithLayer;
      }, []);
    }
    return result;
  }

  renderChapterLinks(chapters) {
    if (chapters && chapters.length > 0) {
      let chaptersWithLayer = this.findChapters(this.name, chapters);
      if (chaptersWithLayer.length > 0) {
        return (
          <InfoTextContainer>
            <Typography>
              Innehåll från denna kategori finns benämnt i följande kapitel i
              översiktsplanen:
            </Typography>
            <StyledList>
              {chaptersWithLayer.map((chapter, i) => {
                return (
                  <li key={i}>
                    <Button
                      size="small"
                      onClick={this.openInformative(chapter)}
                    >
                      {chapter.header}
                      <CallMadeIcon sx={{ marginLeft: 1, fontSize: "16px" }} />
                    </Button>
                  </li>
                );
              })}
            </StyledList>
          </InfoTextContainer>
        );
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  toggle() {
    this.setState({
      open: !this.state.open,
    });
  }

  renderInfo() {
    if (this.infoText) {
      return (
        <InfoTextContainer>
          <Typography variant="subtitle2">{this.infoTitle}</Typography>
          <Typography
            variant="body2"
            dangerouslySetInnerHTML={{
              __html: this.infoText,
            }}
          />
        </InfoTextContainer>
      );
    } else {
      return null;
    }
  }

  renderMetadataLink() {
    if (this.infoUrl) {
      return (
        <InfoTextContainer>
          <Typography variant="body2" component="div" sx={{ fontWeight: 500 }}>
            <Link href={this.infoUrl} target="_blank" rel="noopener noreferrer">
              {this.infoUrlText || this.infoUrl}
            </Link>
          </Typography>
        </InfoTextContainer>
      );
    } else {
      return null;
    }
  }

  renderOpenDataLink() {
    if (this.infoOpenDataLink) {
      return (
        <InfoTextContainer>
          <Typography variant="body2" component="div" sx={{ fontWeight: 500 }}>
            <Link
              href={this.infoOpenDataLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Öppna data: {this.caption}
            </Link>
          </Typography>
        </InfoTextContainer>
      );
    } else {
      return null;
    }
  }

  renderOwner() {
    if (this.infoOwner) {
      return (
        <InfoTextContainer>
          <Typography
            variant="body2"
            dangerouslySetInnerHTML={{ __html: this.infoOwner }}
          />
        </InfoTextContainer>
      );
    } else {
      return null;
    }
  }

  renderDetails() {
    if (this.state.infoVisible) {
      return (
        <div>
          {this.renderInfo()}
          {this.renderMetadataLink()}
          {this.renderOpenDataLink()}
          {this.renderOwner()}
          <div>{this.renderChapterLinks(this.props.chapters || [])}</div>
        </div>
      );
    }
  }

  toggleSettings = () => {
    this.setState({
      toggleSettings: !this.state.toggleSettings,
    });
  };

  toggleInfo = () => {
    this.setState({
      infoVisible: !this.state.infoVisible,
    });
  };

  renderLegendIcon() {
    return <LegendIcon alt="Teckenförklaring" src={this.legendIcon} />;
  }

  getLayerToggler = () => {
    const { visible } = this.state;
    const icon = visible ? (
      this.isBackgroundLayer ? (
        <RadioButtonChecked />
      ) : (
        <CheckBoxIcon
          sx={{
            fill: (theme) =>
              !this.state.zoomVisible && this.state.visible
                ? theme.palette.warning.dark
                : "",
          }}
        />
      )
    ) : this.isBackgroundLayer ? (
      <RadioButtonUnchecked />
    ) : (
      <CheckBoxOutlineBlankIcon />
    );
    return (
      <LayerTogglerButtonWrapper className="hajk-layerswitcher-layer-toggle">
        {icon}
      </LayerTogglerButtonWrapper>
    );
  };

  #showAttributeTable = async () => {
    try {
      const url = this.props.layer.getSource().get("url").replace("wms", "wfs");
      const { LAYERS } = this.props.layer.getSource().getParams();
      // If URL already contains a query string part, we want to glue them together.
      const glue = url.includes("?") ? "&" : "?";
      const getFeatureUrl = `${url}${glue}service=WFS&version=1.0.0&request=GetFeature&typeName=${LAYERS}&maxFeatures=5000&outputFormat=application%2Fjson`;
      const describeFeatureTypeUrl = `${url}${glue}service=WFS&version=1.0.0&request=DescribeFeatureType&typeName=${LAYERS}&outputFormat=application%2Fjson`;
      // TODO: QGIS Server doesn't support JSON response for DescribeFeatureType. We must
      // fetch the result as GML2 and then parse it accordingly. This will require
      // some more work than the current approach.
      // const describeFeatureTypeUrl = `${url}${glue}service=WFS&version=1.0.0&request=DescribeFeatureType&typeName=${LAYERS}`;
      const r1 = await fetch(getFeatureUrl);
      const features = await r1.json();
      const r2 = await fetch(describeFeatureTypeUrl);
      const description = await r2.json();

      const columns = description.featureTypes
        .find((f) => f.typeName === LAYERS) // featureTypes contains an object, where typeName will be the same as the layer name we requested
        .properties.filter((c) => !c.type.toLowerCase().includes("gml")) // Best guess to try to filter out the geometry column, we don't want to show it
        .map((c) => {
          // Prepare an object that has the format of 'columns' prop for MUI's DataGrid
          return {
            field: c.name,
            headerName: c.name,
            type: c.localType === "int" ? "number" : c.localType, // DataGrid wants 'number', not 'int', see https://mui.com/components/data-grid/columns/#column-types
            flex: 1,
          };
        });

      const rows = features.features.map((r, i) => {
        return { ...r.properties, id: i };
      });

      this.props.app.globalObserver.publish("core.showAttributeTable", {
        title: `${this.caption} (${LAYERS})`,
        content: { columns, rows },
      });
    } catch (error) {
      console.error(error);
      console.log(this);
      this.props.enqueueSnackbar(
        `Serverfel: attributtabellen för lagret "${this.caption}" kunde inte visas`,
        { variant: "error" }
      );
    }
  };

  render() {
    const { layer, model, app, chapters } = this.props;

    const cqlFilterVisible =
      this.props.app.config.mapConfig.map?.cqlFilterVisible || false;

    if (!this.caption) {
      return null;
    }

    if (layer.get("layerType") === "group") {
      return (
        <LayerGroupItem
          appConfig={app.config.appConfig}
          mapConfig={app.config.mapConfig}
          layer={layer}
          model={model}
          options={this.props.options}
          chapters={chapters}
          cqlFilterVisible={cqlFilterVisible}
          onOpenChapter={(chapter) => {
            const informativeWindow = app.windows.find(
              (window) => window.type === "informative"
            );
            informativeWindow.props.custom.open(chapter);
          }}
        />
      );
    }

    return (
      <LayerItemContainer
        sx={{ marginLeft: this.isBackgroundLayer ? "0px" : "45px" }}
      >
        <LayerItemWrapper>
          <Grid
            wrap="nowrap"
            alignItems="center"
            alignContent="center"
            container
            onClick={this.toggleVisible.bind(this)}
          >
            <Grid item>{this.getLayerToggler()}</Grid>
            {this.legendIcon && this.renderLegendIcon()}
            <Caption
              sx={{ fontWeight: this.state.visible ? "bold" : "normal" }}
            >
              {this.caption}
            </Caption>
          </Grid>
          <LayerButtonsContainer className="hajk-layerswitcher-layer-buttons">
            {layer.isFakeMapLayer ? null : (
              <DownloadLink
                layer={this.props.layer}
                enableDownloadLink={
                  this.props.app.config.mapConfig.map.enableDownloadLink
                }
              />
            )}
            {this.renderStatusButton()}
            {this.renderInfoButton()}

            {this.showAttributeTableButton && (
              <HajkToolTip title="Visa lagrets attributtabell">
                <LayerButtonWrapper>
                  <TableViewIcon onClick={this.#showAttributeTable} />
                </LayerButtonWrapper>
              </HajkToolTip>
            )}
            {this.renderMoreButton()}
          </LayerButtonsContainer>
        </LayerItemWrapper>
        <div>
          {this.renderDetails()}
          {this.state.toggleSettings &&
          this.state.infoVisible &&
          !this.isInfoEmpty() ? (
            <hr />
          ) : null}
          {layer.isFakeMapLayer ? null : (
            <LayerSettings
              options={this.props.options}
              layer={layer}
              toggled={this.state.toggleSettings}
              showOpacity={true}
              showLegend={true}
              cqlFilterVisible={cqlFilterVisible}
            />
          )}
        </div>
      </LayerItemContainer>
    );
  }
}

export default withSnackbar(LayerItem);
