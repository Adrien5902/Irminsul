const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow () {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
    })

    win.loadFile('src/index.html')
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

const Reg = require("winreg")

const paths = {
    genshin: "miHoYo\\Genshin Impact",
    hsr: "Cognosphere\\Star Rail"
}

const tokenLocation = "MIHOYOSDK_ADL_PROD_OVERSEA_h1158948810"

for(const gameId of Object.keys(paths)){
    const path = paths[gameId]

    let key = new Reg({
        hive: Reg.HKCU,
        key: "\\Software\\" + path
    })
    
    key.get(tokenLocation, (err, res)=>{
        
    })
}