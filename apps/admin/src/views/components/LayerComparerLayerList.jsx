import React from "react";

class LayerComparerLayerList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filterText: "",
      sortAsc: true,
      chosenLayers: this.props.chosenLayers || [],
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.chosenLayers !== this.props.chosenLayers) {
      this.setState({ chosenLayers: this.props.chosenLayers });
    }
  }

  handleFilterChange = (e) => {
    this.setState({ filterText: e.target.value });
  };

  handleSortToggle = () => {
    this.setState((prevState) => ({ sortAsc: !prevState.sortAsc }));
  };

  handleLayerToggle = (layer) => {
    this.setState((prevState) => {
      const { chosenLayers } = prevState;
      const exists = chosenLayers.some((l) => l.id === layer.id);
      let updated;
      if (exists) {
        updated = chosenLayers.filter((l) => l.id !== layer.id);
      } else {
        updated = [...chosenLayers, layer];
      }

      if (this.props.onChosenLayersChange) {
        this.props.onChosenLayersChange(updated);
      }

      return { chosenLayers: updated };
    });
  };

  getFilteredAndSortedLayers() {
    const { allLayers = [] } = this.props;
    const { filterText, sortAsc } = this.state;

    const filteredLayers = allLayers
      .filter((layer) =>
        (layer.caption || layer.name || layer.id || "")
          .toLowerCase()
          .includes(filterText.toLowerCase())
      )
      .sort((a, b) => {
        const aVal = (a.caption || a.name || a.id || "").toLowerCase();
        const bVal = (b.caption || b.name || b.id || "").toLowerCase();
        if (aVal < bVal) return sortAsc ? -1 : 1;
        if (aVal > bVal) return sortAsc ? 1 : -1;
        return 0;
      });

    return filteredLayers;
  }

  selectAllLayers = () => {
    const filteredLayers = this.getFilteredAndSortedLayers();
    const { chosenLayers } = this.state;

    const allSelected =
      filteredLayers.length > 0 &&
      filteredLayers.every((layer) =>
        chosenLayers.some((chosen) => chosen.id === layer.id)
      );

    let updated;
    if (allSelected) {
      updated = chosenLayers.filter(
        (chosen) => !filteredLayers.some((fLayer) => fLayer.id === chosen.id)
      );
    } else {
      const missing = filteredLayers.filter(
        (l) => !chosenLayers.some((chosen) => chosen.id === l.id)
      );
      updated = [...chosenLayers, ...missing];
    }

    this.setState({ chosenLayers: updated });
    if (this.props.onChosenLayersChange) {
      this.props.onChosenLayersChange(updated);
    }
  };

  render() {
    const { chosenLayers, filterText, sortAsc } = this.state;
    const filteredLayers = this.getFilteredAndSortedLayers();

    const containerStyle = {
      maxWidth: "600px",
      border: "1px solid #ccc",
      padding: "10px",
      textAlign: "left",
    };

    const listContainerStyle = {
      maxHeight: "200px",
      overflowY: "auto",
      border: "1px solid #ddd",
      padding: "5px",
      marginTop: "10px",
    };

    return (
      <div style={containerStyle}>
        <h3>Lager</h3>
        <div style={{ marginBottom: "10px" }}>
          <input
            type="text"
            placeholder="Filtrera"
            value={filterText}
            onChange={this.handleFilterChange}
            style={{ marginRight: "10px", width: "80%" }}
          />
          <button
            onClick={this.handleSortToggle}
            style={{ marginRight: "10px" }}
          >
            Sortera {sortAsc ? "A-Ö" : "Ö-A"}
          </button>
          <button onClick={this.selectAllLayers}>Välj alla</button>
        </div>

        <div style={listContainerStyle}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {filteredLayers.map((layer) => {
              const isChecked = chosenLayers.some((l) => l.id === layer.id);
              return (
                <li key={layer.id} style={{ marginBottom: "5px" }}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => this.handleLayerToggle(layer)}
                  />{" "}
                  {layer.caption || layer.name || layer.id}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }
}

export default LayerComparerLayerList;
