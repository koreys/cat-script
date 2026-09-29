const fs = require("fs");
const path = require("path");
const { app, BrowserWindow, shell } = require("electron");

let backendServer = null;
let backendPort = null;

function copyLegacyDatabaseIfNeeded(targetPath) {
  if (fs.existsSync(targetPath)) return;

  const candidates = [
    path.join(app.getAppPath(), "server", "data", "cat-script.sqlite"),
    path.join(process.cwd(), "server", "data", "cat-script.sqlite")
  ];

  for (const sourcePath of candidates) {
    if (!fs.existsSync(sourcePath)) continue;

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
    return;
  }
}

async function ensureBackend() {
  if (backendServer && backendPort) {
    return backendPort;
  }

  const dataDir = app.getPath("userData");
  const dbPath = path.join(dataDir, "cat-script.sqlite");

  copyLegacyDatabaseIfNeeded(dbPath);
  process.env.CAT_SCRIPT_DB = dbPath;

  const { startServer } = require("../server/index");
  const started = await startServer(0);

  backendServer = started.server;
  backendPort = started.port;

  return backendPort;
}

async function createWindow() {
  const port = await ensureBackend();

  const window = new BrowserWindow({
    width: 1440,
    height: 950,
    minWidth: 1050,
    minHeight: 700,
    backgroundColor: "#dbeafe",
    title: "Cat Script",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  await window.loadURL("http://127.0.0.1:" + port);
}

app.whenReady().then(async () => {
  try {
    await createWindow();
  } catch (error) {
    console.error("Could not start Cat Script:", error);
    app.quit();
  }

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on("before-quit", () => {
  if (backendServer) {
    backendServer.close();
    backendServer = null;
    backendPort = null;
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
