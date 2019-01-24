import React from "react";
import { withStyles } from "@material-ui/core/styles";
import marked from "marked";
import "./Popup.css";
import IconButton from "@material-ui/core/IconButton";
import ArrowLeftIcon from "@material-ui/icons/ArrowLeft";
import ArrowRightIcon from "@material-ui/icons/ArrowRight";
import BarChartIcon from "@material-ui/icons/BarChart";
import TableChartIcon from "@material-ui/icons/TableChart";
//import { Chart } from "react-google-charts";
import Window from "./Window.js";

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
  },
  parameterGroup: {
    cursor: "pointer",
    "&:hover": {
      textDecoration: "underline"
    }
  },
  parameter: {
    display: "flex",
    alignItems: "center",
    margin: "10px 0"
  },
  table: {
    borderCollapse: "collapse",
    "& td": {
      border: "1px solid",
      padding: "4px"
    },
    "& th": {
      borderBottom: "2px solid"
    }
  }
});

class Popup extends React.Component {
  state = {
    selectedIndex: 1,
    visible: false,
    data: [],
    parameter: "",
    values: []
  };

  constructor(props) {
    super(props);
    marked.setOptions({
      sanitize: false,
      xhtml: true
    });
    this.classes = this.props.classes;
    this.features = [];
    this.data = [];
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
    this.data = [];
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

  group(values) {
    var groups = {};
    values.forEach(value => {
      if (!groups.hasOwnProperty(value.parameter)) {
        groups[value.parameter] = [];
      }
      groups[value.parameter].push({
        value: value.value,
        datetime: value.datetime
      });
    });
    return groups;
  }

  // renderTable(parameter, parameterValues) {
  //   const { classes } = this.props;
  //   const { activeType, activeParameter } = this.state;
  //   return (
  //     <div
  //       style={{
  //         display:
  //           activeParameter === parameter && activeType === "table"
  //             ? "block"
  //             : "none"
  //       }}
  //     >
  //       <table className={classes.table}>
  //         <thead>
  //           <tr>
  //             <th>mätvärde</th>
  //             <th>tidpunkt</th>
  //           </tr>
  //         </thead>
  //         <tbody>
  //           {parameterValues.map((v, i) => {
  //             return (
  //               <tr key={i}>
  //                 <td>{v.value}</td>
  //                 <td>{v.datetime}</td>
  //               </tr>
  //             );
  //           })}
  //         </tbody>
  //       </table>
  //     </div>
  //   );
  // }

  // renderChart(parameter, parameterValues) {
  //   const { activeType, activeParameter } = this.state;
  //   var values = [];
  //   parameterValues.forEach(value => {
  //     values.push([value.datetime, value.value]);
  //   });
  //   return (
  //     <div
  //       style={{
  //         display:
  //           activeParameter === parameter && activeType === "chart"
  //             ? "block"
  //             : "none"
  //       }}
  //     >
  //       <div>
  //         <Chart
  //           chartType="LineChart"
  //           data={[["tidpunkt", "värde"], ...values]}
  //           width="100%"
  //           height="400px"
  //           legendToggle
  //         />
  //       </div>
  //     </div>
  //   );
  // }

  // renderParameterList(parameters) {
  //   const { classes } = this.props;
  //   return Object.keys(parameters).map((parameter, i) => {
  //     return (
  //       <div key={i}>
  //         <div className={classes.parameter}>
  //           <IconButton
  //             onClick={() => {
  //               this.setState({
  //                 activeParameter: parameter,
  //                 activeType: "table"
  //               });
  //             }}
  //           >
  //             <TableChartIcon />
  //           </IconButton>
  //           <IconButton
  //             onClick={() => {
  //               this.setState({
  //                 activeParameter: parameter,
  //                 activeType: "chart"
  //               });
  //             }}
  //           >
  //             <BarChartIcon />
  //           </IconButton>
  //           &nbsp;{parameter}
  //         </div>
  //         {this.renderTable(parameter, parameters[parameter])}
  //         {this.renderChart(parameter, parameters[parameter])}
  //       </div>
  //     );
  //   });
  // }

  // renderValues() {
  //   const { values } = this.state;
  //   var parameters = this.group(values);
  //   return <div>{this.renderParameterList(parameters)}</div>;
  // }

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
      // if (this.data.length === 0) {
      //   fetch(this.props.testsUrl + `${feature.getProperties().point_id}`).then(
      //     rsp => {
      //       rsp.json().then(data => {
      //         this.data = data;
      //         this.setState({
      //           data: data,
      //           feature: feature
      //         });
      //       });
      //     }
      //   );
      // }

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
        {/* <div>
          <div>
            {this.state.data.map((v, i) => {
              return (
                <div
                  className={classes.parameterGroup}
                  key={i}
                  onClick={() => {
                    fetch(
                      this.props.dataUrl +
                        `/${
                          this.state.feature.getProperties().point_id
                        }?parameterType=${v}`
                    ).then(rsp => {
                      rsp.json().then(values => {
                        values.forEach(value => {
                          value.datetime = value.datetime.split("T")[0];
                        });
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
            })}
          </div>
        </div> */}
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
      <div>
        {/* <Window
          title={"Mätdata"}
          onClose={() => {
            this.setState({
              values: []
            });
          }}
          open={this.state.values.length > 0}
          height={400}
          width={500}
          left={40}
          top={-20}
        >
          <div>{this.renderValues()}</div>
        </Window> */}
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
      </div>
    );
  }
}

export default withStyles(styles)(Popup);
