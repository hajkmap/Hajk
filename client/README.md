# Hajk - client
Modern webbplatform för kartapplikationer.

Bygger på
* [OpenLayers 3](http://openlayers.org/)
* [ReactJS](http://facebook.github.io/react/)
* [Backbone](http://backbonejs.org/)
* [Font Awesome](https://fortawesome.github.io/Font-Awesome/)

## Deployment
Se [README.md](https://github.com/hajkmap/Hajk/blob/master/README.md) för hur Hajk sätts upp för drift. Applikationen består av tre delar, där klient är bara en av dem. 

## Testmiljö för klientdelen
> Krav: För att sätta upp en testmiljö för klientdelen krävs att du har redan satt upp applikationen lokalt i enligthet med guiden i [README.md](https://github.com/hajkmap/Hajk/blob/master/README.md). Du ska kunna komma åt http://localhost, http://localhost/mapservice och http://localhost/admin.

1. `cd client`
1. `grunt dependencies // om det inte är gjort redan`
1. `grunt build`
1. `grunt debug`

I och med det sista kommandot körs kommer Node.js att initiera en lokal serverprocess (du kan komma att få varning från Windows brandvägg första gången och ska tillåta all åtkomst för applikationen). 

Nu kan du surfa in på http://localhost:9000 och sedan arbeta med filer i `client`. Så snart du ändrar och sparar någon av filerna kommer Node.js att känna av det och trigga `grunt` att bygga om applikationen samt säga till webbläsaren att ladda om sidan (fungerar utmärkt åtminstone i Chrome). Testa gärna genom att ändra exempelvis `<title>` i `index.html`. 

För att avsluta serverprocessen skriver du `Ctrl+C` och bekräftar med `J`. 

### Förstå hur det fungerar
Node.js har alltså startat en till webbserver lokalt, på port 9000 (och 3000 också för den delen). I konfigurationen för Grunt säger vi att det ska finnas en proxy och när man anropar localhost:9000/mapservice (vilket görs hela tiden när du använder Hajk, anropen görs i bakgrunden och de går mot samma port som applikationen körs på), så ska anropet i själva verket gå till localhost:80/mapservice. Därför krävs att du har IIS igång också - när du skriver `grunt debug` så är det bara klientdelen som byggs och servas via Node.js:s interna webbserver. .NET-applikationen (som /mapservice är) kommer inte härifrån utan måste tillhandahållas via IIS.

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
  * <code>grunt dependencies</code> - skapar upp dist katalog med dependencies.js. (Kör en gång)
  * <code>grunt build</code> - bygger js-, css-, html-filer samt kopierar statiska filer.

## Debug
  * <code>grunt debug</code> - Lyssnar på förändringar i projektet, bygger vid behov.
  * avsluta ctrl-c


## Release
  * <code>grunt release</code> - Skapar release katalog, mimifierar och bygger appen.
  * <code>grunt test</code> - startar test session för release katalogen.

## Dokumentation
  Börja med att installera jsdocs lokalt på datorn.
  Kör därefter <code>jsdocs -r -c conf.json -d documentation --readme README.md</code>