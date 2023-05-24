const {
	shell
} = require('electron');
const version_json = require('../../../version.json')
const updateAvailable = require('../../workers/check_update')
const { dialog } = require('../utils/dialog-shim');
const { VERUS_DESKTOP_UPDATE_DL } = require('../utils/constants/urls');

module.exports = (api) => {
  api.askingUserAboutUpdate = false

  api.promptUpdate = (mainWindow, userInitiated) => {
    const config = api.loadLocalConfig();

    if (api.askingUserAboutUpdate === true) return Promise.resolve(true)
    api.askingUserAboutUpdate = true

    return new Promise((resolve, reject) => {
      updateAvailable().then(res => {
        api.log('Checking for app update....', 'update')

        if (
          res.update_available &&
          (res.mandatory ||
            config.general.main.alwaysPromptUpdates ||
            userInitiated)
        ) {
          api.log(
            `Update available! current: ${version_json.version}, latest: ${res.version}`,
            "update"
          );

          dialog.showMessageBox(
            mainWindow,
            {
              title: res.mandatory ? "Update Required!" : "Update Available!",
              message: res.mandatory
                ? "Update to Verus Desktop version " +
                  res.version +
                  " required!"
                : "Verus Desktop version " +
                  res.version +
                  " is available for download!",
              buttons: res.mandatory
                ? ["Show Me!", "Remind me Later"]
                : userInitiated
                ? ["Show Me!", "Cancel"]
                : [
                    "Show Me!",
                    "Remind me Later",
                    "Ignore Non-Mandatory Updates",
                  ],
            },
            (init) => {
              if (init === 0) {
                const openLink = () => dialog.showMessageBox(mainWindow, {
                  title: "Opening Releases Page",
                  message: "Verus Desktop will now open the Verus Desktop GitHub releases page in your browser.",
                  checkboxLabel: "I will ensure my URL matches \"https://verus.io/wallet/desktop-wallet\" exactly.",
                  buttons: ["OK", "Cancel"]
                }, (init, checked) => {
                  if (init === 0) {
                    if (checked) shell.openExternal(VERUS_DESKTOP_UPDATE_DL)
                    else openLink()
                  }
                })

                openLink()
              } else if (init === 2) {
                api.log(
                  "Disabling notifications for non-mandatory updates...",
                  "update"
                );
                api.saveLocalAppConf({
                  ...config,
                  general: {
                    ...config.general,
                    main: {
                      ...config.general.main,
                      alwaysPromptUpdates: false,
                    },
                  },
                });
              }

              api.askingUserAboutUpdate = false
              resolve();
            }
          );
        } else {
          if (userInitiated) {
            api.log(`App is up to date! (v${version_json.version})`, "update");
            dialog.showMessageBox(
              mainWindow,
              {
                title: "Up to Date!",
                message: `Verus Desktop is up to date! (v${version_json.version})`,
                buttons: ["OK"],
              },
              () => {
                api.askingUserAboutUpdate = false
                resolve();
              }
            );
          } else {
            if (res.update_available) {
              api.log(`Update available, but not showing. Current: ${version_json.version}, latest: ${res.version}`,
                "update");
            } else api.log(`App is up to date! (v${version_json.version})`, "update");
            
            api.askingUserAboutUpdate = false
            resolve();
          }
        }
      }).catch(e => {
        api.log('Update error! Failed to check for updates:', 'update')
        api.log(e, 'update')
        api.askingUserAboutUpdate = false
        resolve();
      })
    })
  }

  return api;
};