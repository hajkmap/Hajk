## Contributing

> **A note on backends**
>
> As you probably know by now, Hajk consists of three separate applications: Client, Admin and Backend. If this concept is new to you, please see [the description here](https://github.com/hajkmap/Hajk/wiki/Installation-guide-%28for-pre-packaged-releases%29#the-three-editions-of-hajk).
>
> Prior to 2021, Backend was a .NET project. In the spring of 2021, the _Hajk NodeJS backend_ became available, finally making Hajk an OS-independent webGIS solution. At the time of writing (mid 2021), some features are exclusively available in the NodeJS backend, but otherwise the both backends have similar functionality and API.

### Required tools

- Latest LTS of NodeJS
- Latest Git
- Visual Studio 2019 (for the .NET backend)

The Client (`new-client`), Admin (`new-admin`) and NodeJS backend (`new-backend`) applications can be built and deployed on any OS supported by recent Git and Node versions (tested on macOS, Windows and Linux).

The .NET backend (`backend`) component, requires Visual Studio 2019 for Windows.

Please note that if you plan on working on the obsolete [Hajk 2](https://github.com/hajkmap/Hajk/tree/hajk2.x) branch, you must use Visual Studio 2015 instead.

### User documentation

End-user documentation can be found in [Hajk's Wiki](https://github.com/hajkmap/Hajk/wiki). Writing user documentation is a very important way of contributing to the project and suits well for organizations that wish to contribute but lack coding capabilities.

### Design guidelines

Hajk is built using **Material Design** components from the [Material UI](https://material-ui.com/) project. Make sure to familiarize yourself with all the available components. It is crucial for the user experience that the design principles are followed throughout the system.

### Git workflow

Hajk strictly enforces the use of **Git Feature Branch Workflow** as described in [this document](https://www.atlassian.com/git/tutorials/comparing-workflows/feature-branch-workflow).

In short, developing a new feature, would look something like:

1. Always fetch latest with `git fetch`.
1. Make sure you are in the develop branch by `git checkout develop`.
1. Make sure that you've pulled all latest changes with `git pull`.
1. Create a new branch, let's say `feature/foobar`, by running `git checkout -b feature/foobar`
1. Don't forget to set upstream so that your newly created branch is pushed to GitHub: `git push --set-upstream origin feature/foobar`
1. Code… :neckbeard:
1. Regularly commit changes to your branch with `git commit -S -m "A good comment, can be multiline."`. (Note, the `-S` flag [signs your commit](https://help.github.com/en/articles/signing-commits), and signing commits is something you really should be doing.)
1. Regularly push your changes to GitHub with `git push`
1. Regularly merge changes from develop into your branch. That means that you will incorporate recent changes in develop and your local branch will stay up-to-date with latest developments. **This is the really important part.** You can do it like this: `git checkout develop && git fetch && git pull && git checkout feature/foobar && git merge develop`
1. When you're done coding, go to GitHub and create a new pull request. Make sure that you want to merge your branch into `develop`.
1. Administrators overlooking the project will get notified when you create your PR, take a look at the code and if everything looks fine merge it into `develop` and delete your feature branch from GitHub. You will still have a copy of your feature branch locally, but it can be safely removed by running `git branch -d feature/foobar`.

### Code standard

Hajk uses **ESLint** and **Prettier** to enforce code formatting across the project.

🔥 **Code that gets checked in must follow those rules.** 🔥

The `new-client` directory contains `.eslint` file, so it's easy to follow the rules. The recommended way is to use an editor that has extensions for ESLint and Prettier. It is also highly recommended to make the editor run Prettier on each file save (i.e. in VSCode it can be controlled by the `formatOnSave: true` flag).

**For a simple guide on setting up VSCode with ESLint, Prettier and some , see [this presentation](dokumentation/VSCodeSetup.pdf)**. (Swedish only)

It is also super easy to get Prettier running with almost any editor. Please [refer to the docs](https://prettier.io/).
