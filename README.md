# Hajk
Uppdaterad: 2017-10-26

Hajk är ett projekt som drivs av Stadsbyggnadskontoret Göteborgs Stad.  
Systemutvecklare är i huvudsak Sweco Position.  

Projektet drivs som ett samarbetsprojekt och är avsett att kunna användas för generalla GIS-applikationer för webb.

Licensformen bygger på en öppen samarbetslicens. (CC BY SA NC).

Applikationen består av två delar: en serverdel och en klientdel. Serverdelen är programmerad i .NET med tekniken WCF och kodspråket C#. Klientdelen är skriven i JavaScript (ES2015). Kommunikationen mellan klient och server sker via HTTP enligt REST.

Klienten innehåller två separata webbapplikationer: en kartvy och en administrationsvy.

Serverdelen byggs i Visual Studio och driftsätts i IIS. Klientdelen (med de två vyerna, karta och administation) bygger på Node.js och nyttjar ett flertal NPM-paket (exempelvis React och Babel) samt byggs med hjälp av uppgiftshanteraren Grunt. Källkoden versionshanteras i Git och finns tillgänglig på Github.

Härefter redogörs tillvägagångssättet för att installera Hajk, inklusive installation av de nödvändiga programmen (Visual Studio Community Edition och Node.js).

## Installation

### Installera Git
Börja med att installera Git om det inte redan är gjort. Ladda ner en version för ditt operativsystem från https://git-scm.com/download/win. Installera med default-inställningar. Därmed bör Git installeras globalt för Windows och läggas till i `$PATH` .

Starta en kommandoprompt, exempelvis cmd, Windows Powershell eller Git Bash. Verifiera installationen genom kontrollera vilken version av Git som har installerats:  
```bash
git --version
```

>Tips: du kan med fördel använda den kommandopromot som installerades med Git. Sök i Windows startmeny efter `Git Bash`, starta den, och verifiera installationen genom att skriva kommandot ovan. 
>
>Fördelen med Git Bash är att du har tillgång till vanliga Unix-kommandon som `ls`, `pwd`, med flera, samt en fungerande auto-komplettering (börja skriva en sökväg och tryck på `TAB` för att testa). Dessutom finns Git med all säkerhet i `$PATH` när du använder Git Bash.

### Installera Node.js
Gå till https://nodejs.org och ladda ner och installera den aktuella versionen (i skrivande stund Node 8).

Verifiera installationen genom starta kommandopromten och skriva:  
```bash
node --version
```

### Installera Grunt
Grunt är en NPM-modul som används till att "bygga" klient- och admindelen av källkoden. Därför måste Grunt installeras nu, för att kunna användas senare:

```bash
npm i -g grunt-cli
```

>Tips: Flaggan `-g` i kommandot ovan anger att NPM ska installera paketet globalt, istället för enbart i nuvarande projekt (vilket är default). 

>Info: Kommandot `i` ovan är förkortning av `install`. Du kan således även skriva `npm install -g grunt-cli`, men det kan vara bra att känna till detta kortkommando. 

### Installera Visual Studio Community Edition
För att installera visual studio gå till https://www.visualstudio.com/thank-you-downloading-visual-studio/?sku=Community&rel=15, ladda ner och installera programmet. Det finns många val som kan göras här med det som är nödvändigt för Hajk är att ASP.NET-komponenterna installeras.

### Ladda ner koden
När alla nödvändiga programmen är på plats kan du ladda ner själva källkoden för projektet och börja arbeta med den. 

Skapa en mapp där du kommer arbeta med Hajk, exempelvis `C:\projekt`. 
```bash
cd C:
mkdir projekt
cd projekt
```
Nu är du inne i den nyskapade mappen. Nästa steg är att ladda ner aktuell version av källkoden från Github:

```bash
git clone https://github.com/hajkmap/Hajk.git
```
När kommandot är färdigt har du en ny mapp, `C:\projekt\Hajk` där du hittar den aktuella källkoden.

## Driftsättning
### Första gången projektet klonas
Efter den första kloningen (`git clone`-kommandot ovan) behöver nödvändiga paket som Hajk är beroende av att installeras av NPM (Node Package Manager). Därefter måste beroendena paketeras med hjälp av Grunt.

