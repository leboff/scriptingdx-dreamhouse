# SFDX Dreamhouse App

## Salesforce DX Quick Start

> **Important:** Salesforce DX is available as a Pilot. Salesforce DX isn’t generally available unless or until Salesforce announces its general availability in documentation or in press releases or public statements. All commands, parameters, and other features are subject to change or deprecation at any time, with or without notice. Take care when implementing functionality developed with these commands or tools.</td>

The Salesforce Developer Experience (SFDX) starts with source code living in your version control system (VCS). It doesn’t matter which VCS you use, only that you use one. In this quick start, we’ll assume you’re using Git and Github, as this is where we’ve stored the Dreamforce ’16 Developer Keynote sample application, called the DreamHouse app, which we will use for this quick start.

## Set Up the Developer Workspace

Our first goal is to set up a developer workspace which we'll use to modify our application. It starts by cloning the repository. Use the command ...

    git clone https://github.com/forcedotcom/sfdx-dreamhouse.git

… or ...

    git clone git@github.com:forcedotcom/sfdx-dreamhouse.git

… to clone the repository. Then, open the directory.

    cd sfdx-dreamhouse

![image](https://cloud.githubusercontent.com/assets/746259/19616507/52c78698-97c9-11e6-8671-eba4c8bae9d5.png)

Cloning the repository pulls all the source code to the local filesystem. Before you start editing, though, you’ll want to check out your own branch. This is a best practice as defined by [Github Flow](https://guides.github.com/introduction/flow/).

    git checkout -b wadebranch

Now you’re working in your own branch, making it easier to submit updates to your team later on.

In SFDX we provide a comprehensive set of capabilities through our command-line interface, which is shipped as a Heroku plugin. You can take a look at all of the available commands by typing `sfdx force --help`.

![image](https://cloud.githubusercontent.com/assets/22328844/23097228/71a190c2-f5e3-11e6-9973-0a637c72ad20.png)

## Authorize the Developer Hub Org

To try out our application, we’ll first have to authorize with our Developer Hub (Dev Hub) org. The Dev Hub org provides a place to create and attach all of the orgs we’ll use throughout the full development lifecycle – not only scratch orgs, but also sandbox and production environments.

There are two ways to authorize with the Dev Hub org – using a traditional OAuth Web Server flow, where the user interactively logs in through a browser, or the JWT OAuth flow, in which you can use certificates to facilitate non-interactive logins. The latter is particularly useful for automated processes that are not able to interactively log in. For this document, we will use the OAuth Web Server flow and interactive login to the org.

To authorize the Dev Hub org, set it as your workspace default, and give it an alias, run this CLI command:

    sfdx force:auth:web:login -d -a "Hub Org"

A web-browser will open, allowing you to log in:

![image_2](https://cloud.githubusercontent.com/assets/746259/19540589/75df7560-9615-11e6-84d2-521997e0a7a8.png)

You’ll next need to authorize the SFDX "Global Connected App".

![image_3](https://cloud.githubusercontent.com/assets/746259/19540593/75e27134-9615-11e6-8299-c215ae38a334.png)

Once logged in, the CLI has been authorized.

![image](https://cloud.githubusercontent.com/assets/22328844/23097224/6743cc3a-f5e3-11e6-9b64-e8ee932b8c1c.png)

If you already have an authorized Dev Hub org, set it as the workspace default:

    sfdx force:config:set defaultdevhubusername=<username|alias>

Use the CLI command `sfdx force:org:list` to display the usernames and aliases for all the orgs you've authorized or created. 

From here, you’re authorized to interact with the Dev Hub org.

## Create a Workspace Scratch Org

Next step is to create a scratch org we can use during development. The scratch org is also created through the CLI, using a config file. The DreamHouse App repository provides a few example config files. If you type `cat config/workspace-scratch-def.json` you can see some of the options available:

```
{
  "Company": "Your Company",
  "Country": "US",
  "LastName": "lastnane",
  "Email": "xxx@xxx.com",
  "Edition": "Developer",
  "OrgPreferences" : {
    "S1DesktopEnabled" : true
  }
}
```

To create the scratch org, set it as your default, and give it an alias, type this CLI command:

    sfdx force:org:create -s -f config/workspace-scratch-def.json -a "default scratch org"

In less than a minute, the command should complete. You’ll get two items in the output: the Org ID and the username.

![image](https://cloud.githubusercontent.com/assets/22328844/23097225/694939ca-f5e3-11e6-9699-1120f82fa77b.png)

Notice that we didn’t get a password. Given that we can type the command `sfdx force:org:open`, which uses the Salesforce front door to automatically login with a cached authentication token, there’s no explicit need for us to know the password. Of course, we can use `--password` to pass in a known password if required.

At this point we have a brand new, empty, scratch org. We need to populate it with the source we first pulled out of Github. For this, we’ll use the source synchronization APIs, also available in the CLI.

If you want to use an existing scratch org, set it as the workspace default:

    sfdx force:config:set defaultusername=<username|alias>

## Push Source Metadata to Scratch Org

To push all the local source into the scratch org, type the command: 

    sfdx force:source:push
    
It will take a few moments, but soon all the metadata will be pushed into the scratch org.

![image](https://cloud.githubusercontent.com/assets/746259/19616528/196668e6-97ca-11e6-900b-d63cbad55306.png)

## Assign a Permset to the DreamHouse App

At this point we’re close to being able to run the DreamHouse app. But if you look at the source that was pushed to the org you'll see that the app uses a permission set to provide access.  Before we can access the app, we need to assign that permset using the CLI:

    sfdx force:user:permset:assign -n Dreamhouse

![image](https://cloud.githubusercontent.com/assets/22328844/23097229/73628920-f5e3-11e6-932a-6782e90e1393.png)

## Import Test Data

Finally, we don’t have any of the DreamHouse app data in the org. But we do have sample data in our repository. Using the CLI, we can use the SObject Tree API to import this data into the org.

    sfdx force:data:tree:import --plan data/sample-data-plan.json

![image](https://cloud.githubusercontent.com/assets/22328844/23097226/6de62330-f5e3-11e6-916f-744cf26dc8ab.png)

Now we’ve fully setup and configured our developer workspace. We’re ready to begin development.

## Open the WorkSpace Scratch Org

We can try out the application by opening our scratch org: `sfdx force:org:open`. Notice you won’t have to log in!

To open the DreamHouse app, click the App Launcher and then click DreamHouse:

![image_9](https://cloud.githubusercontent.com/assets/746259/19540595/75f33442-9615-11e6-87ad-1557af9d9709.png)

The app will re-launch to the DreamHouse app. Congratulations, you’ve just setup the application in a branch new scratch org.

## Modify the Application in the Force.com IDE 2

The next step is to modify our application, and to do this all we need is a code editor. It could be VIM, Sublime, Atom, or even Notepad. You can also use our updated Force.com IDE (also called Force.com IDE 2).

When you first open the IDE, you need to connect it to your local Git repository. Select the Git Repositories tab …

![image_10](https://cloud.githubusercontent.com/assets/746259/19540598/75f747da-9615-11e6-9f8c-274032728a15.png)

… and click "Add an existing local Git repository." Browse to your Git repository, select the result, and finish.

![image_11](https://cloud.githubusercontent.com/assets/746259/19540600/75f7e0fa-9615-11e6-854a-559e7ddf90c4.png)

Given we have already added an Eclipse project definition, we need to tell Eclipse to load the project. Right-click the repository and select "Import Projects…"

![image_12](https://cloud.githubusercontent.com/assets/746259/19540596/75f4a00c-9615-11e6-9e42-dc996394978d.png)

Click through the wizard, and then switch to the Project Explorer. You’ll see your project.

![image_13](https://cloud.githubusercontent.com/assets/746259/19540599/75f76c24-9615-11e6-9ab6-5742956f2bff.png)

You’re now able to use Eclipse to update your project and it’s fully integrated into the Git repository.

## Test the Application Using the Test Runner

We could now push our code changes back into our version control system. But first, let’s ensure all our unit tests pass. For this, we’ll use the Test Runner that’s integrated into the CLI.

    sfdx force:testrunner:run --configfile test/test-runner-config.json --jobname master

This command will run the master job that’s specified in the test runner config. By default, this is setup to run all our Apex tests and Selenium tests. All the Selenium jars and binaries will get downloaded as part of the execution of the test runner.

## Resources

For details on using sfdx-dreamhouse, please review the [Salesforce DX Developer Guide](https://org62.my.salesforce.com/0690M000006LTcY).

## Description of Files and Directories

* **sdfx-workspace.json**: Required by Salesforce DX. Configures your workspace.  Use this file to specify the parameters that affect your Salesforce development project.
* **config/\*-scratch-def.json**: Sample files that show how to define the shape of a scratch org.  You  reference one of these files when you create your scratch org with the force:org:create command.   In the sfdx-dreamhouse sample, the **workspace-scratch-def.json** file is also called by the **test/test-runner-config.json** file.
* **data/\*-data.json**: Sample files for loading data into the scratch org.  
* **Jenkinsfile**: Configuration file that defines the Jenkins CI/CD pipeline logic for a project with steps to build/test/deploy etc. captured in various stages.  The sample shows how to integrate Salesforce DX CLI commands using stages.
* **test/test-runner-config.json**: Required by Test Runner, although you can name the file anything you want.  Configures all aspects of the Test Runner, such as its jobs, the tests to run, the orgs to create, the data to load, and so on.
* **test/scripts/compile.sh**: Sample script that compiles the Selenium tests. Called by the **test/test-runner-config.json** file.
* **test/scripts/phantom.sh**: Sample script that sets up PhantomJS, which is a scripted, headless browser used for automating testing. Called by the **test/test-runner-config.json** file.
* **.forceignore**: Optional Salesforce DX file. Lists the directories and files that you want force:source:push/pull to ignore.
* **.project**:  Required by the Eclipse IDE.  Describes the Eclipse project. 
* **.gitignore**:  Optional Git file. Specifies intentionally untracked files that you want Git (or in this case GitHub) to ignore.

The following two directories contain source code:

* **force-app**: The source for the Dreamhouse Force.com app and tests.  The name of this directory corresponds to the value of the DefaultArtifact parameter of your **workspace-config.json** file.  
* **test/integration**: The Java source for the Selenium tests.


## Issues

Please log issues related to this repository [here](https://github.com/forcedotcom/sfdx-dreamhouse/issues).
