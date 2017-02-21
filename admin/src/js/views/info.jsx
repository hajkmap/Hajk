// Copyright (C) 2016 Göteborgs Stad
//
// Denna programvara är fri mjukvara: den är tillåten att distribuera och modifiera
// under villkoren för licensen CC-BY-NC-SA 4.0.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the CC-BY-NC-SA 4.0 licence.
//
// http://creativecommons.org/licenses/by-nc-sa/4.0/
//
// Det är fritt att dela och anpassa programvaran för valfritt syfte
// med förbehåll att följande villkor följs:
// * Copyright till upphovsmannen inte modifieras.
// * Programvaran används i icke-kommersiellt syfte.
// * Licenstypen inte modifieras.
//
// Den här programvaran är öppen i syfte att den skall vara till nytta för andra
// men UTAN NÅGRA GARANTIER; även utan underförstådd garanti för
// SÄLJBARHET eller LÄMPLIGHET FÖR ETT VISST SYFTE.
//
// https://github.com/Johkar/Hajk2

import React from 'react';
import { Component } from 'react';

class Info extends Component {

  constructor() {
    super();
  }

  render() {
    return (
		<div className="info">
		  <h1>Hajk Map</h1>
		  <p>
		  	Hajk Map är ett projekt som initierats för att skapa en snabb och stabil plattform för avancerade webbkartor.<br/>
		  	Projektet är öppet att delta i, det följer en licensform som bygger på Creative Common Zero CC0.<br/>
		  </p>
		  <p>
		  	De som utvecklar projektet är i huvudsak:<br/>
			Göteborg Stad Stadsbyggnadskontoret<br/>
			Kungsbacka Kommun<br/>
		  	Sweco Position<br/>
		  </p>
		  <h2>Releaser</h2>
		  <ul>
		  	<li><a href="Hajk2-2.0.0.zip">Release 2.0.0</a></li>
		  </ul>
		  <p>Applikationen är skapad med komponenter från följande bibliotek:</p>
		  <ul>
		  	<li>Open Layers 3</li>
			<li>React</li>
			<li>Backbone</li>
		  	<li>Bootstrap</li>
		  	<li>Microsoft .NET 4.5</li>
		  </ul>
		  <p>Följande funktioner är i nuläget implementerade</p>
		  <ul>
			<li><b>Sökfunktion</b> - sök efter valfri information i kartans lager</li>
			<li><b>Koordinatverktyg</b> - transformera mellan valfria koordinatsystem</li>
		  	<li><b>Favorit/Bokmärkesverktyg</b> - skapa personliga bokmärken</li>
		  	<li><b>Utskrift</b></li>
		  	<li><b>Ritverktyg</b> - med mät och export/importfunktion</li>
		  	<li><b>Länk till karta</b></li>
		  	<li><b>Administrationsverktyg</b></li>
		  </ul>
		  <p>
		  	github: <a href="https://github.com/Johkar/Hajk2" target="_blank">https://github.com/Johkar/Hajk2</a>
		  </p>
		</div>
    );
  }

}

export default Info;
