# Hajk2
Uppdaterad: 2/29/2016 2:14:45 PM

Detta är ett projekt som drivs av Stadsbyggnadskontoret Göteborgs Stad.  
Systemutvecklare är i huvudsak Sweco Position.  
Projektet drivs som ett samarbetsprojekt och är avsett att kunna återanvändas för generalla GIS-applikationer för webb.   
Licensformen bygger på en öppen samarbetslicens. (Creative Common Zero CC0).

Koden består av två delar; en serverdel och en klientdel. Serverdelen är programmerad i Microsoft .NET med tekniken WCF och kodspråket C#.
Klientdelen är programmerad i JavaScript 2015. Kommunikationen mellan klient och server sker via HTTP och är RESTful implementerad.

Klienten innehåller två separata applikationer, en kartvy och en administrationsvy.

JavaScript byggs i applikationen med hjälp av uppgifshanteraren Grunt.  
För att bygga projetketet så krävs programvarorna Visual Studio och Node js.

##Installation

###Ladda hem koden
Börja med att Installera GIT om det inte redan är gjort.  
[https://git-scm.com/download/win](https://git-scm.com/download/win "Länk")  
Säkerställ under installationen att git installeras globalt för windows och läggs till i PATH.  
Verifiera installationen genom starta kommandopromten och skriva:  
`git --version`

Skriv därefter till exempel:  
`cd c:\Projekt` 
för att gå till lokal projektmapp.

Ange följande kommando för att ladda hem koden:  
`git clone https://github.com/Johkar/Hajk2.git`  

### Installera Node JS
För att installera node gå till [https://nodejs.org/en/](https://nodejs.org/en/ "länk").  
Ladda hem och installera den version som är markerad som Stable.

Verifiera installationen genom starta kommandopromten och skriva:  
`node --version`

### Installera Visual Studio Community Edition
För att installera visual studio gå till [https://www.visualstudio.com/post-download-vs?sku=community&clcid=0x409](https://www.visualstudio.com/post-download-vs?sku=community&clcid=0x409 "länk.")  

##Driftsättning
###Första gången projektet klonas.
####Installera beroenden    
`npm install`

####Installera externa bibiliotek  
`grunt dependencies`  

---------- 
####Driftsättning Klient
Bygg version för test. (målmapp: **dist**)  
`grunt build`  

Bygg version för driftsättning. (målmapp: **release**)  
`grunt release` 

Starta en lyssnare som lyssnar på ändringar i filsystemet ochg bygger per automatik.  
`grunt debug` 

####Driftsättning server
- Dubbelklicka på **backend.sln**  
- Välj från menyn `Build > Build Solution`  
- Markera i Solution Explorer projektet **mapservice**.    
- Välj från menyn `Build > Publish mapservice`  
- Ändra sökväg till mappen om så önskas. Standard är c:\install\backend.  

###Installera projektet i Internet Information Services (IIS > 7).

IIS kräver att server applikationen körs i en App Pool med .NET version 4.0 integrated.

I en driftsättningsmiljö så lägg förslagsvis applikationerna i två seperata mappar.  
Mapparna bör placeras i en skrivskyddad mapp; tex C:\data\www\hajk.

Skapa därefter två undermappar för applikationerna:  
C:\data\www\hajk\klient -- innehåller innehållet i **backend**  
C:\data\www\hajk\server -- innehåller innehållet i **release**

Skapa i IIS en två nya applikationer genom att högerklicka på valt side och välja:

**Lägg till program..**

För serverapplikationen så ange Alias: backend.  
För klientapplikationen så kan valfritt namn användas, detta bli sökväg till applikationen.




