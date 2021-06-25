const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const os = require('os');
let agamaIcon;
let fetchWindow = null
const path = require('path');
const { dialog } = require('electron')

if (os.platform() === 'linux') {
	agamaIcon = path.join(__dirname, '/assets/icons/vrsc_512x512x32.png');
}
if (os.platform() === 'win32') {
	agamaIcon = path.join(__dirname, '/assets/icons/vrsc.ico');
}

function createFetchBoostrapWindow(chainTicker, appConfig) {
	if (fetchWindow == null) {
		fetchWindow = new BrowserWindow({ 
			width: 750,
			height: 500,
			frame: true,
			icon: agamaIcon,
			backgroundColor: "#3165D4",
			show: false,
			title: `Fetch ${chainTicker} Bootstrap`,
			webPreferences: {
				enableRemoteModule: true,
				nodeIntegration: true,
				contextIsolation: false
			}
		});

		fetchWindow.webContents.on('devtools-opened', () => {
			dialog.showMessageBox(fetchWindow, {
				type: "warning",
				title: "Be Careful!",
				message: "WARNING! You are opening the developer tools menu. ONLY enter commands here if you know exactly what you are doing. If someone told you to copy+paste commands into here, you should probably ignore them, close dev tools, and stay safe.",
				buttons: ["OK"],
			})
		});

		fetchWindow.show();
		
		fetchWindow.loadURL(
			appConfig.general.main.dev || process.argv.indexOf("devmode") > -1
				? `http://127.0.0.1:${appConfig.general.main.agamaPort}/gui/fetch-bootstrap/fetch-bootstrap.html?ticker=${chainTicker}`
				: `file://${__dirname}/../../../gui/fetch-bootstrap/fetch-bootstrap.html?ticker=${chainTicker}`
		);

		return new Promise((resolve, reject) => {
			fetchWindow.on('closed', () => resolve())
		})
	}
}

function closeBootstrapWindow() {
	if (fetchWindow != null) {
		setTimeout(() => {
			fetchWindow.close()
			fetchWindow = null
		}, 500)
	}
}

function getBootstrapBrowserWindow() {
	return fetchWindow
}

function setBootstrapWindowOnClose(onClose) {
	if (fetchWindow != null) {
		fetchWindow.on('close', () => {
			onClose()
			fetchWindow = null
		})
	}
}

module.exports = {
	createFetchBoostrapWindow,
	closeBootstrapWindow,
	setBootstrapWindowOnClose,
	getBootstrapBrowserWindow
}