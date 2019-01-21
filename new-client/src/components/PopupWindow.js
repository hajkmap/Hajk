import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import marked from "marked";
import "./Popup.css";
import IconButton from "@material-ui/core/IconButton";
import ArrowLeftIcon from "@material-ui/icons/ArrowLeft";
import ArrowRightIcon from "@material-ui/icons/ArrowRight";
import Window from "./Window.js";
import Panel from "./Panel.js";

const styles = theme => ({
  floatLeft: {
    float: "left"
  },
  floatRight: {
    float: "right"
  },
  content: {
    "& img": {
      maxWidth: "100%"
    }
  }
});

class Popup extends React.Component {
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
    this.features = [];
  }

  componentDidUpdate() {
    var left = document.getElementById("step-left");
    var right = document.getElementById("step-right");

    if (left && right) {
      left.onclick = () => {
        this.changeSelectedIndex(-1);
      };
      right.onclick = () => {
        this.changeSelectedIndex(1);
      };
    }
  }

  table(data) {
    return Object.keys(data).map((key, i) => {
      if (typeof data[key] !== "object") {
        return (
          <div key={i}>
            <span>{key}</span>: <span>{data[key]}</span>
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
    if (
      amount > 0 &&
      this.props.mapClickDataResult.features.length === this.state.selectedIndex
    ) {
      eot = true;
    } else if (amount < 0 && this.state.selectedIndex === 1) {
      eot = true;
    }
    if (!eot) {
      this.setState({
        selectedIndex: this.state.selectedIndex + amount
      });
    }
  }

  highlight(feature) {
    this.props.onDisplay(feature);
  }

  renderValues() {
    if (Array.isArray(this.state.values)) {
      return (
        <div>
          <div>
            {this.state.values[0].external_id} -
            {this.state.values[0].point_name}
          </div>
          <table>
            <thead>
              <tr>
                <th>{this.state.values[0].parameter}</th>
                <th>tidpunkt</th>
              </tr>
            </thead>
            <tbody>
              {this.state.values.map((v, i) => {
                return (
                  <tr key={i}>
                    <td>{v.value}</td>
                    <td>{v.datetime}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    } else {
      return null;
    }
  }

  html(features) {
    const { classes } = this.props;
    if (features.length === 0) return "";

    var visibleStyle = currentIndex => {
      var displayValue =
        this.state.selectedIndex === currentIndex + 1 ? "block" : "none";
      return {
        display: displayValue
      };
    };
    var toggler = null;
    if (features.length > 1) {
      toggler = (
        <div className="toggle">
          <IconButton
            className={this.classes.floatLeft}
            aria-label="Previous"
            color="primary"
            id="step-left"
          >
            <ArrowLeftIcon />
          </IconButton>
          <span className="toggle-text">
            {this.state.selectedIndex} av {features.length}
          </span>
          <IconButton
            className={this.classes.floatRight}
            aria-label="Next"
            color="primary"
            id="step-right"
          >
            <ArrowRightIcon />
          </IconButton>
        </div>
      );
    }

    this.highlight();

    var featureList = features.map((feature, i) => {
      if (!this.state.data) {
        fetch(
          `http://localhost:53855/api/tests/${feature.getProperties().point_id}`
        ).then(rsp => {
          rsp.json().then(data => {
            this.setState({
              data: data,
              feature: feature
            });
          });
        });
      }

      this.highlight(feature);

      var markdown =
        feature.layer.get("layerInfo") &&
        feature.layer.get("layerInfo").information;

      var layer;

      if (feature.layer.layersInfo) {
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

      var value = markdown
        ? this.parse(markdown, feature.getProperties())
        : this.table(feature.getProperties());

      if (markdown) {
        return (
          <div
            key={i}
            className="markdown-content"
            dangerouslySetInnerHTML={value}
            style={visibleStyle(i)}
          />
        );
      } else {
        return (
          <div key={i} style={visibleStyle(i)}>
            {value}
          </div>
        );
      }
    });

    return (
      <div>
        {toggler}
        <div className={classes.content}>{featureList}</div>
        <div>
          <div>
            Hej
            {this.state.data
              ? this.state.data.map((v, i) => {
                  return (
                    <div
                      key={i}
                      onClick={() => {
                        fetch(
                          `http://localhost:53855/api/values/${
                            this.state.feature.getProperties().point_id
                          }?parameterType=${v}`
                        ).then(rsp => {
                          rsp.json().then(values => {
                            this.setState({
                              values: values
                            });
                          });
                        });
                      }}
                    >
                      {v}
                    </div>
                  );
                })
              : null}
          </div>
          {createPortal(
            <Panel
              title="Mätserie"
              open={Array.isArray(this.state.values)}
              position="left"
              onClose={() => {
                this.setState({
                  values: null
                });
              }}
            >
              {this.renderValues()}
            </Panel>,
            document.getElementById("map-overlay")
          )}
        </div>
      </div>
    );
  }

  closePanel = () => {
    this.features = [];
    this.props.onClose();
  };

  render() {
    if (
      this.props.mapClickDataResult &&
      this.props.mapClickDataResult.features !== undefined
    ) {
      this.features = this.props.mapClickDataResult.features;
    }
    return (
      <Window
        title={"Information"}
        onClose={this.closePanel}
        open={this.features.length > 0}
        height={400}
        width={300}
        placement="bottom-right"
      >
        <div>{this.html(this.features)}</div>
      </Window>
    );
  }
}

export default withStyles(styles)(Popup);
