Installer design

Basic workflow of the current design:
1. Install node packages
2. Present the user with a wizard
2.1. The wizard has initial values filled in.
Initial values can come from (1) previous installation (defaults.js file) (2) initial values (init_values.js file)
3. When wizard completes, we have a set of config values
4. Create a file defaults.js for some config values
5. Populate the SQL with a basic set of tables
6. Populate the labels

What about the admin password? I think this can also come from a previous installation.


Another interesting thing: This installer is not just for first-time setup of the appdev framework. The installerTools also get used when a person wants to install a new application (module) on an existing system.
