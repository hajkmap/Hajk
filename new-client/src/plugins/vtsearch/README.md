# Kartsidan

Kartsidan är en hemsida som används internt av Västtrafik för att kunna snabb identifiera vilka linjer som berörs av en trafikstörning.

# Utvecklingsmiljö

## Obligatoriska verktyg

- Visual Studio Code, https://code.visualstudio.com/Download
- Visual Studio, https://visualstudio.microsoft.com/downloads/
- Node JS, https://nodejs.org/en/download/
- Webbläsare såsom Chrome, Edge eller Firefox

## Obligatoriska insticksmoduler till Visual Studio Code

Gå in under Visual Studio Codes meny File -> Preferences -> Extentions, för att lägga till de de instickmoduler som krävs.

- Code Spell Checker
- ESLint
- npm
- Prettier

## Rekomenderade verktyg

- Kdiff3, https://sourceforge.net/projects/kdiff3/files/
- Posh GIT

#### Installtion av Posh GIT

1. Starta Powershell
2. Kör kommando, PS> Install-Module -Name posh-git -RequiredVersion 0.7.1
   Länk för mer info https://www.powershellgallery.com/packages/posh-git/0.7.1
3. Kör kommando, PS> Install-Module posh-git -Scope CurrentUser
   Länk för mer info https://jeffbrown.tech/installing-and-configuring-posh-git-with-powershell/
4. Kör kommando, PS> Import-Module posh-git
   Länk för mer info https://jeffbrown.tech/installing-and-configuring-posh-git-with-powershell/

#### Importering av Posh GIT

För att alltid importera post-git vid uppstart av PowerShell, gå in i profil-filen för din användare sexxxx under C:\Users\sexxxx\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1
Överst i filen lägg till raden "Import-Module posh-git". Då kommer Posh GIT att automatiskt laddas varje gång Power Shell körs.

## Steg för att komma igång

1. Hämta hem koden från Git, https://github.com/sweco-se/hajk-fork
2. Starta kommandotolken
3. Kör npm install i new-admin
4. Kör npm run build i new-admin
5. Kör npm install i new-client
6. Kör npm run build i new-client
7. Gå in under mappen backend och starta solutionfilen mapservice.sln
8. Bygg i projektet i Visual Studio
9. Start backend-projektet i Visual Studio och notera portnummret
10. Byt ut till rätt portnummer i new-client\public\appConfig.json
11. I Visual Studio kör en ny build, ev. behövs en clean innan på solution-filen
12. Bygg klienten, npm run build under new-client
13. Kör igång klienten, npm start under new-client
14. Öppna upp filen .env under new-client och ändra BROSWER från firefox till chrome
15. Öppna hela HAJK-mappen med Visual Studio Code och ädra alla localhost:55630 till localhost:[nytt portnummer]

# Tekniska krav

## Lista på tekniska krav

- Node.js, version 12
- .NET Framework, version 4.5.2
- IIS, version 10

# Dokumentation

Kartsidan bygger på öppna källkoden för Hajk som finns på GitHub, https://github.com/hajkmap/. Dokumentation av själva Kartsidan finns på Västtrafiks egna dokumenations hemsida Confluence under Team Geografi, https://confluence.vasttrafik.se/display/TIPu/Team+Geografi
_Observera_ att du måste ha konto med inloggning till Västtrafik för att kunna komma åt denna dokumentation.

## Lista på dokument

- Kartsidan 2 (Installation och grundkonfiguration), https://confluence.vasttrafik.se/display/TIPu/Kartsidan+2+%28Installation+och+grundkonfiguration%29+-+GEO
- Kartsidanadministration, https://confluence.vasttrafik.se/display/TIPu/Kartsidanadministration+-+GEO
- Systemdokumentation, https://confluence.vasttrafik.se/display/TIPu/Systemdokumentation+-+GEO

## Change log

I filen `new-client/src/plugins/vtsearch/CHANGELOG.md` noteras alla viktiga ändringar mellan varje release. Filen följer huvudsakligen formatet på [Keep a Changelog](http://keepachangelog.com), fast på svenska.

# Brancher och git

Generellt följer vi strukturen från [Nvie – A successful branching model](http://nvie.com/posts/a-successful-git-branching-model/).

## Commits

Skriv commitmeddelande på engelska. Försök organisera commits i logiska steg. Ibland är det en bra idé att köra `git rebase -i` på sin feature-branch innan man pushar eller mergar med develop.

## Master

Ska innehålla kod redo för produktion, vilket effektivt betyder senaste release.

## Develop

Innehåller all färdig ny funktionalitet som kommer att släppas i nästa release. Alla `feature`-brancher baseras på `develop`.

## Feature/

Varje ny funktionalitet byggs in en separat branch `feature/my-new-functionality`. Denna baseras alltid på `develop`.

## Fix/

Varje bugg årgärdas in en separat branch `feature/my-new-functionality`. Denna baseras alltid på `develop`.

## Hotfix/

I den händelse att något måste fixas akut i produktion skapas en `hotfix/omg-it-broke`-branch från `master`. I denna fixas problemet och mergas sedan tillbaks till `master` _och_ `develop`. Var noga med att tagga denna fix samt uppdatera change log om fixen förändrar funktionalitet för användare eller annat.
