import React from "react";
import { withStyles } from "@material-ui/core/styles";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

const styles = theme => ({});

class DiagramView extends React.PureComponent {
  state = {
    data: false
  };

  // TODO: Add propTypes

  componentDidMount() {
    const { source, feature } = this.props;
    var url = this.parse(source, feature.getProperties());
    this.load(url);
  }

  parse(str, properties) {
    if (str && typeof str === "string") {
      (str.match(/{(.*?)}/g) || []).forEach(property => {
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

        str = str.replace(property, lookup(properties, property));
      });
    }
    return str;
  }

  load(url) {
    fetch(url).then(response => {
      response.json().then(rsp => {
        const data = rsp.features.map(feature => {
          return {
            date: feature.properties.datetime.split("T")[0],
            value: feature.properties.value
          };
        });
        this.setState({
          data: data
        });
      });
    });
  }

  render() {
    if (this.state.data) {
      return (
        <LineChart
          width={400}
          height={300}
          data={this.state.data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" stroke="#82ca9d" />
        </LineChart>
      );
    } else {
      return <div>Laddar</div>;
    }
  }
}

export default withStyles(styles)(DiagramView);