#### Installera beroenden
```bash
cd C:\projekt\Hajk\client
npm install
cd ..\admin
npm install
```
>Info: Kommandot `npm install` läser filen `package.json` och installerar de paketen som definieras där som beroenden. Paketen läggs i mappen `node_modules` under respektive del av koden (klient- respektive admindelen).

#### Paketera externa bibiliotek
```bash
cd c:\Projekt\Hajk\client
grunt dependencies
```
>Info: Kommandot `grunt dependencies` bygger ihop ett flertal hjälpbibliotek och paketerar dem till en fil, `dist/js/dependencies.min.js`. 
----------
#### Bygg klientdelen
Grunt bygger två versioner av källkoden: en som är lite större men lättare att felsöka, och en som är mer komprimerad och används för skarp drift. Nedan visas hur båda delarna byggs: 
```bash
# Öppna kommandopromten och gå till projektets mapp
cd c:\Projekt\Hajk\client

# Bygg version för test (målmapp "dist")
grunt build

# Bygg version för driftsättning. (målmapp "release")  
grunt release
```

#### Bygg admindelen
När admindelen byggs skapas också två versioner: en för test och en för driftsättning. Skillnaden mot klientdelen är att istället för att skapa separata mappar så skapas endast en mapp, `dist`, men den innehåller två filer: `index.html` och `debug.html`. 

```bash
# Öppna kommandopromten och gå till projektets mapp
cd c:\Projekt\Hajk\admin

# Bygg de två versionerna av admindelen (målmapp "dist")
grunt
```

Detta kommer att skapa en mapp som heter dist. I denna återfinns två html-filer, index.html och debug.html.  

#### Bygg backend-delen (servern)
- Dubbelklicka på **backend.sln**  
- Markera i Solution Explorer projektet **mapservice**.  
- Välj från menyn `Build > Build Solution`  
- Välj från menyn `Build > Publish mapservice`  
- Ändra sökväg till mappen om så önskas. Standard är c:\install\backend.  

### Installera projektet i Internet Information Services (IIS > 7).

IIS kräver att server applikationen körs i en App Pool med .NET version 4.0 integrated.  
IIS måste ha mime-typen application/vnd.google-earth.kml+xml registrerad för filändelsen .kml.  
IIS bör även ha mime-typen font/woff2 registrerad för filändelsen .woff2.  

I en driftsättningsmiljö så lägg förslagsvis applikationerna i två seperata mappar.  
Mapparna bör placeras i en skrivskyddad mapp; tex C:\data\www\hajk.

Skapa därefter tre undermappar för applikationerna:  
C:\data\www\hajk -- innehåller innehållet i **client\release**  
C:\data\www\hajk\backend -- innehåller innehållet i **backend**  
C:\data\www\hajk\admin -- innehåller innehållet i **admin\release**  

Skapa i IIS tre nya applikationer genom att högerklicka på vald site och välja:

**Lägg till program..**

För klientapplikationen så kan valfritt namn användas, detta bli sökväg till kartapplikationen.  
För serverapplikationen så ange Alias: mapservice.  
För adminapplikationen så kan valfritt namn användas, detta bli sökväg till adminapplikationen.  
Finns behov av HTTP-proxy för anrop till extern kartserver så finns exempel på detta i mappen proxy.  

## Konfiguration

### Klient
När scriptet för HAJK2 läggs till i en HTML-fil via en script-tagg så initieras en global variabel med namn HAJK2.
Denna variabel innehåller ett objekt som används för att konfigurera och starta applikationen.  
Applikationen förutsätter att den finns ett element i HTML-filen som heter map.  

Det finns två egenskaper på HAJK2-objektet som används för att konfigurera HTTP-proxy för korsdomänsanrop.  
`{string} wmsProxy` - URL: skall ha stöd för GET-anrop och används för att hämta WMS-bilder (behövs i regel när det är lösenord på tjänster).  
`{string} wfsProxy` - URL: skall ha stöd för GET-anrop och används för att hämta  data via WFS-protokollet.  
`{string} searchProxy` - URL: skall ha stöd för POST-anrop och används vid WFS-sökning.  

Det finns en metod som heter start. Denna startar applikationen.  
`start({object} startConfiguration)`  

