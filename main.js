const { app, BrowserWindow, ipcMain, globalShortcut, session, dialog } = require("electron");
const path = require("path");
const fs = require('fs'); // Necessário para gravar o arquivo no PC

function createWindow() {
    const win = new BrowserWindow({
        width: 1400,
        height: 900,
        icon: path.join(__dirname, "icon", "bNavegador.png"),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webviewTag: true,
            devTools: true 
        }
    });

    win.loadFile(path.join(__dirname, "ui/index.html"));
    win.removeMenu();

    // --- NOVA PONTE DE SALVAMENTO ---
    ipcMain.on('salvar-favoritos-natura', (event, data) => {
    const win = BrowserWindow.getFocusedWindow();
    
    dialog.showSaveDialog(win, {
        title: 'Exportar Relatório - CFTV Natura',
        // Mudamos o padrão para .csv
        defaultPath: path.join(app.getPath('downloads'), 'relatorio_scanner_natura.csv'),
        filters: [
            { name: 'Planilha Excel (CSV)', extensions: ['csv'] },
            { name: 'Arquivos JSON', extensions: ['json'] }
        ]
    }).then(result => {
        if (!result.canceled && result.filePath) {
            const fs = require('fs');
            fs.writeFile(result.filePath, data, (err) => {
                if (!err) console.log("Relatório exportado!");
            });
        }
    });
});

    ipcMain.on("abrir-console", () => { win.webContents.toggleDevTools(); });

    ipcMain.on('clear-browser-data', (event) => {
        session.defaultSession.clearCache().then(() => {
            session.defaultSession.clearStorageData({
                storages: ['cachestorage', 'cookies', 'serviceworkers'] 
            }).then(() => { event.sender.reload(); });
        });
    });
}

app.whenReady().then(() => {
    createWindow();
    globalShortcut.register('CommandOrControl+Shift+I', () => {
        const focusedWin = BrowserWindow.getFocusedWindow();
        if (focusedWin) focusedWin.webContents.toggleDevTools();
    });
});

app.on('will-quit', () => { globalShortcut.unregisterAll(); });

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});