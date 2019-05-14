import React from "react";
import { withStyles } from "@material-ui/core/styles";
import marked from "marked";
import IconButton from "@material-ui/core/IconButton";
import ArrowLeftIcon from "@material-ui/icons/ArrowLeft";
import ArrowRightIcon from "@material-ui/icons/ArrowRight";
import Typography from "@material-ui/core/Typography";

const styles = theme => ({
  windowSection: {
    display: "flex",
    flexFlow: "column",
    height: "100%"
  },
  featureList: {
    flex: 1,
    overflow: "auto"
  },
  textContent: {
    flex: 1
  },
  toggler: {
    display: "flex"
  },
  togglerText: {
    flex: 1,
    textAlign: "center",
    lineHeight: "3rem"
  },
  closeButton: {
    position: "absolute",
    top: "5px",
    right: "5px",
    cursor: "pointer",
    padding: "5px"
  },
  caption: {
    marginBottom: "5px",
    fontWeight: 500
  }
});

class FeatureInfo extends React.PureComponent {
  state = {
    selectedIndex: 1,
    visible: false
  };

  constructor(props) {
    super(props);
    marked.setOptions({
      sanitize: false,
      xhtml: true
    });
    this.classes = this.props.classes;
  }

  componentDidMount() {
    var left = document.getElementById("step-left");
    var right = document.getElementById("step-right");
    if (left && right) {
      left.onclick = e => {
        this.changeSelectedIndex(-1);
      };
      right.onclick = e => {
        this.changeSelectedIndex(1);
      };
    }
  }

  valueFromJson(str) {
    if (typeof str !== "string") return false;
    const jsonStart = /^\[|^\{(?!\{)/;
    const jsonEnds = {
      "[": /]$/,
      "{": /}$/
    };
    const start = str.match(jsonStart);
    const jsonLike = start && jsonEnds[start[0]].test(str);
    var result = false;

    if (jsonLike) {
      try {
        result = JSON.parse(str);
      } catch (ex) {
        result = false;
      }
    } else {
      result = false;
    }

    return result;
  }

  table(data) {
    return Object.keys(data).map((key, i) => {
      if (typeof data[key] !== "object") {
        return (
          <div key={i}>
            <strong>{key}</strong>: <span>{data[key]}</span>
          </div>
        );
      } else {
        return null;
      }
    });
  }

  parse(markdown, properties) {
    markdown = markdown.replace(/export:/g, "");
    if (markdown && typeof markdown === "string") {
      (markdown.match(/{(.*?)}/g) || []).forEach(property => {
        function lookup(o, s) {
          s = s
            .replace("{", "")
            .replace("}", "")
            .split(".");
          switch (s.length) {
            case 1:
              return o[s[0]] || "";
            case 2:
              return o[s[0]][s[1]] || "";
            case 3:
              return o[s[0]][s[1]][s[2]] || "";
            default:
              return "";
          }
        }
        markdown = markdown.replace(property, lookup(properties, property));
      });
    }
    return {
      __html: marked(markdown)
    };
  }

  changeSelectedIndex(amount) {
    var eot = false;
    if (amount > 0 && this.props.features.length === this.state.selectedIndex) {
      eot = true;
    } else if (amount < 0 && this.state.selectedIndex === 1) {
      eot = true;
    }
    if (!eot) {
      this.setState(
        {
          selectedIndex: this.state.selectedIndex + amount
        },
        () => {
          this.props.onDisplay(
            this.props.features[this.state.selectedIndex - 1]
          );
        }
      );
    }
  }

  html(features) {
    const { classes } = this.props;

    if (!features) return "";

    var visibleStyle = currentIndex => {
      var displayValue =
        this.state.selectedIndex === currentIndex + 1 ? "flex" : "none";
      return {
        display: displayValue,
        flexFlow: "column",
        height: "100%"
      };
    };
    var toggler = null;
    if (features.length > 1) {
      toggler = (
        <header className={classes.toggler}>
          <IconButton aria-label="Previous" color="primary" id="step-left">
            <ArrowLeftIcon />
          </IconButton>
          <Typography variant="button" className={classes.togglerText}>
            {this.state.selectedIndex} av {features.length}
          </Typography>
          <IconButton aria-label="Next" color="primary" id="step-right">
            <ArrowRightIcon />
          </IconButton>
        </header>
      );
    }

    var featureList = features.map((feature, i) => {
      if (i === 0) this.props.onDisplay(feature);

      var markdown =
        feature.layer.get("layerInfo") &&
        feature.layer.get("layerInfo").information;

      var caption =
        feature.layer.get("layerInfo") &&
        feature.layer.get("layerInfo").caption;
      var layer;

      //Problem with geojson returned from AGS - Missing id on feature - how to handle?
      if (feature.layer.layersInfo && feature.getId()) {
        layer = Object.keys(feature.layer.layersInfo).find(id => {
          var fid = feature.getId().split(".")[0];
          var layerId = id.split(":").length === 2 ? id.split(":")[1] : id;
          return fid === layerId;
        });
      }

      if (
        layer &&
        feature.layer.layersInfo &&
        feature.layer.layersInfo[layer] &&
        feature.layer.layersInfo[layer].infobox
      ) {
        markdown = feature.layer.layersInfo[layer].infobox;
      }

      var properties = feature.getProperties();

      Object.keys(properties).forEach(property => {
        var jsonData = this.valueFromJson(properties[property]);
        if (jsonData) {
          delete properties[property];
          properties = { ...properties, ...jsonData };
        }
      });

      feature.setProperties(properties);

      var value = markdown
        ? this.parse(markdown, properties)
        : this.table(properties);

      if (markdown) {
        return (
          <div key={i} style={visibleStyle(i)}>
            <div className={classes.caption}>{caption}</div>
            <div
              className={classes.textContent}
              dangerouslySetInnerHTML={value}
            />
          </div>
        );
      } else {
        return (
          <div key={i} style={visibleStyle(i)}>
            <div className={classes.caption}>{caption}</div>
            <div className={classes.textContent}>{value}</div>
          </div>
        );
      }
    });

    return (
      <section className={classes.windowSection}>
        {toggler}
        <section className={classes.featureList}>{featureList}</section>
      </section>
    );
  }

  render() {
    const { features } = this.props;
    return this.html(features);
  }
}

export default withStyles(styles)(FeatureInfo);
