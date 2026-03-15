const { app, BrowserWindow, screen, Tray, Menu, ipcMain } = require("electron");
const path = require("node:path");
const { fork } = require("node:child_process");
require("dotenv").config(); // Load .env

const port = process.env.VITE_PORT || 5173;

let mainWindow;
let tray;
let serverProcess;

function startBackendServer() {
  const serverPath = app.isPackaged
    ? path.join(__dirname, "..", "server.js") // In asar, __dirname is root/dist or root/public
    : path.join(__dirname, "..", "server.js");

  serverProcess = fork(serverPath, [], {
    env: { ...process.env, NODE_ENV: app.isPackaged ? "production" : "development" },
    stdio: "inherit" // Forward console logs to Electron's terminal
  });

  serverProcess.on("error", (err) => {
    console.error("❌ Failed to start Backend Server:", err);
  });
}

function createWindow(height) {
  mainWindow = new BrowserWindow({
    width: 350,
    height: height,
    show: false,
    x: 0,
    y: 0,
    transparent: true,
    alwaysOnTop: true,
    frame: false, //if you have to log into spotify change to true and restart program
    autoHideMenuBar: true,
    icon: path.join(__dirname, "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: false,
    },
  });

  // Handle IPC commands
  ipcMain.handle("window-close", () => {
    mainWindow.close();
  });

  ipcMain.handle("window-minimize", () => {
    mainWindow.minimize();
  });

  ipcMain.handle("window-set-always-on-top", (_, flag) => {
    console.log("Setting always on top:", flag);
    mainWindow.setAlwaysOnTop(flag, "screen-saver");
  });

  // Make window non-clickable (ignores all mouse events)
  mainWindow.setIgnoreMouseEvents(false); //if you have to log into spotify turn to false and restart program

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL(`http://localhost:${port}`);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  // Start the background YT Music API server before creating the window
  startBackendServer();

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  //   // Set app user model id for Windows
  //   electronApp.setAppUserModelId("com.electron");

  //   // Watch for dev tools shortcuts
  //   app.on("browser-window-created", (_, window) => {
  //     optimizer.watchWindowShortcuts(window);
  //   });

  createWindow(height);

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  tray = new Tray(path.join(__dirname, "icon.png"));

  const trayMenu = Menu.buildFromTemplate([
    {
      label: "Vertical Layout",
      click: () => {
        mainWindow.setSize(350, height);
      },
    },
    {
      label: "Horizontal Layout",
      click: () => {
        mainWindow.setSize(width, 150);
      },
    },
    {
      label: "Draggable",
      click: () => {
        mainWindow.setIgnoreMouseEvents(false);
      },
    },
    {
      label: "Static",
      click: () => {
        mainWindow.setIgnoreMouseEvents(true);
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => app.quit(),
    },
  ]);

  tray.setToolTip("Lyrics Overlay");
  tray.setContextMenu(trayMenu);
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Kill the backend server when Electron gracefully exits
app.on("before-quit", () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
