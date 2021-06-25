// main proc for Agama
// TODO: CLEANUP THIS FILE

const electron = require('electron');
const { crashReporter } = require('electron')
const {
	Menu,
	ipcMain,
} = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require('path');
const os = require('os');
const version = require('./version.json')
const portscanner = require('portscanner');
const osPlatform = os.platform();
const express = require('express');
const bodyParser = require('body-parser');
const Promise = require('bluebird');
const { formatBytes } = require('agama-wallet-lib/src/utils');
const { dialog } = require('electron')
require('@electron/remote/main').initialize()

global.USB_HOME_DIR = path.resolve(__dirname, './usb_home')

// TODO: Implement in a way less likely to confuse people
// USB Mode sets all necesarry files/folders to be in app parent directory
global.USB_MODE = false
global.HOME = os.platform() === "win32" ? process.env.APPDATA : process.env.HOME;

// GUI APP settings and starting gui on address http://120.0.0.1:17777
let api = require('./routes/api');
api.clearWriteLog()
const { appSecretToken, apiShieldKey } = require('./routes/preloads/keys');

const guiapp = express();

//TODO: add more things here
const { appConfig } = api

ipcMain.on('appConfig', (event) => {
	event.sender.send('appConfig', appConfig);
});

const appBasicInfo = {
	name: 'Verus Desktop',
	mode: global.USB_MODE ? 'usb' : 'standard',
	version: version.version,
};

app.setName(appBasicInfo.name);
app.setVersion(appBasicInfo.version);

if (appConfig.general.main.uploadCrashReports) {
	app.setPath('crashDumps', api.paths.crashesDir)
	crashReporter.start({
		productName: 'Dev-Testing',
		companyName: 'devtesting',
		submitURL: 'https://submit.backtrace.io/devtesting/f127b8ff9b6701ef2269f63233cc31792cf581843a804cfd0945103ee575d05b/minidump',
		uploadToServer: true,
	})
}

// parse argv
let _argv = {};

for (let i = 0; i < process.argv.length; i++) {
  if (process.argv[i].indexOf('nogui') > -1) {
  	_argv.nogui = true;
    api.log('enable nogui mode', 'init');
  }

  if (process.argv[i].indexOf('=') > -1) {
	  const _argvSplit = process.argv[i].split('=');
	  _argv[_argvSplit[0]] = _argvSplit[1];
  }

  if (!_argv.nogui) {
  	_argv = {};
  } else {
  	api.log('arguments', 'init');
		api.log(_argv, 'init');
		api.argv = _argv;
	}
}

api.log('usb mode: ' + global.USB_MODE, 'init');
api.log(`app info: ${appBasicInfo.name} ${appBasicInfo.version}`, 'init');
api.log('sys info:', 'init');
api.log(`totalmem_readable: ${formatBytes(os.totalmem())}`, 'init');
api.log(`arch: ${os.arch()}`, 'init');
api.log(`cpu: ${os.cpus()[0].model}`, 'init');
api.log(`cpu_cores: ${os.cpus().length}`, 'init');
api.log(`platform: ${osPlatform}`, 'init');
api.log(`os_release: ${os.release()}`, 'init');
api.log(`os_type: ${os.type()}`, 'init');
api.log(`app started in ${(appConfig.general.main.dev || process.argv.indexOf('devmode') > -1 ? 'dev mode' : ' user mode')}`, 'init');

//api.setConfKMD();

guiapp.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:3000');
	res.header('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	res.header('Access-Control-Allow-Credentials', 'true');
	res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
	next();
});

// preload js
const _setImmediate = setImmediate;
const _clearImmediate = clearImmediate;

process.once('loaded', () => {
	global.setImmediate = _setImmediate;
	global.clearImmediate = _clearImmediate;

	if (osPlatform === 'darwin') {
		process.setFdLimit(appConfig.general.main.maxDescriptors.darwin);
		app.setAboutPanelOptions({
			applicationName: app.getName(),
			applicationVersion: `${app.getVersion()}`,
			copyright: 'Released under the MIT license'
		});
	} else if (osPlatform === 'linux') {
		process.setFdLimit(appConfig.general.main.maxDescriptors.linux);
	}
});

