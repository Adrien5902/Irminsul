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

    if(!fs.existsSync(Save.location)){
        Save.write(defaultContent)
        DiscordConn.auth()
        .then(({discordInfo, code}) => {
            createWindow()
        })
    }else{
        let content = fs.readFileSync(Save.location)
        if(!content){
            Save.write(defaultContent)
            DiscordConn.auth()
            .then(({discordInfo, code}) => {
                createWindow()
            })
        }else{
            let data
            try{
                data = JSON.parse(content)
            }catch(err){
                Save.write(defaultContent)
                data = defaultContent
            }

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
        }
    }
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})