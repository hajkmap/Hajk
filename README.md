# Hajk 3
_An open source web GIS solution based on OpenLayers_

![alt text](https://github.com/hajkmap/Hajk/raw/master/design/demo-hajk3-2.png "Hajk 3 with all tools visible")


## Quick start
_Note that Hajk consists of 3 applications: the main 'client' (which is the web map front end), 'admin' (which basically is a frontend for client's configuration files) and 'mapservice' (the backend server application which has a REST API)._

1. Clone the repository: `git clone https://github.com/hajkmap/Hajk.git`.
1. The client app is configured by editing `new-client/public/appConfig.json`. Make sure that `mapserviceBase` is a valid URL to a running instance of MapService that is reachable from your computer (see the following steps for how to deploy a working backend).
1. The client application resides inside `new-client`, so you can do: `cd new-client` and then `npm i && npm start`. (Note that if you have not yet configured a working backend in `appConfig.json`, you will get an error here – don't worry, we'll fix that soon.)
1. The admin application is located in `new-admin`. To get it running do `cd new-admin && npm i && npm start`.
1. The client and admin are accompanied by a backend (and an optional proxy) written in .NET. Open both projects in Visual Studio (in `mapservice` and `util` if you need a proxy), then Build and Publish.
1. Deploy to IIS, make sure that everything is running (choose "Browse" from IIS to see the mapservice page that lists available commands - if you see that, you're good to go). Make sure that the URL your mapservice is running on is the same as specified in client's `appConfig.json`. 
1. Now you should have client running on localhost:3000 and admin on localhost:3001. Open a browser window and check them out!

To build admin or client, just do `npm run build` instead of `npm start`. This will create a subfolder (`build`) that you can rename and serve as static files from any web server.

If you plan to develop for Hajk, make sure to read the next section on code standard for the project.

## Contributing

### Required tools
* Latest Git
* Latest LTS of Node.js
* Visual Studio 2019 (for Hajk 3) or 2015 (for [Hajk 2](https://github.com/hajkmap/Hajk/tree/hajk2.x))

`client` and `admin` can be built on any OS supported by recent Git and Node versions (tested on macOS, Windows and Linux). 

The `mapservice` component, which is a .NET project, requires however Visual Studio 2019 for Windows (as it has not been ported to .NET Core yet). Please note that if you plan on working on the [Hajk 2](https://github.com/hajkmap/Hajk/tree/hajk2.x) branch, you must use Visual Studio 2015 instead. 

### User documentation
There is an ongoing effort to bring the [user documentation](https://github.com/hajkmap/Hajk/wiki) up to date with the new functionality of Hajk 3. User documentation can be found in [Hajk's Wiki](https://github.com/hajkmap/Hajk/wiki). Creating user documentation is a very important way of contributing to the project and suits well for organizations that wish to contribute but lack coding capabilities.

### Design guidelines
Hajk is built using **Material Design** components from the [Material UI](https://material-ui.com/) project. Make sure to familiarize yourself with all the available components. It is crucial for the user experience that the design principles are followed throughout the system. 

### Git workflow
Hajk strictly enforces the use of **Git Feature Branch Workflow** as described in [this document](https://www.atlassian.com/git/tutorials/comparing-workflows/feature-branch-workflow). 

In short, developing a new feature, would look something like:
1. Always fetch latest with `git fetch`.
1. Make sure you are in master branch by `git checkout master`.
1. Make sure that you've pulled all latest changes with `git pull`.
1. Create a new branch, let's say `three-d-mode`, by running `git checkout -b three-d-mode`
1. Don't forget to set upstream so that your newly created branch is pushed to GitHub: `git push --set-upstream origin three-d-mode`
1. Code… :neckbeard:
1. Regularly commit changes to your branch with `git commit -S -m "A good comment, can be multiline."`. (Note, the `-S` flag [signs your commit](https://help.github.com/en/articles/signing-commits), and signing commits is something you really should be doing.)
1. Regularly push your changes to GitHub with `git push`
1. Regularly rebase your branch from master. That means that you will incorporate recent changes in master into your local branch. **This is the really important part.** You can do it like this: `git fetch && git rebase master`.
1. When you're done coding, go to GitHub and create a new Pull request, so that your branch can be merged up to `master`. 
1. Administrators overlooking the project will get notified when you create your Pull request, take a look at the code and if everything looks fine merge it into `master` and delete your feature branch from GitHub. You will still have a copy of your feature branch locally, but it can be safely removed by running `git branch -d three-d-mode`. 

### API documentation
This project uses [JSDoc](https://jsdoc.app/index.html) to document JavaScript.

The comment format of JSDoc is well-known and feels familiar to most coders. In addition, there are many plugins for editors (such as [Document This](https://marketplace.visualstudio.com/items?itemName=joelday.docthis) for Visual Studio Code) that simplify adding documentation.

Make sure that you understand how to comment with JSDoc by reading the documentation. A good [starting point is here](https://jsdoc.app/about-getting-started.html). Additionally, a list of [all available commands is here](https://jsdoc.app/index.html#block-tags).

JSDoc generates a `docs` folder (inside `new-client`) that contains browsable API documentation. 

When you've added new code (**with meaningful comments**), make sure to update the API docs. It is done easily with `npm run createdocs`.

However, no automatic doc generator will do your job, which is **writing meaningful comments inside your code**.

### Code standard

Hajk 3 uses **ESLint** and **Prettier** to enforce code formatting across the project.

🔥 **Code that gets checked in must follow those rules.** 🔥

The `new-client` directory contains `.eslint` file, so it's easy to follow the rules. The recommended way is to use an editor that has extensions for ESLint and Prettier. It is also highly recommended to make the editor run Prettier on each file save (i.e. in VSCode it can be controlled by the `formatOnSave: true` flag).

**For a simple guide on setting up VSCode with ESLint, Prettier and some , see [this presentation](dokumentation/VSCodeSetup.pdf)**. (Swedish only)

It is also super easy to get Prettier running with almost any editor. Please [refer to the docs](https://prettier.io/).

# Docs from Hajk 2

## Innehåll

- [Hajk](#hajk)
  - [Innehåll](#inneh%C3%A5ll)
  - [Installation verktyg](#installation-verktyg)
    - [Installera Git](#installera-git)
    - [Installera Node.js](#installera-nodejs)
    - [Installera Grunt](#installera-grunt)
    - [Installera Visual Studio Community Edition](#installera-visual-studio-community-edition)
  - [Kompilering / Bygga koden](#kompilering-bygga-koden)
    - [Ladda ner koden](#ladda-ner-koden)
    - [Första gången projektet klonas](#f%C3%B6rsta-g%C3%A5ngen-projektet-klonas) - [Installera beroenden](#installera-beroenden) - [Paketera externa bibliotek](#paketera-externa-bibliotek) - [Bygg klientdelen](#bygg-klientdelen) - [Bygg admindelen](#bygg-admindelen) - [Bygg backend-delen (servern)](#bygg-backend-delen-servern) - [Bygg proxy-applikation (HTTPProxy)](#bygg-proxy-applikation-httpproxy)
  - [Sätta ihop Hajk](#s%C3%A4tta-ihop-hajk)
    - [Skapa huvudmapp för applikationen](#skapa-huvudmapp-f%C3%B6r-applikationen)
    - [Flytta och skapa mappar och filer](#flytta-och-skapa-mappar-och-filer)
    - [Flytta proxy-filer](#flytta-proxy-filer)
    - [Kontrollera att allt kom med](#kontrollera-att-allt-kom-med)
  - [Installation och konfiguration](#installation-och-konfiguration)

Hajk är ett projekt som drivs av flera organisationer i Västsverige, bl a Stadsbyggnadskontoret Göteborgs Stad, Kungsbacka kommun,
Alingsås kommun, Varbergs kommun, Halmstads kommun.

Projektet drivs som ett samarbetsprojekt och är avsett att kunna användas för generalla GIS-applikationer för webb.

Licensformen bygger på en öppen samarbetslicens. (CC BY SA NC).

Applikationen består av två delar: en serverdel och en klientdel. Serverdelen är programmerad i .NET med tekniken WCF och kodspråket C#. Klientdelen är skriven i JavaScript (ES2015). Kommunikationen mellan klient och server sker via HTTP enligt REST.

Klienten innehåller två separata webbapplikationer: en kartvy och en administrationsvy.

Serverdelen byggs i Visual Studio och driftsätts i IIS. Klientdelen (med de två vyerna, karta och administation) bygger på Node.js och nyttjar ett flertal NPM-paket (exempelvis React och Babel) samt byggs med hjälp av uppgiftshanteraren Grunt. Källkoden versionshanteras i Git och finns tillgänglig på Github.

Nedan redogörs tillvägagångssättet för att installera de verktyg som krävs för att bygga Hajk (Git, Visual Studio Community Edition och Node.js mm) följt av hur man bygger ihop en release.

För installation och konfiguration i IIS hänvisas till Systemdokumentationen som finns i mappen dokumentation.

---

## Installation verktyg

### Installera Git

Börja med att installera Git om det inte redan är gjort. Ladda ner en version för ditt operativsystem från https://git-scm.com/download/win. Installera med default-inställningar. Därmed bör Git installeras globalt för Windows och läggas till i `$PATH` .

Starta en kommandoprompt, exempelvis cmd, Windows Powershell eller Git Bash. Verifiera installationen genom kontrollera vilken version av Git som har installerats:

```bash
git --version
```

> Tips: du kan med fördel använda den kommandoprompt som installerades med Git. Sök i Windows startmeny efter `Git Bash`, starta den, och verifiera installationen genom att skriva kommandot ovan.
>
> Fördelen med Git Bash är att du har tillgång till vanliga Unix-kommandon som `ls`, `pwd`, med flera, samt en fungerande auto-komplettering (börja skriva en sökväg och tryck på `TAB` för att testa). Dessutom finns Git med all säkerhet i `$PATH` när du använder Git Bash.

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

> Tips: Flaggan `-g` i kommandot ovan anger att NPM ska installera paketet globalt, istället för enbart i nuvarande projekt (vilket är default).

> Info: Kommandot `i` ovan är förkortning av `install`. Du kan således även skriva `npm install -g grunt-cli`, men det kan vara bra att känna till detta kortkommando.

### Installera Visual Studio Community Edition

För att installera Visual Studio gå till https://www.visualstudio.com/thank-you-downloading-visual-studio/?sku=Community&rel=15, ladda ner och installera programmet. Det finns många val som kan göras här med det som är nödvändigt för Hajk är att ASP.NET-komponenterna installeras.

---

## Kompilering / Bygga koden

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

### Första gången projektet klonas

> Info: efter den första kloningen (`git clone`-kommandot ovan) behöver nödvändiga paket som Hajk är beroende av att installeras av NPM (Node Package Manager). Därefter måste beroendena paketeras med hjälp av Grunt. Följ därför instruktioner under rubrikerna _Installera beroenden_ och _Paketera externa bibliotek_. Därefter, fortsätt till _Vanligt byggförfarande_.

#### Installera beroenden

```bash
cd C:\projekt\Hajk\client
npm install
cd ..\admin
npm install
```

> Info: Kommandot `npm install` läser filen `package.json` och installerar de paketen som definieras där som beroenden. Paketen läggs i mappen `node_modules` under respektive del av koden (klient- respektive admindelen).

#### Paketera externa bibliotek

```bash
cd c:\Projekt\Hajk\client
grunt dependencies
```

> Info: Kommandot `grunt dependencies` bygger ihop ett flertal hjälpbibliotek och paketerar dem till en fil, `dist/js/dependencies.min.js`.

---

### Bygg klientdelen

Grunt bygger två versioner av källkoden: en som är lite större men lättare att felsöka, och en som är mer komprimerad och används för skarp drift. Nedan visas hur båda delarna byggs:

```bash
# Öppna kommandoprompten och gå till projektets mapp
cd c:\projekt\Hajk\client

# Bygg version för test (målmapp "dist")
grunt build

# Bygg version för driftsättning. (målmapp "release")
grunt release
```

### Bygg admindelen

När admindelen byggs skapas också två versioner: en för test och en för driftsättning. Skillnaden mot klientdelen är att istället för att skapa separata mappar så skapas endast en mapp, `dist`, men den innehåller två filer: `index.html` och `debug.html`.

```bash
# Öppna kommandopromten och gå till projektets mapp
cd c:\projekt\Hajk\admin

# Bygg de två versionerna av admindelen (målmapp "dist")
grunt
```

### Bygg backend-delen (servern)

- Öppna Utforskaren och navigera till mappen som innehåller backend-koden (i det här exemplet, `C:\projekt\Hajk\backend`
- Dubbelklicka på `MapService.sln`
- Visual Studio öppnas
- I `Solution Explorer` markera projektet `MapService`
- I huvudmenyn, välj `Build > Build Solution`
- Invänta tills kompileringen är klar (du ser status i `Output`-fönstret längst ner, när det står något i stil med `Build: 2 succeeded, 0 failed, 0 up-to-date, 0 skipped` så är det klart)
- I huvudmenyn, välj `Build > Publish MapService`
- I fönstret som visas nu finns möjlighet att ändra `Target Location`, alltså stället dit backend-applikationen kommer att publiceras. Default-värde är `C:\install\mapservice\`. Du kan låta det vara kvar eller ändra till något annat. Huvudsaken är att du **vet var filerna läggs** för de kommer behövas senare när vi sätter ihop Hajk.

### Bygg proxy-applikation (HTTPProxy)

- Öppna Utforskaren och navigera till mappen som innehåller proxy-koden (i det här exemplet, `C:\projekt\Hajk\proxy\HTTPProxy`
- Dubbelklicka på `Proxy.sln`
- Visual Studio öppnas
- I `Solution Explorer` markera projektet `Proxy`
- I huvudmenyn, välj `Build > Build Solution`
- Invänta tills kompileringen är klar (du ser status i `Output`-fönstret längst ner, när det står något i stil med `Build: 1 succeeded, 0 failed, 0 up-to-date, 0 skipped` så är det klart)
- I huvudmenyn, välj `Build > Publish Proxy`
- I fönstret som visas nu finns möjlighet att ändra `Target Location`, alltså stället dit backend-applikationen kommer att publiceras. Default-värde är `C:\install\proxy\`. Du kan låta det vara kvar eller ändra till något annat. Huvudsaken är att du **vet var filerna läggs** för de kommer behövas senare när vi sätter ihop Hajk.

---

## Sätta ihop Hajk

Om du har följt anvisningarna så långt har du de tre _kompilerade_ delarna som applikationen utgörs av på följande ställen:

| Del     | Plats                            |
| ------- | -------------------------------- |
| backend | `C:/install/mapservice`          |
| admin   | `C:/projekt/Hajk/admin/dist`     |
| client  | `C:/projekt/Hajk/client/release` |

> Observera: som det nämndes tidigare i avsnittet om klientdelen så byggdes den i en drift- och en testversion. För driftsättning nu kommer vi använda den skarpa driftversionen, som alltså ligger i `release`. Men kom ihåg att även testversionen finns, i mappen `dist`, och instruktionerna här fungerar även för den. Byt bara ut mapparna mot varann.

> Info: Projektets backend-del är en .NET-applikation som i Windowsmiljö enklast körs i IIS (version 7 eller senare). Applikationen körs i en App Pool med `.NET version 4.0 integrated`.

### Skapa huvudmapp för applikationen

För att underlätta installationen av Hajk kan man kopiera de tre _kompilerade_ delarna till samma struktur som sedan ska användas i IIS.
Huvudmappen i det här exemplet är `C:/wwwroot`. Om du vill följa anvisningarna exakt, skapa en sådan mapp på din datorn.

#### Flytta och skapa mappar och filer

Flytta hela mappar enligt tabell nedan:

| Från                             | Till                    |
| -------------------------------- | ----------------------- |
| `C:/install/mapservice`          | `C:/wwwroot/mapservice` |
| `C:/projekt/Hajk/admin/dist`     | `C:/wwwroot/admin`      |
| `C:/projekt/Hajk/client/release` | `C:/wwwroot/client`     |

Nu har `C:/wwwroot` tre undermappar. Men vi ska göra ett till ingrepp.

Gå in i mappen `C:/wwwroot/client`. Markera alla mappar och filer inuti (förslagsvis genom att trycka `Ctrl+A` i Windows utforskare) och klipp ut markeringen (`Ctrl+X`). Gå upp en nivå (så du nu står i `C:/wwwroot`) och klistra in (`Ctrl+V`). När flytten är klar kan du radera den nu tomma mappen `client`.

Därefter, skapa tre till mappar i `C:/wwwroot` och döp dem till `util`, `Temp` och `Upload` (var noga med stora och små bokstäver).

#### Flytta proxy-filer

Det finns en ny och en äldre proxy man kan välja på.

##### Ny proxy

Om autentisering och rollstyrning skall användas ska den nya proxyn som finns i mappen HTTPProxy användas. Se ovan hur man bygger ihop den.
Denna proxy ska kunna användas även om autentisering och rollstyrning inte används.

Ta innehållet från `C:/install/proxy` och flytta till mappen `C:/wwwroot/util`.

##### Äldre proxy

En GET-proxy som kan användas av klienten ska läggas i den nyligen skapade mappen `util`. Ta innehållet från `C:/projekt/Hajk/proxy/mvc` och flytta till mappen `C:/wwwroot/util`.

Det finns även en POST-proxy som kan användas av klienten. Flytta filerna `postproxy.aspx` och `postproxy.aspx.cs` från `C:/projekt/Hajk/proxy/aspnet` direkt till huvudmappen `C:/wwwroot`.

Den nya proxyn bör fungera lika bra som den gamla proxyn.

#### Kontrollera att allt kom med

Nu bör `C:/wwwroot` innehålla följande filer och mappar:

| Innehåll i `wwwroot` |                                 |
| -------------------- | ------------------------------- |
| `admin/`             |                                 |
| `assets/`            |                                 |
| `fonts/`             |                                 |
| `js/`                |                                 |
| `mapservice/`        |                                 |
| `Temp/`              |                                 |
| `Upload/`            |                                 |
| `util/`              |                                 |
| `index.html`         |                                 |
| `postproxy.aspx`     | (endast om äldre proxy används) |
| `postproxy.aspx.cs`  | (endast om äldre proxy används) |

## Installation och konfiguration

För installation och konfiguration i IIS hänvisas till Systemdokumentationen som finns i mappen dokumentation.
