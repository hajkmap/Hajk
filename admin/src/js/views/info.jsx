
class Info extends React.Component {

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
		  	<li><a href="Hajk2-2.0-RC3.zip">Release 2.0-RC3</a></li>
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
		</div>
    );
  }

}

module.exports = Info;