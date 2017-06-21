# Hajk
Uppdaterad: 2016-11-25

Detta är ett projekt som drivs av Stadsbyggnadskontoret Göteborgs Stad.  
Systemutvecklare är i huvudsak Sweco Position.  
Projektet drivs som ett samarbetsprojekt och är avsett att kunna återanvändas för generalla GIS-applikationer för webb.  
Licensformen bygger på en öppen samarbetslicens. (CC BY SA NC).  

Koden består av två delar; en serverdel och en klientdel. Serverdelen är programmerad i Microsoft .NET med tekniken WCF och kodspråket C#.  
Klientdelen är programmerad i JavaScript 2015. Kommunikationen mellan klient och server sker via HTTP och är RESTful implementerad.  

Klienten innehåller två separata applikationer, en kartvy och en administrationsvy.  

JavaScript byggs i applikationen med hjälp av uppgiftshanteraren Grunt.  
För att bygga projetketet så krävs programvarorna Visual Studio och Node JS.

## Installation

### Ladda hem koden
Börja med att Installera GIT om det inte redan är gjort.  
[https://git-scm.com/download/win](https://git-scm.com/download/win "Länk")  
Säkerställ under installationen att git installeras globalt för windows och läggs till i PATH.  
Verifiera installationen genom starta kommandopromten och skriva:  
`git --version`

Skriv därefter till exempel:  
`cd c:\Projekt`  
för att gå till lokal projektmapp.  

Ange följande kommando för att ladda hem koden:  
`git clone https://github.com/hajkmap/hajk.git`  

### Installera Node JS
För att installera node gå till [https://nodejs.org/en/](https://nodejs.org/en/ "länk").
Ladda hem och installera den version som är markerad som Stable.

Verifiera installationen genom starta kommandopromten och skriva:  
`node --version`

### Installera Visual Studio Community Edition
För att installera visual studio gå till [https://www.visualstudio.com/post-download-vs?sku=community&clcid=0x409](https://www.visualstudio.com/post-download-vs?sku=community&clcid=0x409 "länk.")

## Driftsättning
### Första gången projektet klonas.
#### Installera beroenden
`cd c:\Projekt\Hajk\client`  
`npm install`  
`cd c:\Projekt\Hajk\admin`  
`npm install`

#### Installera externa bibiliotek
`cd c:\Projekt\Hajk\client`  
`grunt dependencies`

----------
#### Driftsättning Klient
Öppna kommandopromten och gå till projektets mapp:  
`cd c:\Projekt\Hajk\client`

Bygg version för test. (målmapp: **dist**)  
`grunt build`

Bygg version för driftsättning. (målmapp: **release**)  
`grunt release`

Starta en lyssnare som lyssnar på ändringar i filsystemet ochg bygger per automatik.  
`grunt debug`

#### Driftsättning Admin
Bygg version för driftsättning/test. (målmapp: **dist**)  
`cd c:\Projekt\Hajk\admin`  
`grunt`  
Detta kommer att skapa en mapp som heter dist. I denna återfinns två html-filer, index.html och debug.html.  
Kör dessa i lämplig webbserver, debug.html har full sourcemap till jsx. Index.html kör minifierad kod.

#### Driftsättning server
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
	"target": "map",				// {string} Målelement (ändra inte)  
	"center": [410719, 6575675 ],	// {array {number}}centrumkoortinat  
	"projection": "EPSG:3006",		// {string} projektion  
	"zoom": 7,	 					// {number} startzoom  
	"maxZoom": 12,					// {number} Högsta möjliga zoomnivå  
	"minZoom": 4,					// {number} Lägsta möjliga zoomnivå  
	"resolutions": [],				// {array {number}} Lista med upplösningar för tile-grid (specificeras vid tilecache)  
	"origin": [],					// {array {number}} Startkoordinat för tile-grid  
	"extent": [],					// {array {number}} Utbredning för tile-grid  
	"logo": ""						// {string} URL för sökväg till logo  
	"colors": {						// {object} Färgtema  
		"primaryColor": "#1B78CC",	// {string} Huvudfärg  
		"secondaryColor": "#FFF"	// {string} Komplementfärg
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
