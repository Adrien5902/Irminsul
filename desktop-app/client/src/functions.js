const Registery = require("winreg")
const fs = require('fs');
const { exec } = require("child_process");
const { BrowserWindow } = require('electron')

const errors = {
    gameAlreadyRunning: new Error("Le jeu est déjà en cours d'exécution"),
    gameNotRunning: new Error("Le jeu n'est pas lancé"),
    gameDoesNotExist: new Error("Game does not exists"),
    accountNotFound: new Error("Compte introuvable"),
    missingDiscordInformation: new Error("Nous navons pas réussi à accéder aux informations de ton compte discord")
} 

class Save{
    static location = __dirname + "/save.json"

    static read(){
        return JSON.parse(fs.readFileSync(this.location).toString())
    }

    static write(data){
        let jsondata = JSON.stringify(data)
        fs.writeFileSync(this.location, jsondata)
        return jsondata
    }
}

class Account{
    constructor(obj){
        Object.assign(this, obj)
        this.name = obj.name ?? Account.unamed
    }

    static unamed = "Sans nom"

    static miHoYotokenLoaction = "miHoYoSDK_ADL_PROD_OVERSEA_h1158948810"

    set(){
        return new Promise(async(resolve, reject)=>{
            let game = new Game(this.gameId)
            let isRunning = await game.isRunning()
            
            if(!isRunning){
                let key = Account.key(this.gameId)
                key.set(Account.miHoYotokenLoaction, Registery.REG_BINARY, this.token, (err)=>{
                    if(err){
                        reject(err)
                    }else{
                        resolve()
                    }
                })
            }else{
                reject(errors.gameAlreadyRunning)
            }
        })
    }

    static key(gameId){
        const path = (new Game(gameId)).regPath
    
        return new Registery({
            hive: Registery.HKCU,
            key: "\\Software\\" + path
        })
    }

    static get(gameId = null, name = null){
        let data = Save.read()
        let accounts = data.accounts

        if(name){
            accounts = accounts.filter(el => el.name.toLowerCase().includes(name.toLowerCase()))
        }

        if(gameId){
            accounts = accounts.filter(el => el.gameId == gameId)
        }
        
        const res = []
        accounts.forEach(el => {
            let account = new this(el)
            res.push(account)
        });

        return res
    }

    static add(gameId, name){
        return new Promise((resolve, reject)=>{
            let data = Save.read()
            
            this.key(gameId).get(this.miHoYotokenLoaction, (err, res) => {
                if(!err){
                    let account = new this({gameId, token: res.value, name})
                    data.accounts.push(account)
                    Save.write(data)
                    resolve(account)
                }else{
                    reject(err)
                }
            })
        })
    }

    remove(){
        let data = Save.read()
        let index = data.accounts.findIndex(el => JSON.stringify(this) == JSON.stringify(el))

        if(index < 0){
            throw errors.accountNotFound
        }else{
            data.accounts.pop(index, 1)
            Save.write(data)
            return
        }
    }

    rename(newname){
        let data = Save.read()
        let index = data.accounts.findIndex(el => JSON.stringify(this) == JSON.stringify(el))

        if(index < 0){
            throw errors.accountNotFound
        }else{
            this.name = newname
            data.accounts[index] = this
            Save.write(data)
            return
        }
    }
}

class Game{
    static list = {
        genshin: {
            fullname: "Genshin Impact", 
            name: "Genshin Impact",
            pathtoexe: "Genshin Impact game",
            regPath: "miHoYo\\Genshin Impact",
            exe: "GenshinImpact",
        },
        hsr: {
            fullname: "Honkai: Star Rail",
            name: "Star Rail",
            pathtoexe: "Games",
            regPath: "Cognosphere\\Star Rail",
            exe: "StarRail",
        }
    }

    constructor(id){
        if(Game.list[id]){
            Object.assign(this, Game.list[id])
            this.id = id
        }else{
            throw errors.gameDoesNotExist
        }
    }

    getPath(){
        return new Promise((resolve, reject)=>{
            let key = new Registery({
                hive: Registery.HKLM,
                key: "\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\" + this.name
            })
            
            key.get("InstallPath", (err, res)=>{
                if(!err){
                    resolve(res.value)
                }else{
                    reject(err)
                }
            })
        })
    }