// silent errors
if (!appConfig.general.main.dev &&
		!process.argv.indexOf('devmode') > -1) {
	process.on('uncaughtException', (err) => {
	  api.log(`${(new Date).toUTCString()} uncaughtException: ${err.message}`, 'exception');
	  api.log(err.stack, 'exception');
	});
}

guiapp.use(bodyParser.json({ limit: '500mb' })); // support json encoded bodies
guiapp.use(bodyParser.urlencoded({
	limit: '500mb',
	extended: true,
})); // support encoded bodies

guiapp.get('/', (req, res) => {
	res.send('Verus app server');
});

const guipath = path.join(__dirname, '/gui');
guiapp.use('/gui', express.static(guipath));
guiapp.use('/api', api);

const server = require('http').createServer(guiapp);
let io = require('socket.io')(server, {
	cors: {
		origin: appConfig.general.main.dev || process.argv.indexOf('devmode') > -1 ? 'http://127.0.0.1:3000' : null,
		methods: ["GET", "POST"]
	}
})

// Set httpServer timeout to 10 minutes
io.httpServer.timeout = 600000

let mainWindow;
let appCloseWindow;
let closeAppAfterLoading = false;
let forceQuitApp = false;

module.exports = guiapp;
let agamaIcon;

if (os.platform() === 'linux') {
	agamaIcon = path.join(__dirname, '/assets/icons/vrsc_512x512x32.png');
}
if (os.platform() === 'win32') {
	agamaIcon = path.join(__dirname, '/assets/icons/vrsc.ico');
}

// close app
function forceCloseApp() {
	forceQuitApp = true;
	app.quit();
}

if (!_argv.nogui ||
		(_argv.nogui && _argv.nogui === '1')) {
	app.on('ready', () => createWindow('open', process.argv.indexOf('dexonly') > -1 ? true : null));
} else {
	server.listen(appConfig.general.main.agamaPort, async () => {
		api.log(`guiapp and sockets.io are listening on port ${appConfig.general.main.agamaPort}`, 'init');
	});
	api.setIO(io); // pass sockets object to api router
	api.setVar('appBasicInfo', appBasicInfo);
}

function createAppCloseWindow() {
	// initialise window
	appCloseWindow = new BrowserWindow({ // dirty hack to prevent main window flash on quit
		width: 500,
		height: 320,
		frame: false,
		icon: agamaIcon,
		show: false,
		webPreferences: {
			allowRunningInsecureContent: false,
			contextIsolation: true,
			enableRemoteModule: false,
			nativeWindowOpen: false,
			nodeIntegration: false,
			nodeIntegrationInWorker: false,
			nodeIntegrationInSubFrames: false,
			safeDialogs: true,
			webSecurity: true,
			webviewTag: false,
			sandbox: true,
		}
	});

	appCloseWindow.setResizable(false);

	appCloseWindow.loadURL(
    appConfig.general.main.dev || process.argv.indexOf("devmode") > -1
      ? `http://127.0.0.1:${appConfig.general.main.agamaPort}/gui/startup/app-closing.html`
      : `file://${__dirname}/gui/startup/app-closing.html`
  );

  appCloseWindow.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      appCloseWindow.show();
    }, 40);
	});
	
	appCloseWindow.webContents.on('devtools-opened', () => {
		dialog.showMessageBox(appCloseWindow, {
			type: "warning",
			title: "Be Careful!",
			message: "WARNING! You are opening the developer tools menu. ONLY enter commands here if you know exactly what you are doing. If someone told you to copy+paste commands into here, you should probably ignore them, close dev tools, and stay safe.",
			buttons: ["OK"],
		})
	});
}

