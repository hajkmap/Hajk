# Hajk2

Modern webbplatform för kartapplikationer.

Bygger på
* [OpenLayers 3](http://openlayers.org/)
* [ReactJS](http://facebook.github.io/react/)
* [Backbone](http://backbonejs.org/)
* [Font Awesome](https://fortawesome.github.io/Font-Awesome/)

## Utvecklingsmiljö
  * installera node och npm
  * installera grunt-cli: npm install -g grunt-cli
  * installera beroenden: npm install

## Filer och mappar
  * src/ - källkod
  * compiled/ - kompilerade react samt less filer
  * dist/ - distributions katalog för utveckling
  * release/ - distributions katalog miniferade filer.
  * Gruntfile.js - konfig av byggmiljö
  * jsconfig.json - script filer som ska byggas
  * package.json - projektdefinition och beroenden.

## Bygga
  * grunt dependencies - skapar upp dist katalog med dependencies.js. (Kör en gång)
  * grunt build - bygger js-, css-, html-filer samt kopierar statiska filer.

## Debug
  * grunt debug - Lyssnar på förändringar i projektet, bygger vid behov.
  * avsluta ctrl-c


## Release
  * grunt release - Skapar release katalog, mimifierar och bygger appen.
  * grunt test - startar test session för release katalogen.