import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Button from "@material-ui/core/Button";
import BugReportIcon from "@material-ui/icons/BugReport";
import { Box, Select, MenuItem, Slider, Typography } from "@material-ui/core";
import { getRenderPixel } from "ol/render";

// Define JSS styles that will be used in this component.
// Example below utilizes the very powerful "theme" object
// that gives access to some constants, see: https://material-ui.com/customization/default-theme/
const styles = (theme) => ({
  buttonWithBottomMargin: {
    marginBottom: theme.spacing(2),
  },
  drawerContent: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
});

class DummyView extends React.PureComponent {
  // Initialize state - this is the correct way of doing it nowadays.
  state = {
    activeCompareLayer: "-100",
    counter: 0,
    slider: 50,
  };

  // propTypes and defaultProps are static properties, declared
  // as high as possible within the component code. They should
  // be immediately visible to other devs reading the file,
  // since they serve as documentation.
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
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;

    this.globalObserver.publish("core.addDrawerToggleButton", {
      value: "dummy",
      ButtonIcon: BugReportIcon,
      caption: "Dummyverktyg",
      drawerTitle: "Dummyverktyg",
      order: 100,
      renderDrawerContent: this.renderDrawerContent,
    });
  }

  // componentDidMount() {
  //   const baseLayers = this.getBaseLayers();
  //   console.log("baseLayers: ", baseLayers);
  //   const l = this.props.app.map
  //     .getLayers()
  //     .getArray()
  //     .filter((l) => l.get("name") === "72")[0];

  //   l.setVisible(true);

  //   l.on("prerender", (event) => {
  //     var ctx = event.context;
  //     var mapSize = this.props.app.map.getSize();
  //     var width = mapSize[0] * (this.state.slider / 100);
  //     var tl = getRenderPixel(event, [width, 0]);
  //     var tr = getRenderPixel(event, [mapSize[0], 0]);
  //     var bl = getRenderPixel(event, [width, mapSize[1]]);
  //     var br = getRenderPixel(event, mapSize);

  //     ctx.save();
  //     ctx.beginPath();
  //     ctx.moveTo(tl[0], tl[1]);
  //     ctx.lineTo(bl[0], bl[1]);
  //     ctx.lineTo(br[0], br[1]);
  //     ctx.lineTo(tr[0], tr[1]);
  //     ctx.closePath();
  //     ctx.clip();
  //   });

  //   l.on("postrender", (event) => {
  //     var ctx = event.context;
  //     ctx.restore();
  //   });
  // }

  renderDrawerContent = () => {
    const { classes } = this.props;
    return (
      <Box className={classes.drawerContent}>
        <Typography variant="h6">Dummy</Typography>
        <Typography variant="body1">
          Dummy har anropat globalObserver och bett om att få lägga till en
          knapp uppe i headern. När du trycker på knappen visas det här
          innehållet i sidopanelen.
        </Typography>
        <Typography variant="body1">
          Lorem ipsum dolor sit amet, sit enim montes aliquam. Cras non lorem,
          rhoncus condimentum, irure et ante. Pulvinar suscipit odio ante, et
          tellus a enim, wisi ipsum, vel rhoncus eget faucibus varius, luctus
          turpis nibh vel odio nulla pede. Consectetuer commodo at, ante risus
          amet nec sollicitudin cras, rhoncus diam pharetra in, tristique leo
          dictumst ullamcorper proin libero, et turpis laoreet nonummy
          adipiscing quam mollis. Sed erat cum magna id, iaculis sed porta,
          euismod nisl consequat leo in lectus, suspendisse tincidunt vehicula
          pellentesque eget in justo. Mattis dolor nec, sapien magnis ultricies
          maecenas per urna aperiam, justo aliquam at ut, ut urna quam
          parturient pharetra feugiat, est sit. Sollicitudin cum tempor.
          Suscipit eros aenean viverra velit. Interdum varius vitae, lacus
          sapien ut ipsum et ut. Lobortis pulvinar a. Blandit suspendisse proin
          integer. Aliquam sit, consectetuer sed molestie mauris inceptos. Et
          sit semper semper, ante donec dictum. Est rhoncus sed vestibulum
          vestibulum, sociis eleifend torquent eros, aliquam nulla et mattis
          nulla augue leo, pellentesque cras ultrices dignissim sed, id nunc
          vitae nulla consectetuer. Sed nam tincidunt, aliquam elit justo netus,
          vestibulum nulla nibh sagittis nulla, id urna. Lorem libero mauris
          sit. Amet eu id maecenas. Itaque nulla ut interdum nibh. Arcu
          vulputate adipiscing donec nunc, cras id sodales sit. Nulla sapien sed
          sagittis scelerisque, condimentum sollicitudin nibh donec scelerisque
          conubia, adipiscing dictumst laoreet id, eget augue eu accumsan. Justo
          proin sit tempor, lacus vestibulum non aliquam et id est, odio neque
          elit vestibulum dapibus elit, eros et sapien malesuada vehicula. Neque
          facilisis, suspendisse wisi in. Ultrices a nam morbi, faucibus ligula
          tortor, dui consectetuer non accumsan, suspendisse semper lacinia
          tincidunt sed sem voluptatem, in non. Justo amet sapien lacus id ipsum
          orci, sed integer sem at lacinia dui pede, aliquam ridiculus vel
          faucibus vivamus sed laoreet, lectus neque vitae felis. Tellus nisl
          tristique, in rutrum viverra sollicitudin nunc mus, aenean in, vel vel
          sed, massa ac deserunt volutpat mollis maecenas lacinia. Commodo
          lectus at sapien nascetur pede aliquam, mauris sodales dolor sit
          vitae, egestas sed lobortis lacinia, a nisl molestie in quis orci.
          Velit nec. Cubilia nulla wisi, suspendisse justo lacus consectetuer
          integer vestibulum, dui proin vulputate metus, etiam sollicitudin
          pellentesque sapien. Ipsum risus, est ligula pede mauris. Arcu fusce
          id ac, lacus tempus cubilia, enim auctor aliquam arcu nibh. Nibh
          mauris, aenean neque facilisis, enim justo purus nullam et id, donec
          vehicula. Vitae tellus quis enim dui auctor.
        </Typography>
      </Box>
    );
  };

  buttonClick = () => {
    // We have access to plugin's model:
    console.log("Dummy can access model's map:", this.model.getMap());

    // We have access to plugin's observer. Below we publish an event that the parent
    // component is listing to, see dummy.js for how to subscribe to events.
    this.localObserver.publish(
      "dummyEvent",
      "This has been sent from DummyView using the Observer"
    );

    // And we can of course access this component's state
    this.setState((prevState) => ({
      counter: prevState.counter + 1,
    }));
  };

  // Event handler for a button that shows a global info message when clicked
  showDefaultSnackbar = () => {
    this.props.enqueueSnackbar("Yay, a nice message with default styling.");
  };

  showIntroduction = () => {
    // Show the introduction guide, see components/Introduction.js
    this.globalObserver.publish("core.showIntroduction");
  };

  // A more complicate snackbar example, this one with an action button and persistent snackbar
  showAdvancedSnackbar = () => {
    const action = (key) => (
      <>
        <Button
          onClick={() => {
            alert(`I belong to snackbar with key ${key}`);
          }}
        >
          {"Alert"}
        </Button>
        <Button
          onClick={() => {
            this.props.closeSnackbar(key);
          }}
        >
          {"Dismiss"}
        </Button>
      </>
    );

    this.props.enqueueSnackbar("Oops, a message with error styling!", {
      variant: "error",
      persist: true,
      action,
    });
  };

  // Make it possible to programatically update Window's title/color
  handleClickOnRandomTitle = () => {
    // We use the updateCustomProp mehtod which is passed down from parent
    // component as a prop to this View.
    this.props.updateCustomProp("title", new Date().getTime().toString()); // Generate a timestamp
    this.props.updateCustomProp(
      "color",
      "#" + ((Math.random() * 0xffffff) << 0).toString(16) // Generate a custom HEX color string
    );
  };

  getBaseLayers() {
    return [
      { name: "-100", caption: "None" },
      ...this.props.app.map
        .getLayers()
        .getArray()
        .filter((l) => l.getProperties().layerInfo?.layerType === "base")
        .map((l) => l.getProperties()),
    ];
  }

  renderCompareLayerOptions = () => {
    return this.getBaseLayers().map((l, i) => (
      <MenuItem value={l.name} key={i}>
        {l.caption}
      </MenuItem>
    ));
  };

  prerenderHandler = (event) => {
    console.log("event: ", event);
    const ctx = event.context;
    const mapSize = this.props.app.map.getSize();
    const width = mapSize[0] * (this.state.slider / 100);
    const tl = getRenderPixel(event, [width, 0]);
    const tr = getRenderPixel(event, [mapSize[0], 0]);
    const bl = getRenderPixel(event, [width, mapSize[1]]);
    const br = getRenderPixel(event, mapSize);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(tl[0], tl[1]);
    ctx.lineTo(bl[0], bl[1]);
    ctx.lineTo(br[0], br[1]);
    ctx.lineTo(tr[0], tr[1]);
    ctx.closePath();
    ctx.clip();
  };

  postrenderHandler = (event) => {
    console.log("event: ", event);
    const ctx = event.context;
    ctx.restore();
  };

  handleCompareLayerChange = (e) => {
    this.setState({ activeCompareLayer: e.target.value }, () => {
      const mapLayers = this.props.app.map.getLayers().getArray();
      // Grab previous compare layer and hide them
      mapLayers
        .filter((l) => l.get("isActiveCompareLayer") === true)
        .forEach((l) => {
          l.set("visible", false, true);
          l.set("isActiveCompareLayer", false);
          l.un("prerender", this.prerenderHandler);
          l.un("postrender", this.postrenderHandler);
          console.log("l for deactivation: ", l);
        });

      if (e.target.value === "-100") {
        // Special value "None" was selected - deactive comparer functionality
      } else {
        // Activate selected later as comparer
        const l = mapLayers.filter((l) => l.get("name") === e.target.value)[0];

        l.set("visible", true, true);
        l.set("isActiveCompareLayer", true);

        l.on("prerender", this.prerenderHandler);
        l.on("postrender", this.postrenderHandler);
      }
    });
  };

  handleSliderChange = (event, newValue) => {
    this.setState({ slider: newValue }, () => {
      this.props.app.map.render();
    });
  };

  render() {
    const { classes } = this.props;
    return (
      <>
        {this.state.activeCompareLayer !== "-100" && (
          <Slider
            value={this.state.slider}
            onChange={this.handleSliderChange}
            aria-labelledby="continuous-slider"
          />
        )}
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={this.state.activeCompareLayer}
          onChange={this.handleCompareLayerChange}
        >
          {this.renderCompareLayerOptions()}
        </Select>
        <Button
          className={classes.buttonWithBottomMargin}
          variant="contained"
          fullWidth={true}
          // onChange={(e) => { console.log(e) }}
          // ^ Don't do this. Closures here are inefficient. Use the below:
          onClick={this.buttonClick}
        >
          {this.state.test ||
            `Clicked ${this.state.counter} ${
              this.state.counter === 1 ? "time" : "times"
            }`}
        </Button>
        <Button
          className={classes.buttonWithBottomMargin}
          variant="contained"
          fullWidth={true}
          onClick={this.showDefaultSnackbar}
        >
          Show default snackbar
        </Button>
        <Button
          className={classes.buttonWithBottomMargin}
          variant="contained"
          fullWidth={true}
          onClick={this.showAdvancedSnackbar}
        >
          Show error snackbar
        </Button>
        <Button
          className={classes.buttonWithBottomMargin}
          variant="contained"
          fullWidth={true}
          color="primary"
          onClick={this.showIntroduction}
        >
          Show Hajk Introduction
        </Button>
        <Button
          className={classes.buttonWithBottomMargin}
          variant="contained"
          fullWidth={true}
          onClick={this.handleClickOnRandomTitle}
        >
          Set random title and color
        </Button>
      </>
    );
  }
}

// Exporting like this adds some props to DummyView.
// withStyles will add a 'classes' prop, while withSnackbar
// adds to functions (enqueueSnackbar() and closeSnackbar())
// that can be used throughout the Component.
export default withStyles(styles)(withSnackbar(DummyView));
