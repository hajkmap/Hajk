import React from "react";
import { Component } from "react";
import Alert from "../views/alert.jsx";
import Button from "@material-ui/core/Button";
import RefreshIcon from "@material-ui/icons/Refresh";
import GetAppIcon from "@material-ui/icons/GetApp";
import DeleteForeverIcon from "@material-ui/icons/DeleteForever";
import { withStyles } from "@material-ui/core/styles";
import { blue, red } from "@material-ui/core/colors";

const ColorButtonBlue = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(blue[500]),
    backgroundColor: blue[500],
    "&:hover": {
      backgroundColor: blue[700],
    },
  },
}))(Button);

const ColorButtonRed = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(red[500]),
    backgroundColor: red[500],
    "&:hover": {
      backgroundColor: red[700],
    },
  },
}))(Button);

const MAX_VISIBLE_ENTRIES = 100;

const defaultState = {
  loading: false,
  error: null,
  stats: null,
  entries: [],
  alert: false,
  confirm: false,
  alertMessage: "",
  confirmAction: () => {},
  denyAction: () => {},
};

function formatBytes(bytes) {
  if (typeof bytes !== "number" || !isFinite(bytes)) return "Okänt";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toLocaleString("sv-SE", { maximumFractionDigits: 1 })} ${
    units[unit]
  }`;
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return isNaN(date.getTime())
    ? String(timestamp || "")
    : date.toLocaleString("sv-SE");
}

function isHttpUrl(url) {
  return typeof url === "string" && /^https?:\/\//i.test(url);
}

function formatUser(user) {
  if (user === undefined || user === null || user === "") return "";
  return typeof user === "string" ? user : JSON.stringify(user);
}

function todayAsString() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

class Feedback extends Component {
  constructor() {
    super();
    this.state = defaultState;
  }

  componentDidMount() {
    this.props.model.set("config", this.props.config);
    this.refresh();
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  safeSetState(state) {
    if (!this.unmounted) this.setState(state);
  }

  refresh() {
    this.setState({ loading: true, error: null });
    this.props.model.getStats((statsError, stats) => {
      this.props.model.getEntries((entriesError, entries) => {
        this.safeSetState({
          loading: false,
          error: statsError || entriesError || null,
          stats: statsError ? null : stats,
          entries: entriesError ? [] : entries,
        });
      });
    });
  }

  download() {
    this.setState({ error: null });
    this.props.model.getEntries((error, entries) => {
      if (error) {
        this.safeSetState({ error });
        return;
      }
      const blob = new Blob([JSON.stringify(entries, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `feedback-${todayAsString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  deleteAll() {
    this.setState({
      alert: true,
      confirm: true,
      alertMessage:
        "All inkommen feedback kommer att raderas permanent. Är detta ok?",
      confirmAction: () => {
        this.props.model.deleteAll((error, result) => {
          if (error) {
            this.safeSetState({ alert: true, alertMessage: error });
          } else {
            const count = result && result.deletedFiles;
            this.safeSetState({
              alert: true,
              alertMessage: `All feedback raderades (${
                typeof count === "number" ? count : 0
              } filer).`,
            });
          }
          this.refresh();
        });
      },
    });
  }

  getAlertOptions() {
    return {
      visible: this.state.alert,
      message: this.state.alertMessage,
      confirm: this.state.confirm,
      confirmAction: () => {
        this.state.confirmAction();
        this.setState({
          alert: false,
          confirm: false,
          alertMessage: "",
        });
      },
      denyAction: () => {
        this.state.denyAction();
        this.setState({
          alert: false,
          confirm: false,
          alertMessage: "",
        });
      },
      onClick: () => {
        this.setState({
          alert: false,
          alertMessage: "",
        });
      },
    };
  }

  renderStats() {
    const { stats } = this.state;
    if (!stats) return null;
    const files = Array.isArray(stats.files) ? stats.files : [];
    const maxFiles = stats.limits && stats.limits.maxFiles;
    return (
      <table className="table table-condensed" style={{ width: "auto" }}>
        <tbody>
          <tr>
            <th>Aktiverad i backend</th>
            <td>
              {stats.active ? "Ja" : "Nej"}
              {!stats.active && (
                <span style={{ marginLeft: 8, color: "#a94442" }}>
                  (Sätt FEEDBACK_ACTIVE=true i backendens .env för att ta emot
                  feedback.)
                </span>
              )}
            </td>
          </tr>
          <tr>
            <th>Antal inlägg</th>
            <td>{stats.entryCount}</td>
          </tr>
          <tr>
            <th>Total storlek</th>
            <td>{formatBytes(stats.totalSize)}</td>
          </tr>
          <tr>
            <th>Antal filer</th>
            <td>
              {files.length}
              {typeof maxFiles === "number" ? ` / ${maxFiles}` : ""}
            </td>
          </tr>
          <tr>
            <th>Ledigt diskutrymme</th>
            <td>{formatBytes(stats.freeDiskSpace)}</td>
          </tr>
        </tbody>
      </table>
    );
  }

  renderEntries() {
    const { entries } = this.state;
    if (entries.length === 0) {
      return <p>Det finns ingen feedback att visa.</p>;
    }
    const visible = entries.slice(0, MAX_VISIBLE_ENTRIES);
    return (
      <>
        {entries.length > MAX_VISIBLE_ENTRIES && (
          <p>
            Visar de {MAX_VISIBLE_ENTRIES} senaste av totalt {entries.length}{" "}
            inlägg. Ladda ner JSON-filen för att se allt.
          </p>
        )}
        <table className="table table-striped table-condensed">
          <thead>
            <tr>
              <th style={{ whiteSpace: "nowrap" }}>Tidpunkt</th>
              <th>Karta</th>
              <th>Meddelande</th>
              <th>Länk</th>
              <th>Användare</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((entry, i) => {
              const anchorUrl = entry.context && entry.context.anchorUrl;
              return (
                <tr key={entry.id || i}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {formatTimestamp(entry.timestamp)}
                  </td>
                  <td>{entry.map == null ? "" : String(entry.map)}</td>
                  <td
                    style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                  >
                    {entry.message == null ? "" : String(entry.message)}
                  </td>
                  <td>
                    {isHttpUrl(anchorUrl) ? (
                      <a
                        href={anchorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Öppna
                      </a>
                    ) : null}
                  </td>
                  <td>{formatUser(entry.user)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </>
    );
  }

  render() {
    const { loading, error } = this.state;
    return (
      <section className="tab-pane active">
        <Alert options={this.getAlertOptions()} />
        <h1>Feedback</h1>
        <p>
          <ColorButtonBlue
            variant="contained"
            className="btn"
            disabled={loading}
            onClick={() => this.refresh()}
            startIcon={<RefreshIcon />}
          >
            Uppdatera
          </ColorButtonBlue>
          &nbsp;
          <ColorButtonBlue
            variant="contained"
            className="btn"
            disabled={loading}
            onClick={() => this.download()}
            startIcon={<GetAppIcon />}
          >
            Ladda ner (JSON)
          </ColorButtonBlue>
          &nbsp;
          <ColorButtonRed
            variant="contained"
            className="btn"
            disabled={loading}
            onClick={() => this.deleteAll()}
            startIcon={<DeleteForeverIcon />}
          >
            Radera all feedback
          </ColorButtonRed>
          {loading && (
            <i className="fa fa-refresh fa-spin" style={{ marginLeft: 10 }} />
          )}
        </p>
        {error && <div className="alert alert-danger">{error}</div>}
        {this.renderStats()}
        {this.renderEntries()}
      </section>
    );
  }
}

export default Feedback;
