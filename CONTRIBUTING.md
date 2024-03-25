## Contributing

> **A note on backends**
>
> As you probably know by now, Hajk consists of three separate applications: Client UI, Admin UI and Backend. If this concept is new to you, please see [the description here](https://github.com/hajkmap/Hajk/wiki/Installation-guide-%28for-pre-packaged-releases%29#the-three-editions-of-hajk).
>
> Prior to 2021, Backend implemented as a .NET application. In the spring of 2021, the _Hajk NodeJS backend_ became available, finally making Hajk an OS-independent webGIS solution. At the time of writing (spring 2024), a new .NET Backend became available which intends to implement the same API specification as the NodeJS backend. However, given the current usage statistic, interoperability and developer's activity, the NodeJS backend remains the most widespread and well-tested solution.

### Required tools

- Latest LTS of NodeJS
- Latest Git
- Visual Studio (only for the optional .NET backend)

The Client UI (`new-client`), Admin UI (`new-admin`) and NodeJS backend (`new-backend`) applications can be built and deployed on any OS supported by recent Git and Node versions (tested on macOS, Windows and Linux).

The .NET backend (`backend-dotnet`) component, requires Visual Studio for Windows.

### User documentation

End-user documentation can be found in [Hajk's Wiki](https://github.com/hajkmap/Hajk/wiki). Writing user documentation is a very important way of contributing to the project and suits well for organizations that wish to contribute but lack coding capabilities.

### Design guidelines

Hajk is built using **Material Design** components from the [Material UI](https://material-ui.com/) project. Make sure to familiarize yourself with all the available components. It is crucial for the user experience that the design principles are followed throughout the system.

### Git workflow

Hajk strictly enforces the use of **Git Feature Branch Workflow** as described in [this document](https://www.atlassian.com/git/tutorials/comparing-workflows/feature-branch-workflow).

#### Pre-requirements

**Create an issue on GitHub.** You will need the issue number to give your branch a good name in the steps that follow.

#### Steps in `git`

In short, developing a new feature, would look something like:

1. Always fetch latest with `git fetch`.
1. Make sure you are in the develop branch by `git checkout develop`.
1. Make sure that you've merged all upstream changes in `develop` with `git merge`.
1. Create a new branch and give it a name that relates to the issue you created on GitHub. E.g. if you created an issue called _"Add a blue button"_ and it has issue number #1234, your branch should be called `feature/1234-blue-button`. You create this branch by running `git checkout -b feature/1234-blue-button`
1. Don't forget to set upstream so that your newly created branch is pushed to GitHub: `git push --set-upstream origin feature/1234-blue-button`
1. Code… :neckbeard:
1. Regularly commit changes to your branch with `git commit -S -m "A good comment, can be multiline."`. (Note, the `-S` flag [signs your commit](https://help.github.com/en/articles/signing-commits), and signing commits is something you really should be doing.)
1. Regularly push your changes upstream (to GitHub) with `git push`
1. **Regularly merge changes that other developers might be doing, from `develop` into your branch.** That means that you will incorporate recent changes and your local branch will stay up-to-date with the latest developments. **Please don't overlook it. This is a really important part.** You can do it like this: `git stash && git checkout develop && git fetch && git merge && git checkout feature/1234-blue-button && git merge develop && git stash apply`. (If you feel comfortable enough with Git, there are of course shorter way of doing this, such as directly merging the upstream remote branch.)
1. When you're done coding, go to GitHub and create a new pull request. Make sure that you want to merge your branch into `develop`.
1. Hajk maintainers will get notified when you create the PR. They will review your PR and either accept and merge your branch (as well as delete it from the remote, as it's no longer needed) or (if the code isn't considered ready) request changes. After a successful merge you will still have a copy of your feature branch locally, but it can be safely removed by running `git branch -d feature/1234-blue-button`.

### Code standard

Hajk uses **ESLint** and **Prettier** to enforce code formatting across the project.

🔥 **Code that gets checked in must follow those rules.** 🔥

The `new-client` and `new-backend` directories contains all necessary configuration files. The recommended way is to use an editor that has extensions for ESLint and Prettier installed. It is also highly recommended to make the editor run Prettier on each file save (i.e. in VSCode it can be controlled by the `formatOnSave: true` flag).

**For a simple guide on setting up VSCode with ESLint, Prettier and some , see [this presentation](dokumentation/VSCodeSetup.pdf)**. (Swedish only)
