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
