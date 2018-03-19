# Hajk
Uppdaterad: 2017-10-26

## Innehåll
- [Hajk](#hajk)
  - [Innehåll](#inneh%C3%A5ll)
  - [Installation](#installation)
    - [Installera Git](#installera-git)
    - [Installera Node.js](#installera-nodejs)
    - [Installera Grunt](#installera-grunt)
    - [Installera Visual Studio Community Edition](#installera-visual-studio-community-edition)
    - [Ladda ner koden](#ladda-ner-koden)
  - [Kompilering](#kompilering)
    - [Första gången projektet klonas](#f%C3%B6rsta-g%C3%A5ngen-projektet-klonas)
      - [Installera beroenden](#installera-beroenden)
      - [Paketera externa bibliotek](#paketera-externa-bibliotek)
    - [Vanligt byggförfarande](#vanligt-byggf%C3%B6rfarande)
      - [Bygg klientdelen](#bygg-klientdelen)
      - [Bygg admindelen](#bygg-admindelen)
      - [Bygg backend-delen (servern)](#bygg-backend-delen-servern)
  - [Driftsättning](#drifts%C3%A4ttning)
    - [Förberedelser](#f%C3%B6rberedelser)
      - [Skapa huvudmapp för applikationen](#skapa-huvudmapp-f%C3%B6r-applikationen)
      - [Flytta och skapa mappar och filer](#flytta-och-skapa-mappar-och-filer)
      - [Flytta proxy-filer](#flytta-proxy-filer)
      - [Kontrollera att allt kom med](#kontrollera-att-allt-kom-med)
      - [Sätt rätt behörigheter på filer och mappar](#s%C3%A4tt-r%C3%A4tt-beh%C3%B6righeter-p%C3%A5-filer-och-mappar)
    - [Uppsättning i IIS](#upps%C3%A4ttning-i-iis)
      - [Mime-typer](#mime-typer)
  - [Konfiguration](#konfiguration)
    - [Klient](#klient)
    - [Administrationsgränssnitt](#administrationsgr%C3%A4nssnitt)
      - [Applikation](#applikation)
      - [layermanager](#layermanager)
      - [search](#search)
      - [edit](#edit)
    - [mapsettings](#mapsettings)
      - [router](#router)
    - [Tjänst](#tj%C3%A4nst)

Hajk är ett projekt som drivs av Stadsbyggnadskontoret Göteborgs Stad.  
Systemutvecklare är i huvudsak Sweco Position.  

Projektet drivs som ett samarbetsprojekt och är avsett att kunna användas för generalla GIS-applikationer för webb.

Licensformen bygger på en öppen samarbetslicens. (CC BY SA NC).

Applikationen består av två delar: en serverdel och en klientdel. Serverdelen är programmerad i .NET med tekniken WCF och kodspråket C#. Klientdelen är skriven i JavaScript (ES2015). Kommunikationen mellan klient och server sker via HTTP enligt REST.

Klienten innehåller två separata webbapplikationer: en kartvy och en administrationsvy.

Serverdelen byggs i Visual Studio och driftsätts i IIS. Klientdelen (med de två vyerna, karta och administation) bygger på Node.js och nyttjar ett flertal NPM-paket (exempelvis React och Babel) samt byggs med hjälp av uppgiftshanteraren Grunt. Källkoden versionshanteras i Git och finns tillgänglig på Github.

Härefter redogörs tillvägagångssättet för att installera Hajk, inklusive installation av de nödvändiga programmen (Visual Studio Community Edition och Node.js).

---

## Installation

### Installera Git
Börja med att installera Git om det inte redan är gjort. Ladda ner en version för ditt operativsystem från https://git-scm.com/download/win. Installera med default-inställningar. Därmed bör Git installeras globalt för Windows och läggas till i `$PATH` .

Starta en kommandoprompt, exempelvis cmd, Windows Powershell eller Git Bash. Verifiera installationen genom kontrollera vilken version av Git som har installerats:  
```bash
git --version
```

>Tips: du kan med fördel använda den kommandoprompt som installerades med Git. Sök i Windows startmeny efter `Git Bash`, starta den, och verifiera installationen genom att skriva kommandot ovan. 
>
>Fördelen med Git Bash är att du har tillgång till vanliga Unix-kommandon som `ls`, `pwd`, med flera, samt en fungerande auto-komplettering (börja skriva en sökväg och tryck på `TAB` för att testa). Dessutom finns Git med all säkerhet i `$PATH` när du använder Git Bash.

### Installera Node.js
Gå till https://nodejs.org och ladda ner och installera den aktuella versionen (i skrivande stund Node 8).

Verifiera installationen genom starta kommandoprompten och skriva:  
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
För att installera Visual Studio gå till https://www.visualstudio.com/thank-you-downloading-visual-studio/?sku=Community&rel=15, ladda ner och installera programmet. Det finns många val som kan göras här med det som är nödvändigt för Hajk är att ASP.NET-komponenterna installeras.

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

---

## Kompilering

### Första gången projektet klonas
>Info: efter den första kloningen (`git clone`-kommandot ovan) behöver nödvändiga paket som Hajk är beroende av att installeras av NPM (Node Package Manager). Därefter måste beroendena paketeras med hjälp av Grunt. Följ därför instruktioner under rubrikerna *Installera beroenden* och *Paketera externa bibliotek*. Därefter, fortsätt till *Vanligt byggförfarande*.

#### Installera beroenden
```bash
cd C:\projekt\Hajk\client
npm install
cd ..\admin
npm install
```
>Info: Kommandot `npm install` läser filen `package.json` och installerar de paketen som definieras där som beroenden. Paketen läggs i mappen `node_modules` under respektive del av koden (klient- respektive admindelen).

#### Paketera externa bibliotek
```bash
cd c:\Projekt\Hajk\client
grunt dependencies
```
>Info: Kommandot `grunt dependencies` bygger ihop ett flertal hjälpbibliotek och paketerar dem till en fil, `dist/js/dependencies.min.js`. 

---

### Vanligt byggförfarande

#### Bygg klientdelen
Grunt bygger två versioner av källkoden: en som är lite större men lättare att felsöka, och en som är mer komprimerad och används för skarp drift. Nedan visas hur båda delarna byggs: 
```bash
# Öppna kommandoprompten och gå till projektets mapp
cd c:\projekt\Hajk\client

# Bygg version för test (målmapp "dist")
grunt build

# Bygg version för driftsättning. (målmapp "release")  
grunt release
```

#### Bygg admindelen
När admindelen byggs skapas också två versioner: en för test och en för driftsättning. Skillnaden mot klientdelen är att istället för att skapa separata mappar så skapas endast en mapp, `dist`, men den innehåller två filer: `index.html` och `debug.html`. 

```bash
# Öppna kommandopromten och gå till projektets mapp
cd c:\projekt\Hajk\admin

# Bygg de två versionerna av admindelen (målmapp "dist")
grunt
```

#### Bygg backend-delen (servern)
- Öppna Utforskaren och navigera till mappen som innehåller backend-kod (i det här exemplet, `C:\projekt\Hajk\backend`
- Dubbelklicka på `MapService.sln`
- Visual Studio öppnas
- I `Solution Explorer` markera projektet `MapService`
- I huvudmenyn, välj  `Build > Build Solution`  
- Invänta tills kompileringen är klar (du ser status i `Output`-fönstret längst ner, när det står något i stil med `Build: 2 succeeded, 0 failed, 0 up-to-date, 0 skipped` så är det klart)
- I huvudmenyn, välj  `Build > Publish MapService`  
- I fönstret som visas nu finns möjlighet att ändra `Target Location`, alltså stället dit backend-applikationen kommer att publiceras. Default-värde är `C:\install\mapservice\`. Du kan låta det vara kvar eller ändra till något annat. Huvudsaken är att du **vet var filerna läggs** för de kommer behövas senare när vi sätter upp webbservern.

--- 
## Driftsättning

Om du har följt anvisningarna så lång har du de tre *kompilerade* delarna som applikationen utgörs av på följande ställen:

| Del     | Plats                           |
| ------- | ------------------------------- |
| backend | `C:/install/mapservice`         |
| admin   | `C:/projekt/Hajk/admin/dist`    |
| client  | `C:/projekt/Hajk/admin/release` |

>Observera: som det nämndes tidigare i avsnittet om klientdelen så byggdes den i en drift- och en testversion. För driftsättning nu kommer vi använda den skarpa driftversionen, som alltså ligger i `release`. Men kom ihåg att även testversionen finns, i mappen `dist`, och instruktionerna här fungerar även för den. Byt bara ut mapparna mot varann.

>Info: Projektets backend-del är en .NET-applikation som i Windowsmiljö enklast körs i IIS (version 7 eller senare). Applikationen körs i en App Pool med `.NET version 4.0 integrated`.  


### Förberedelser

#### Skapa huvudmapp för applikationen
Nu kommer vi gå vidare med att sätta upp projektet i IIS. Huvudmappen som IIS kommer gå mot i det här exemplet är `C:/wwwroot`. Om du vill följa anvisningarna exakt, skapa en sådan mapp på den datorn du avser sätta upp Hajk på.

#### Flytta och skapa mappar och filer
Flytta hela mappar enligt tabell nedan:

| Från                            | Till                    |
| ------------------------------- | ----------------------- |
| `C:/install/mapservice`         | `C:/wwwroot/mapservice` |
| `C:/projekt/Hajk/admin/dist`    | `C:/wwwroot/admin`      |
| `C:/projekt/Hajk/admin/release` | `C:/wwwroot/client`     |

Nu har `C:/wwwroot` tre undermappar. Men vi ska göra ett till ingrepp. 

Gå in i mappen `C:/wwwroot/client`. Markera alla mappar och filer inuti (förslagsvis genom att trycka `Ctrl+A` i Windows utforskare) och klipp ut markeringen (`Ctrl+X`). Gå upp en nivå (så du nu står i `C:/wwwroot`) och klistra in (`Ctrl+V`). När flytten är klar kan du radera den nu tomma mappen `client`. 

Därefter, skapa tre till mappar i `C:/wwwroot` och döp dem till `util`, `Temp` och `Upload` (var noga med stora och små bokstäver).

#### Flytta proxy-filer
En GET-proxy som kan användas av klienten ska läggas i den nyligen skapade mappen `util`. Ta innehållet från `C:/projekt/Hajk/proxy/mvc` och flytta till mappen `C:/wwwroot/util`.

Det finns även en POST-proxy som kan användas av klienten. Flytta filerna `postproxy.aspx` och `postproxy.aspx.cs` från `C:/projekt/Hajk/proxy/aspnet` direkt till huvudmappen `C:/wwwroot`.

#### Kontrollera att allt kom med
Nu bör `C:/wwwroot` innehålla följande filer och mappar:

| Innehåll i `wwwroot` |
| -------------------- |
| `admin/`             |
| `assets/`            |
| `fonts/`             |
| `js/`                |
| `mapservice/`        |
| `Temp/`              |
| `Upload/`            |
| `util/`              |
| `index.html`         |
| `postproxy.aspx`     |
| `postproxy.aspx.cs`  |

#### Autentisering och rollstyrning
Om autentisering och rollstyrning skall användas måste postproxy.aspx och postproxy.aspx.cs flyttas in i util-mappen. Dessutom skall `C:/projekt/Hajk/proxy/HTTPProxy` användas istället för `C:/projekt/Hajk/proxy/mvc`.

Denna funktionalitet innefattar även specifika inställningar till IIS och kräver att Windows Authentication är aktiverat. Se separat dokumentation för ytterligare detaljer.

#### Sätt rätt behörigheter på filer och mappar
För att webbservern ska kunna skriva till vissa mappar i vår huvudmapp behöver rätt behörighet sättas.

Specifikt är det den användaren som IIS App Pool körs på (mer om det i nästa avsnitt) som ska ha skrivbehörighet till mapparna:

| Mappnamn              |
| --------------------- |
| `mapservice/App_Data` |
| `Temp/`               |
| `Upload/`             |

Som standard heter IIS användare *IIS_IUSRS*. Ge därför *skrivbehörighet* för de tre ovanstående mappar till IIS_IUSRS.

### Uppsättning i IIS
1. Öppna Internet Information Services (IIS)-hanteraren 
1. I vänsterpanelen, högerklicka på Webbplatser och välj Lägg till webbplats
1. Ange ett namn (t ex "Hajk"). Välj en programpool vars egenskaper är *.NET 4.0 - Pipeline: Integrated*
1. Som fysisk sökväg ska du peka ut vår huvudmapp, dvs `C:/wwwroot`
1. Skapa en bindning från exempelvis `localhost` på port 80. För fler inställningar och uppsättning så att tjänsten är åtkomlig "utifrån" rekommenderas att ta kontakt med en it-administatör i din organisation. De kan vara behjälpliga med diverse andra inställningar som är viktiga vid skarp drift, som till exempel säkra anslutningar över HTTPS.

När detta steg är utfört visas mappstrukturen i IIS. Expandera den nyaskapade webbplatsen så du ser alla mappar som ligger i den. Nu måste även mapparna admin, mapservice och util registreras som .NET-applikationer. Det görs enkelt genom att högerklicka på respektive mapp och välja `Konvertera till program`. 

#### Mime-typer
För att Hajk ska fungera korrekt bör du säkerställa att följande MIME-typer finns registrerade i IIS:

| Mime-typ                               | Filändelse |
| -------------------------------------- | ---------: |
| `application/x-font-woff`              | `.woff`    |
| `application/x-font-woff2`             | `.woff2`   |
| `application/vnd.google-earth.kml+xml` | `.kml`     |

MIME-typerna registreras också i IIS-hanteraren. Markera webbplatsen i vänsterpanelen och titta efter *MIME-typer* i huvudfönstret i programmet.

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
`{string} authentication_active` - Property som styr om autentisering-, och rollstyrningskonfiguration skall visas i gränssnittet.
#### router
`{array {object {name, title, default (optional) }}}` - Lista med flikar i applikationen.  

### Tjänst
Ge läs och skrivrättigheter till mappen App_Data för den avnändare som är registrerad i IIS.