function createWindow(status) {
	if (status === 'open') {
		require(path.join(__dirname, 'private/mainmenu'));

		if (closeAppAfterLoading) {
			mainWindow = null;
			loadingWindow = null;
		}

		const staticMenu = Menu.buildFromTemplate([ // if static
			{ role: 'copy' },
			{ type: 'separator' },
			{ role: 'selectall' },
		]);

		const editMenu = Menu.buildFromTemplate([ // if editable
			{ role: 'undo' },
			{ role: 'redo' },
			{ type: 'separator' },
			{ role: 'cut' },
			{ role: 'copy' },
			{ role: 'paste' },
			{ type: 'separator' },
			{ role: 'selectall' },
		]);

		// check if agama is already running
		portscanner.checkPortStatus(appConfig.general.main.agamaPort, '127.0.0.1', async (error, status) => {
			// Status is 'open' if currently in use or 'closed' if available
			if (status === 'closed') {
				server.listen(appConfig.general.main.agamaPort, () => {
					api.log(`guiapp and sockets.io are listening on port ${appConfig.general.main.agamaPort}`, 'init');
				});

				// initialise window
				mainWindow = new BrowserWindow({
					width: closeAppAfterLoading ? 1 : 1280,
					height: closeAppAfterLoading ? 1 : 850,
					icon: agamaIcon,
					show: false,
					webPreferences: {
						allowRunningInsecureContent: false,
						contextIsolation: true,
						enableRemoteModule: false,
						nativeWindowOpen: false,
						nodeIntegration: false,
						nodeIntegrationInWorker: false,
						nodeIntegrationInSubFrames: false,
						safeDialogs: true,
						webSecurity: true,
						webviewTag: false,
		
						preload: path.resolve(__dirname, "routes", "preloads", "main", "preload.js")
					}
				});

				api.setIO(io); // pass sockets object to api router
				api.setVar('appBasicInfo', appBasicInfo);
				api.setVar('appSecretToken', appSecretToken);
				api.setVar('apiShieldKey', apiShieldKey);

				api.log("saving secret files...", 'init')
				try {
					await api.saveSecrets({
						appSecretToken,
						apiShieldKey
					})
				} catch(e) {
					api.log("error saving secret files!", 'init')
					api.log(e, "init")
				}
				

				mainWindow.loadURL(appConfig.general.main.dev || process.argv.indexOf('devmode') > -1 ? 'http://127.0.0.1:3000' : `file://${__dirname}/gui/Verus-Desktop-GUI/react/build/index.html`);
			} else {
				mainWindow = new BrowserWindow({
					width: 500,
					height: 355,
					icon: agamaIcon,
					show: false,
					webPreferences: {
						allowRunningInsecureContent: false,
						contextIsolation: true,
						enableRemoteModule: false,
						nativeWindowOpen: false,
						nodeIntegration: false,
						nodeIntegrationInWorker: false,
						nodeIntegrationInSubFrames: false,
						safeDialogs: true,
						webSecurity: true,
						webviewTag: false,
						sandbox: true,
					}
				});

				mainWindow.setResizable(false);
				mainWindow.forceCloseApp = forceCloseApp;

				willQuitApp = true;
				server.listen(appConfig.general.main.agamaPort + 1, () => {
					api.log(`guiapp and sockets.io are listening on port ${appConfig.general.main.agamaPort + 1}`, 'init');
				});
				mainWindow.loadURL(appConfig.general.main.dev || process.argv.indexOf('devmode') > -1 ? `http://127.0.0.1:${appConfig.general.main.agamaPort + 1}/gui/startup/agama-instance-error.html` : `file://${__dirname}/gui/startup/agama-instance-error.html`);
				api.log('another agama app is already running', 'init');
			}

			mainWindow.webContents.on('devtools-opened', () => {
				dialog.showMessageBox(mainWindow, {
					type: "warning",
					title: "Be Careful!",
					message: "WARNING! You are opening the developer tools menu. ONLY enter commands here if you know exactly what you are doing. If someone told you to copy+paste commands into here, you should probably ignore them, close dev tools, and stay safe.",
					buttons: ["OK"],
				})
			});

		  mainWindow.webContents.on('did-finish-load', () => {
		    setTimeout(() => {
					mainWindow.show();
					
					api.promptUpdate(mainWindow)
		    }, 40);

				if (appConfig.general.main.periodicallyCheckUpdates) {
					setInterval(() => {
						api.promptUpdate(mainWindow)
					}, 86400000)
				}
		  });

			mainWindow.webContents.on('context-menu', (e, params) => { // context-menu returns params
				const {
					selectionText,
					isEditable,
				} = params; // params obj

				if (isEditable) {
					editMenu.popup(mainWindow);
				} else if (
					selectionText &&
					selectionText.trim() !== ''
				) {
					staticMenu.popup(mainWindow);
				}
			});

			function appExit() {
				const CloseDaemons = () => {
					return new Promise((resolve, reject) => {
						api.log('Closing Main Window...', 'quit');

            api.quitKomodod(appConfig.general.native.cliStopTimeout);
            api.stopNSPVDaemon('all');

						const result = 'Closing daemons: done';

						api.log(result, 'quit');
						resolve(result);
					});
				}

				const HideMainWindow = () => {
					return new Promise((resolve, reject) => {
						const result = 'Hiding Main Window: done';

						api.log('Exiting App...', 'quit');
						mainWindow = null;
						api.log(result, 'quit');
						resolve(result);
					});
				}

				const HideAppClosingWindow = () => {
					return new Promise((resolve, reject) => {
						appCloseWindow = null;
						resolve(true);
					});
				}

				const QuitApp = () => {
					return new Promise((resolve, reject) => {
						const result = 'Quiting App: done';

						forceQuitApp = true
						app.quit();
						api.log(result, 'quit');
						resolve(result);
					});
				}

				const closeApp = () => {
					CloseDaemons()
					.then(HideMainWindow)
					.then(HideAppClosingWindow)
					.then(QuitApp);
				}

				let _appClosingInterval;

				if (process.argv.indexOf('dexonly') > -1) {
					api.killRogueProcess('marketmaker');
				}
				if (!Object.keys(api.startedDaemonRegistry).length ||
						!appConfig.general.native.stopNativeDaemonsOnQuit) {
					closeApp();
				} else {
					createAppCloseWindow();
					api.quitKomodod(appConfig.general.native.cliStopTimeout);
					_appClosingInterval = setInterval(() => {
						if (!Object.keys(api.startedDaemonRegistry).length) {
							closeApp();
						}
					}, 1000);
				}
			}

			// close app
			mainWindow.on('closed', () => {
				appExit();
			});
		});
	}
}

