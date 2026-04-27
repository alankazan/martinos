const { app, BrowserWindow, ipcMain, globalShortcut } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const isDev = process.env.NODE_ENV === "development";

let mainWindow;
let backendProcess;

// ── Start Flask backend ──────────────────────────────────────────────────────
function startBackend() {
  const backendDir = path.join(__dirname, "backend");
  const python = process.platform === "win32" ? "python" : "python3";

  backendProcess = spawn(python, ["server.py"], {
    cwd: backendDir,
    stdio: "pipe",
    detached: false,
  });

  backendProcess.stdout.on("data", (d) => console.log("[backend]", d.toString().trim()));
  backendProcess.stderr.on("data", (d) => console.error("[backend]", d.toString().trim()));
  backendProcess.on("exit", (code) => console.log("[backend] exited with code", code));
}

// ── Create main window ───────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    // Fullscreen kiosk mode — no title bar, no frame
    fullscreen: true,
    kiosk: true,
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: "#07070e",
    autoHideMenuBar: true,
    // No browser controls visible
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "electron-preload.js"),
    },
  });

  // Load the app
  if (isDev) {
    // Wait for Vite dev server
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));
  }

  // Prevent closing with Alt+F4 in kiosk mode
  mainWindow.on("close", (e) => {
    if (!app.isQuiting) e.preventDefault();
  });

  mainWindow.on("closed", () => { mainWindow = null; });
}

// ── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  startBackend();

  // Small delay to let backend initialize
  setTimeout(createWindow, 1500);

  // Block keyboard shortcuts that could escape kiosk
  app.on("browser-window-focus", () => {
    globalShortcut.register("Alt+F4", () => {});
    globalShortcut.register("Super", () => {});
    globalShortcut.register("Alt+Tab", () => {});
  });

  app.on("browser-window-blur", () => {
    globalShortcut.unregisterAll();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  app.isQuiting = true;
  if (backendProcess) backendProcess.kill();
  globalShortcut.unregisterAll();
});

// ── IPC: power commands from renderer ────────────────────────────────────────
ipcMain.on("system-poweroff", () => {
  if (backendProcess) backendProcess.kill();
  require("child_process").exec("systemctl poweroff");
  app.quit();
});

ipcMain.on("system-reboot", () => {
  if (backendProcess) backendProcess.kill();
  require("child_process").exec("systemctl reboot");
  app.quit();
});

ipcMain.on("quit-app", () => {
  app.isQuiting = true;
  app.quit();
});