startConfiguration  
`cofigPath` - Sökväg till tjänstenod som hämtar konfiguration för karta.  
`layersPath` - Sökväg till tjänstenod som hämtar konfiguration för lager.  

För att konfigurera kartan så hanteras detta manuellt i filen App_Data\{namn}.json  
Egenskaperna center, projection, zoom, logo och colors nås även via adminapplikationen.  
Var noggrann med att ställa in rätt extent för kartan då WMTS/WMS används som bakgrundslager.
<pre>
"map": {  
  "target": "map",                // {string} Målelement (ändra inte)  
  "center": [410719, 6575675 ],   // {array {number}}centrumkoortinat  
  "projection": "EPSG:3006",      // {string} projektion  
  "zoom": 7,                      // {number} startzoom  
  "maxZoom": 12,                  // {number} Högsta möjliga zoomnivå  
  "minZoom": 4,                   // {number} Lägsta möjliga zoomnivå  
  "resolutions": [],              // {array {number}} Lista med upplösningar för tile-grid (specificeras vid tilecache)  
  "origin": [],                   // {array {number}} Startkoordinat för tile-grid  
  "extent": [],                   // {array {number}} Utbredning för tile-grid  
  "logo": ""                      // {string} URL för sökväg till logo  
  "colors": {                     // {object} Färgtema  
    "primaryColor": "#1B78CC",    // {string} Huvudfärg  
    "secondaryColor": "#FFF"      // {string} Komplementfärg
  }
}
</pre>

### Administrationsgränssnitt
#### Applikation
Filen config.json hanterar inställningar för admingränssnittet.  
Följande egenskaper finns att konfigurera:
#### layermanager
`{string} url_proxy` - Sökväg till HTTP-proxy för korsdomänsanrop.  
`{string} url_import` - Sökväg till importtjänst.
`{string} url_layers` - REST-sökväg till tjänstenod där lager hanteras.  
`{string} url_layer_settings` - REST-sökväg till tjänstenod som hanterar uppdatering av enskilda wmslager.  
`{string} url_wmtslayer_settings` - REST-sökväg till tjänstenod som hanterar uppdatering av enskilda wmtslager.  
`{string} url_arcgislayer_settings` - REST-sökväg till tjänstenod som hanterar uppdatering av enskilda arcgislager.  
`{string} url_vectorlayer_settings` - REST-sökväg till tjänstenod som hanterar uppdatering av enskilda vektorlager.  
`{string} url_default_server` -  Sökväg till den standardserver som skall användas som uppslag för WMS-tjänster.  
`{array { object { value, title }}} owner_options` - Lista med namn på tillgängliga dataägare.  
#### search
`{string} url_proxy` - Sökväg till proxy för sökning.  
`{string} url_layers` - REST-sökväg till funktion för att lista lager.  
`{string} url_layer_settings` - REST-sökväg till funktion för editera inställningar för sökfunktion.  
`{string} url_default_server` - Standarssökväg till server för sökning.
#### edit
`{string} url_proxy` - Sökväg till proxy för editering.  
`{string} url_layers` - REST-sökväg till funktion för att lista lager.  
`{string} url_layer_settings` - REST-sökväg till funktion för editera inställningar för editeringsfunktion.  
`{string} url_default_server` - Standarssökväg till server för editering.   
`{array} projections` - Lista med tilgängliga projektioner för editering.
### mapsettings
`{string} url_map` - "REST-sökväg till rot för karthantering.  
`{string} url_map_create` - REST-sökväg till nod för att skapa kartor.  
`{string} url_map_delete` - REST-sökväg till nod för att ta bort kartor.  
`{string} url_map_list` - REST-sökväg till nod för att lista kartor.  
`{string} url_layers` - REST-sökväg till funktion för att lista lager.  
`{string} url_layermenu_settings` - REST-sökväg till funktion för att lista lager.  
`{string} url_map_settings` - REST-sökväg till funktion för editera inställningar för kartor.  
`{string} url_tool_settings` - REST-sökväg till funktion för editera inställningar för verktyg.
#### router
`{array {object {name, title, default (optional) }}}` - Lista med flikar i applikationen.  

### Tjänst
Ge läs och skrivrättigheter till mappen App_Data för den avnändare som är registrerad i IIS.
