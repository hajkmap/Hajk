import React from "react";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";

import FirExportResidentListView from "../Fir/FirExportResidentListView";

const ContainerInfo = styled("div")(({ theme }) => ({
  padding: theme.spacing(2),
}));

const SpanNum = styled("span")(({ theme }) => ({
  fontWeight: 500,
  fontSize: "1rem",
}));
class KirExportView extends React.PureComponent {
  state = {
    results: [],
  };

  static propTypes = {
    model: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
  };

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;

    this.localObserver.subscribe("kir.results.filtered", (list) => {
      this.setState({ results: [...list] });
      this.forceUpdate();
    });
  }

  render() {
    return (
      <>
        <div>
          <ContainerInfo>
            {this.model.app.plugins["kir"].options.residentList ===
              undefined && (
              <div>Otillräcklig behörighet för att exportera resultat</div>
            )}
            {this.model.app.plugins["kir"].options.residentList !==
              undefined && (
              <div>
                <SpanNum>{this.state.results.length}</SpanNum> objekt finns
                tillgängliga för export.
              </div>
            )}
          </ContainerInfo>
          <FirExportResidentListView
            results={this.state.results}
            model={this.model}
            app={this.props.app}
            localObserver={this.localObserver}
            type={"kir"}
          />
        </div>
      </>
    );
  }
}

export default KirExportView;
