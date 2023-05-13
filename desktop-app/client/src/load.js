const { app, BrowserWindow } = require('electron')
const fs = require("fs")
const { DiscordConn, Themes, Save } = require('./functions');

function createWindow () {
    const win = new BrowserWindow({
        width: 1080,
        height: 720,
        webPreferences:{
            nodeIntegration: true,
            contextIsolation: false,
        },
        autoHideMenuBar: true
    })

    win.loadFile('src/index.html')
    return win
}

app.whenReady().then(() => {
    const defaultContent = {
        accounts: [],
        theme: Themes.default,
    }

    let content = fs.readFileSync(Save.location)
    if(!fs.existsSync(Save.location) || !content){
        Save.write(defaultContent)
    }else{
        let data = JSON.parse(content)
        try{
            for(let key of Object.keys(defaultContent)){
                if(!data[key]){
                    data[key] = defaultContent[key]
                }
            }
            Save.write(data)
            if(data.token && data.discordInfo){
                createWindow()
            }else{
                DiscordConn.auth()
                .then(({discordInfo, code}) => {
                    createWindow()
                })
            }
        }catch(err){
            Save.write(defaultContent)
        }
    }
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})