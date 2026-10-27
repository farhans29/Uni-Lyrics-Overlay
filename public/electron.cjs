const { app, BrowserWindow, screen, Tray, Menu, ipcMain, nativeImage } = require("electron");
const path = require("node:path");
const { ytMusicLyricsService } = require("./services/ytmusicService.cjs");
const { startMediaDetector, getSystemMedia, stopMediaDetector } = require("./mediaDetector.cjs");

try {
  require("dotenv").config(); // Load .env in dev if available
} catch {
  // .env / dotenv not required in packaged desktop build
}

const port = process.env.VITE_PORT || 5173;

let mainWindow = null;
let tray = null;

function getSafeWindow() {
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
}

function registerIpcHandlers() {
  ipcMain.handle("window-close", () => {
    getSafeWindow()?.close();
  });

  ipcMain.handle("window-minimize", () => {
    getSafeWindow()?.minimize();
  });

  ipcMain.handle("window-set-always-on-top", (_, flag) => {
    const win = getSafeWindow();
    if (!win) return;
    const isPinned = Boolean(flag);
    if (process.platform === "darwin") {
      win.setAlwaysOnTop(isPinned, "floating", 1);
      win.setVisibleOnAllWorkspaces(isPinned, { visibleOnFullScreen: true });
    } else {
      win.setAlwaysOnTop(isPinned);
    }
  });

  ipcMain.handle("get-system-media", () => {
    return getSystemMedia();
  });

  ipcMain.handle("get-app-version", () => {
    return app.getVersion();
  });

  ipcMain.handle("ytmusic-search-lyrics", async (_, query) => {
    try {
      return await ytMusicLyricsService.searchSongAndLyrics(query);
    } catch (error) {
      console.error("❌ YTMusic IPC Error:", error);
      return { error: error.message || "Internal server error" };
    }
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
    hasShadow: false,
    roundedCorners: false,
    alwaysOnTop: false,
    frame: false, //if you have to log into spotify change to true and restart program
    autoHideMenuBar: true,
    icon: path.join(__dirname, "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      sandbox: false,
    },
  });

  // Make window non-clickable (ignores all mouse events)
  mainWindow.setIgnoreMouseEvents(false); //if you have to log into spotify turn to false and restart program

  mainWindow.once("ready-to-show", () => {
    getSafeWindow()?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL(`http://127.0.0.1:${port}`);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  registerIpcHandlers();
  startMediaDetector();
  // Warm up YTMusic API in the background
  ytMusicLyricsService.ensureInitialized().catch(() => {});

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const appVersion = app.getVersion();

  createWindow(height);

  app.on("activate", function () {
    if (!mainWindow || mainWindow.isDestroyed()) {
      createWindow(height);
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  let trayIcon = nativeImage.createFromPath(path.join(__dirname, "icon.png"));
  if (process.platform === "darwin") {
    trayIcon = trayIcon.resize({ width: 18, height: 18 });
  }
  tray = new Tray(trayIcon);

  const trayMenu = Menu.buildFromTemplate([
    {
      label: `Lyrics Overlay v${appVersion}`,
      enabled: false,
    },
    { type: "separator" },
    {
      label: "Show Overlay",
      click: () => {
        const win = getSafeWindow();
        if (win) {
          win.show();
          win.focus();
        }
      },
    },
    {
      label: "Vertical Layout",
      click: () => {
        getSafeWindow()?.setSize(350, height);
      },
    },
    {
      label: "Horizontal Layout",
      click: () => {
        getSafeWindow()?.setSize(width, 150);
      },
    },
    {
      label: "Draggable",
      click: () => {
        getSafeWindow()?.setIgnoreMouseEvents(false);
      },
    },
    {
      label: "Static",
      click: () => {
        getSafeWindow()?.setIgnoreMouseEvents(true);
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => app.quit(),
    },
  ]);

  tray.setToolTip(`Lyrics Overlay v${appVersion}`);
  tray.setContextMenu(trayMenu);
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  stopMediaDetector();
  if (tray && !tray.isDestroyed()) {
    tray.destroy();
    tray = null;
  }
});
