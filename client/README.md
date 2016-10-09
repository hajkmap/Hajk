Modern webbplatform för kartapplikationer.

Bygger på
* [OpenLayers 3](http://openlayers.org/)
* [ReactJS](http://facebook.github.io/react/)
* [Backbone](http://backbonejs.org/)
* [Font Awesome](https://fortawesome.github.io/Font-Awesome/)

## Utvecklingsmiljö
  * installera node och npm
  * installera grunt-cli <code>npm install -g grunt-cli</code>
  * installera beroenden <code>npm install</code>

## Generell information
Applikationen bygger på ett modulärt tänkt som är sammanlänkat av flera reactvyer.
Ingångspunkten till applikationen är vyn Shell. Det är denna som laddas när applikationen startar.
Denna vy har ansvar för att ladda in de vyer som används i applikationen.
En vy har i regel en modell kopplad till sig som har hand om att sköta logik och lagra vyns läge (state) när vyn laddas in och ur virtual dom.

## Filer och mappar
  * **src**  - källkod
  * **compiled**  - kompilerade react samt less filer
  * **dist**  - distributions katalog för utveckling
  * **release**  - distributions katalog miniferade filer.
  * Gruntfile.js - konfig av byggmiljö
  * jsconfig.json - script filer som ska byggas
  * package.json - projektdefinition och beroenden.

## Mappen src
  * **collections** - modeller som ansvarar för att lagra en eller flera uppsättningar av andra modeller, till exempel vertyg eller kartlager.
  * **layers** - modeller som representerar openlayers lager.
  * **models** - modeller som används av applikationens kärna.
  * **tools** - modeller för verktyg i kartan.
  * **views** - vyer som används för att presenteras i navigation model och som är kopplade till ett specefikt verktyg.
  * dependencies.js - En fil som läser in beroenden via browserify och skapar en fil där globala variabler är registrerade.
  * index.js - applikationens startmodul

## Bygga
  * <code>grunt dependencies<code> - skapar upp dist katalog med dependencies.js. (Kör en gång)
  * <code>grunt build<code> - bygger js-, css-, html-filer samt kopierar statiska filer.

## Debug
  * <code>grunt debug</code> - Lyssnar på förändringar i projektet, bygger vid behov.
  * avsluta ctrl-c


## Release
  * <code>grunt release</code> - Skapar release katalog, mimifierar och bygger appen.
  * <code>grunt test</code> - startar test session för release katalogen.

## Dokumentation
  Börja med att installera jsdocs lokalt på datorn.
  Kör därefter <code>jsdocs -r -c conf.json -d documentation --readme README.md</code>