app.on('web-contents-created', (event, contents) => {
  contents.on('will-attach-webview', (event, webPreferences, params) => {
    // Strip away preload scripts if unused or verify their location is legitimate
    delete webPreferences.preload
    delete webPreferences.preloadURL

    // Disable Node.js integration
    webPreferences.nodeIntegration = false

    event.preventDefault()
	})
	
	contents.on('will-navigate', (event, navigationUrl) => {
		event.preventDefault()
	})

	contents.setWindowOpenHandler(() => {
		return { action: "deny" }
	})
})

// Emitted before the application starts closing its windows.
// Calling event.preventDefault() will prevent the default behaviour, which is terminating the application.
app.on('before-quit', (event) => {
	api.log('before-quit', 'quit');
	if (process.argv.indexOf('dexonly') > -1) {
		api.killRogueProcess('marketmaker');
	}
});

// Emitted when all windows have been closed and the application will quit.
// Calling event.preventDefault() will prevent the default behaviour, which is terminating the application.
app.on('will-quit', (event) => {
	if (!forceQuitApp) {
		// loading window is still open
		api.log('will-quit while loading window active', 'quit');
		event.preventDefault();
	}
});

// Emitted when the application is quitting.
// Calling event.preventDefault() will prevent the default behaviour, which is terminating the application.
app.on('quit', (event) => {
	if (!forceQuitApp) {
		api.log('quit while loading window active', 'quit');
		// event.preventDefault();
	}
});
