# H-RFC 2: Kärndistribution och community extensions

_En utökning av H-RFC-1, där begreppet "kärndistrubition" introduceras, samt begreppet "community plugins" omvandlas till "community extensions"._

Författat av:

- Jacob Wodzynski <jacob.wodzynski@halmstad.se>
- Henrik Hallberg <henrik.hallberg@exploatering.goteborg.se>

**Förslag: Definera hur Hajks kärndistrubitionen ska se ut samt sätt upp ramar för hur tillägg som inte ryms inom kärndistrubitionen (extensions) ska hanteras.**

Under flera års tid har Hajk-samverkan handskats med problem kopplat till faktumet att kodbasen har vuxit kraftigt, till exempel genom organisationsspecifika plugins och två backends. Det är önskvärt att på ett mer konkret sätt definiera vilka delar av produkten som Hajk-samverkan uttalat ansvarar för, och vilka delar som underhålls av separata konstellationer. För att uppnå detta föreslås en definiering av Hajks [kärndistribution](#kärndistribution) samt en definiering av [community extensions](#community-extensions).

## Kärndistribution

Vi föreslår att Hajks _kärndistribution_ består av följande tre delar:

- Admin UI
- Client UI (med en definierad uppsättning av _standardplugins_, se H-RFC-1 för en definition av kraven för dessa)
- Backend

**Hajk-samverkan åtar sig ansvar för att underhålla delarna i kärndistributionen samt utföra kringliggande uppgifter, så som dokumentation och paketering av releaser.**

## Community extensions

Hajk-samverkan välkomnar alla tillägg, utökningar och alternativa lösningar som inte ryms inom kärndistributionen i form av så kallade _community extensions_. Exempel på community extensions skulle kunna vara omskrivningar av existerande funktionalitet i andra programspråk, eller integrationer mot specifika verksamhetssystem (se H-RFC-1).

## Motivering

Förslaget skulle innebära:

- Konsolidering av arbetsinsatserna för en mer effektiv resursanvändning
- Ett tydliggörande av Hajk-samverkans ansvarsområde
- En klarare bild av vad Hajk-produkten innefattar

## Lösningsförslag

Vi föreslår att .NET-backenden hanteras som en community extension av berörda intressenter. I övrigt följs upplägget från H-RFC-1.

## Konsekvenser

Konsekvenserna kan delas upp i två huvudgrupper:

- a: konsekvenser för enskilda organisationer
- b: konsekvenser för Hajk (som produkt, arbetsverktyg och it-redskap)

Vidare, gällande konsekvenser av typ A måste man skilja mellan organisationer som idag i huvudsak använder de delar som föreslås ingå i kommande standarddistribution (typ A1), kontra dem som inte gör det (typ A2).

### Typ A1

För organisationer av typen A1 kommer konsekvenserna att bli positiva och ligga i linje med punkterna under avsnitt [Motivering](#motivering).

### Typ A2

För organisationer av typen A2 kommer konsekvenserna att variera beroende på hur stor grad av avvikelse från standarddistribution som organisationens uppsättning innehåller.

I några av fallen kommer förslaget inte att innebära någon förändring: det finns organisationer som redan idag har specialanpassade verktyg eller driftsätt som skiljer sig från officiella Hajk. De paketerar egna releaser för driftsättning inom den egna organisationen.

I andra fall kommer förslaget att innebära att en organisation (eller en grupp av flera organisationer), som väljer att använda funktionalitet som ligger utanför standarddistributionen, själv paketerar Hajk och inkluderar de delar som önskas ingå i just deras uppsättning. I praktiken kommer de att arbeta på samma sätt som vissa organisationer redan gör, se föregående stycke.

### Typ B

Konsekvenserna för Hajk, som produkt, arbetsverktyg och it-redskap, ligger i linje med det som redovisas under avsnitt [Motivering](#motivering) och innebär bland annat:

- Konsolidering av arbetsinsatserna för en mer effektiv resursanvändning
- Ett tydliggörande av Hajk-samverkans ansvarsområde
- En klarare bild av vad Hajk-produkten innefattar

### Konsekvenser för samverkan

Slutligen ska konsekvenserna för projektets aktiva utvecklare och övriga inblandade inte förringas.

Dessa har under en längre tid begränsats och hindrats i sitt arbete på grund av en otydlighet kring vad som förväntas av dem. I vissa fall har ny funktionalitet (exempelvis databasbaserad backend och live-uppdateringar i Admin) fått hållas tillbaka. I andra fall har ny funktionalitet tillkommit, men så småningom uppdagades det att den endast fungerar med en viss typ av uppsättning, vilket i sin tur har krävt avsättning av resurser för efterarbete.

Just det sistnämnda, att _viss funktionalitet endast fungerar med en viss typ av uppsättning_, upplevs som väldigt märkligt och problematiskt i den rådande situationen, där det officiellt endast finns _en_ Hajk.

**En klar definition av vad som är Hajks standarddistribution, respektive vad som ingår i dess ekosystem av community extensions, skulle råda bot på många av problemen som tidigare upplevts inom samverkan.**

_Fotnot: H-RFC står för "Hajk Request for Comments" och anspelar på RFC som används vid framtagning av internetstandarder, se även [Wikipedia](https://en.wikipedia.org/wiki/Request_for_Comments)._
