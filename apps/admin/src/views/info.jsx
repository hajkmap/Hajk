import React from "react";
import { Component } from "react";

class Info extends Component {
  render() {
    return (
      <div className="info">
        <h1>Hajk Map</h1>
        <p>
          Hajk Map är ett projekt som initierats för att skapa en snabb och
          stabil plattform för avancerade webbkartor.
          <br />
          Projektet är öppet att delta i och är licensierat under MIT.
          <br />
        </p>
        <p>Applikationen är skapad med komponenter från följande bibliotek:</p>
        <ul>
          <li>Open Layers</li>
          <li>React</li>
        </ul>
        <p>Följande funktioner är i nuläget implementerade</p>
        <ul>
          <li>
            <b>Sökfunktion</b> - sök efter valfri information i kartans lager
          </li>
          <li>
            <b>Koordinatverktyg</b> - transformera mellan valfria
            koordinatsystem
          </li>
          <li>
            <b>Favorit/Bokmärkesverktyg</b> - skapa personliga bokmärken
          </li>
          <li>
            <b>Utskrift</b>
          </li>
          <li>
            <b>Ritverktyg</b> - med mät och export/importfunktion
          </li>
          <li>
            <b>Länk till karta</b>
          </li>
          <li>
            <b>Administrationsverktyg</b>
          </li>
        </ul>
        <p>
          github:{" "}
          <a
            href="https://github.com/hajkmap/Hajk"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://github.com/hajkmap/Hajk
          </a>
        </p>
      </div>
    );
  }
}

export default Info;
