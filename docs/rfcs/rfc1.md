# H-RFC 1: Pluginkrav

_Ett förslag på vad som ska krävas av ett plugin för att ingå i standardbygget av Hajk._

Författat av:

- Jacob Wodzynski jacob.wodzynski@halmstad.se

- Henrik Hallberg henrik.hallberg@exploatering.goteborg.se

- Martin Kalén martin.kalen@sweco.se

**Förslag: Det görs en distinktion mellan standardplugin och community plugin.**

Nedan följer en beskrivning av de två plugintyperna. Därefter finns ett par stycken om anledningen till att förändringen behövs och hur vi föreslår att den ska genomföras.

## Standardplugin

För att bli ett standardplugin krävs antingen:

- minst 2 användare (organisationer) av pluginet, eller

- möjligt att starta i gång pluginet som en del av standardkonfiugration utan att ha tillgång till särskilda externa API:er.

  - Sättet som det löses på är genom att backenden tillhandahåller så kallat mockdata.

  - Standardkonfiguration (som är med i releaserna) inkluderar nödvändiga inställningar för att använda mockdata out-of-the-box.

Dessutom krävs det att:

- tredjepartsbibliotek plockas in endast vid verkliga behov (avgörs från fall till fall)

- tredjepartsbibliotek som endast används av ett plugin måste användas på ett sätt som gör testning möjligt även utan verksamhetsspecifika API:er (dvs med ovan nämnt mockdata)

- inga beroenden som innebär krav på kommersiella licenser används

Plugins som inte lever upp till dessa krav blir i stället Community plugins.

## Community plugin

Alla andra bidrag välkomnas och blir Community plugins. Ett sådant plugin behöver inte uppfylla kraven för standardplugin. Det innebär att:

- de är inte en del av Hajks repository utan hanteras separat

- beroenden som dessa ingår därmed inte i package.json

- ansvaret för förvaltning ligger på användaren/na av pluginet

## Motivering

- Mer stabil standard-Hajk då core-utvecklarna har möjlighet att exempelvis:

  - förvalta beroenden för samtliga delar som ingår,

  - uppgradera beroenden och kunna testa utfallet

- Mindre kod innebär:

  - en mindre angreppsvektor och i slutändan en säkrare produkt,

  - en snabbare produkt,

  - en mer överskådlig produkt för:

    - användare

    - administratörer (färre sällananvända funktioner innebär färre inställningar att hålla koll på)

    - systemansvariga (lättare att besvara "vad kan" respektive "vad kan inte göras?")

    - utvecklare

  - en mer lättdokumenterad och lättanvänd produkt

    - lägre tröskel för dokumentationsansvariga att hålla dokumentationen á jour

- Tydligare distribution och "välkomstprocess" för nya användare

  - Innan uppdelning i standard- och community plugins har det varit svårt att få en överblick över vilka delar av Hajk som kräver tredjeparts-API:er. Med en tydlig uppdelning blir det enklare för nytillkomna användare att förstå produktens möjligheter och eventuella beroenden mot andra system

## Genomgång av våra plugins

Nedan följer en genomgång av alla plugins som finns i Hajks master-branch vid 2023-10-24. Pluginen har delats upp på plugin som inte kräver någon "speciell" konfiguration (alltså att de bara använder standard-funktionalitet som finns i OpenLayers exempelvis) och plugins som kräver koppling till specifika OGC-tjänster eller tredjeparts-API:er.

- Plugins som inte kräver någon speciell konfiguration

  - Anchor (Dela-verktyget)

  - Bookmarks (Bokmärken)

  - Buffer (Buffra-verktyget)

  - Coordinates (Visa koordinat-verktyget)

  - Draw (Gamla rita verktyget. - Förslag: tas bort)

  - Export (Gamla utskrifts-verktyget, Förslag: tas bort)

  - InfoDialog (Verktyg för att visa en dialog-ruta vid laddning av kartan)

  - LayerComparer (Lagerjämförar-verktyget)

  - LayerSwitcher (Lagerhanteraren)

  - Location ("Visa min position"-verktyget)

  - Measure (Gamla mät-verktyget, Förslag: tas bort)

  - Measurer (Mät-verktyget)

  - Print (Utskrifts-verktyget)

  - Sketch (Rit-verktyget)

- Plugins som kräver tredjeparts-API:er/OGC-tjänster

  - Collector ("Tyck till!"-verktyget)

  - Documenthandler (Dokumenthanteraren)

  - Edit (Redigerings-verktyget)

  - Fir (FIR-verktyget)

  - Fme (Gamla FME-server-verktyget, Förslag: tas bort)

  - FmeServer (FME-server-verktyget)

  - GeosuiteExport (Borrhåls-verktyget)

  - Informative (Gamla dokumenthanterar-verktyget, Förslag: tas bort)

  - Kir (KIR-verktyget)

  - Routing (Navigations-verktyget)

  - StreetView (Gatuvy-verktyget)

  - TimeSlider (Tidslinje-verktyget)

  - VTSearch (Västtrafik-verktyget)

Utöver pluginen ovan finns även två exempel-plugins som används för att guida nya utvecklare. (Dummy, Template).

På grund av användarantal och kopplingar till API:er som inte finns tillgängliga för vem som helst rekommenderar vi att följande plugins blir Community plugins:

- GeosuiteExport (SBF Göteborg)

- vtsearch (Västtrafik)

## Lösningsförslag

Vi föreslår att vissa plugins konverteras till Community plugins, och att vissa plugins tas bort helt och hållet. De plugins som föreslås att tas bort är plugins där en ny variant av pluginet har tagits fram för minst sex månader sedan.

### Teknisk lösning

Vi föreslår att plugins som konverteras till Community plugins flyttas till separata fork:ar som ägs av den organisation som har tagit fram pluginet. Vi förstår att det kan behövas tid för att kunna genomföra flytten, och föreslår därför ett "väntrum" i form av en fork som ägs av Hajkmap-teamet. Konverteringen av de plugins som påverkas kommer självklart ske i dialog med den organisation som har tagit fram pluginet.

### Dokumentation

Det är viktigt att det är enkelt att få fram information över vilka core och Community plugins som finns tillgängliga i Hajk. Vi föreslår att en lista över våra plugins tas fram och publiceras i Wikin i Hajk-repot.

I listan över våra plugins bör även grundläggande dokumentation kring hur våra plugins sätts upp finnas.

## Konsekvenser

Direkta konsekvenser av beslutet blir att vissa plugins (Community plugins) kommer att flyttas ut till separata forks, och att vissa plugins kommer plockas bort helt.

- Plugins som föreslås att bli Community plugins:

  - GeosuiteExport

  - vtsearch

- Plugins som föreslås att tas bort:

  - Draw

  - Export

  - Measure

  - FME

  - Informative

_Fotnot: H-RFC står för "Hajk Request for Comments" och anspelar på RFC som används vid framtagning av internetstandarder, se även [Wikipedia](https://en.wikipedia.org/wiki/Request_for_Comments)._