    async run(){
        if(!await this.isRunning()){
            console.log("Starting " + this.fullname)
            await this.getPath().then((path)=>{
                let cmd = 'start "" "' + path + '\\' + this.pathtoexe + '\\' + this.exe + '.exe'
                exec(cmd, (err, stdout, stderr)=>{
                    if(err){
                        throw err
                    }else if(stderr){
                        throw stderr
                    }else{
                        return stdout
                    }
                })
            }).catch(err => {throw err})
        }else{
            throw gameAlreadyRunning
        }
    }

    isRunning(){
        return new Promise((resolve, reject)=>{
            let cmd = 'tasklist /FI "IMAGENAME eq ' + this.exe + '.exe"'
            exec(cmd, (err, stdout)=>{
                if(err){
                    reject(err)
                }else{
                    resolve(stdout.includes(this.exe))
                }
            })
        })
    }

    close(){
        return new Promise(async (resolve, reject) => {
            let isRunning = await this.isRunning()
            if(isRunning){
                const cmd = 'taskkill /F /IM ' + this.exe + '.exe';
                exec(`powershell -Command "Start-Process -Verb runAs '${cmd}'"`, (err, stdout, stderr)=>{
                    if(err){
                        reject(err)
                    }else if(stderr){
                        reject(stderr)
                    }else{
                        resolve(stdout)
                    }
                })
            }else{
                reject(errors.gameNotRunning)
            }
        })
    }
}

class DiscordConn {
    static auth(){
        function getCode(win, beat = 100){
            return new Promise((resolve, reject) => {
                win.webContents.executeJavaScript("discord")
                .then(discordInfo => {
                    if(discordInfo){
                        discordInfo = JSON.parse(discordInfo)
                        win.webContents.executeJavaScript("authcode")
                        .then(code => {
                            resolve({discordInfo, code})
                        })
                    }else{
                        setTimeout(()=>{
                            getCode(win, beat)
                            .then(resolve)
                            .catch(reject)
                        }, beat)
                    }
                })
                .catch(err => {
                    setTimeout(()=>{
                        getCode(win, beat)
                        .then(resolve)
                        .catch(reject)
                    }, beat)
                })
            })
        }

        return new Promise((resolve, reject) => {
            try {
                const authWindow = new BrowserWindow({
                    width: 1080,
                    height: 920,
                    webPreferences: {
                        nodeIntegration: false,
                        contextIsolation: true,
                        enableRemoteModule: false,
                    },
                    autoHideMenuBar: true,
                });
            
                const authUrl = "https://adrien5902.ddns.net/genshin-impact/irminsul/hoyolab/"
                authWindow.loadURL(authUrl);
            
                getCode(authWindow)
                .then(({discordInfo, code}) => {
                    let save = Save.read()
                    save.token = code
                    save.discordInfo = discordInfo
                    Save.write(save)
                    authWindow.close()
                    
                    resolve({discordInfo, code})
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    static getAccountInfo(){
        let data = Save.read()
        let info = data.discordInfo
        if(info){
            info.pdp = `https://cdn.discordapp.com/avatars/${info.id}/${info.avatar}.png`;
            return info
        }else{
            throw errors.missingDiscordInformation
        }
    }
}

class Themes{
    static list = [
        "dark",
        "light",
    ]

    static default = this.list[0]

    static go(side = 1, currentTheme = this.getSave()){
        let index = this.list.indexOf(currentTheme)
        let theme = this.list[index + side]
        if(!theme){
            if(side > 0){
                theme = this.list[0]
            }else if(side < 0){
                theme = this.list[this.list.length - 1]
            }
        }
        this.set(theme)
    }

    static getSave(){
        let {theme} = Save.read()
        if(!theme){
            theme = this.default
        }
        return theme
    }

    static set(theme){
        document.body.setAttribute("theme", theme)
        let save = Save.read()
        save.theme = theme
        Save.write(save)
        let img = document.querySelector("#theme img")
        img.src = "imgs/themes/" + theme + ".png"
        img.alt = theme
    }
}

class GenshinCharacter{
    constructor(obj){
    }
}



module.exports = {
    Account, 
    Game, 
    DiscordConn,
    Themes,
    Save,
    errors,
}