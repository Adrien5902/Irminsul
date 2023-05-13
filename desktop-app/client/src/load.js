const { app, BrowserWindow } = require('electron')
const fs = require("fs")

function createWindow () {
    const win = new BrowserWindow({
        width: 1080,
        height: 720,
        webPreferences:{
            nodeIntegration: true,
            contextIsolation: false,
        },
        icon: "imgs/icon",
        autoHideMenuBar: true
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

    let save = "src/save.json"
    let content = fs.readFileSync(save).toString()
    const defaultContent = {
        accounts: []
    }
    if(!fs.existsSync(save) || !content){
        fs.writeFileSync(save, JSON.stringify(defaultContent))
    }else{
        try{
            let data = JSON.parse(content)
            for(let key of Object.keys(defaultContent)){
                if(!data[key]){
                    data[key] = defaultContent[key]
                }
            }
            fs.writeFileSync(save, JSON.stringify(data))
        }catch(err){
            fs.writeFileSync(save, JSON.stringify(defaultContent))
        }
    }
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})