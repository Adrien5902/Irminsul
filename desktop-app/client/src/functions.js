const Registery = require("winreg")
const fs = require('fs');
const { exec } = require("child_process")

class Account{
    constructor(obj){
        Object.assign(this, obj)
        this.name = obj.name ?? Account.unamed
    }

    static unamed = "Sans nom"

    static paths = {
        genshin: "miHoYo\\Genshin Impact",
        hsr: "Cognosphere\\Star Rail"
    }

    static miHoYotokenLoaction = "miHoYoSDK_ADL_PROD_OVERSEA_h1158948810"

    setName(name){
        this.name = name
    }

    set(){
        let key = Account.key(this.gameId)
        key.set(Account.miHoYotokenLoaction, Registery.REG_BINARY, this.token, (err)=>{
            if(err){
                throw err
            }
        })
    }

    static key(gameId){
        const path = Account.paths[gameId]
    
        return new Registery({
            hive: Registery.HKCU,
            key: "\\Software\\" + path
        })
    }

    static get(gameId = null, name = null){
        let data = JSON.parse(fs.readFileSync(__dirname+"/save.json").toString())
        let accounts = data.accounts

        if(name){
            accounts = accounts.filter(el => el.name.toLowerCase().includes(name.toLowerCase()))
        }

        if(gameId){
            accounts = accounts.filter(el => el.gameId == gameId)
        }
        
        const res = []
        accounts.forEach(el => {
            let account = new Account(el)
            res.push(account)
        });

        return res
    }

    static add(gameId, name){
        return new Promise((resolve, reject)=>{
            let data = JSON.parse(fs.readFileSync(__dirname+"/save.json").toString())
            
            Account.key(gameId).get(Account.miHoYotokenLoaction, (err, res) => {
                if(!err){
                    let account = new Account({gameId, token: res.value, name})
                    data.accounts.push(account)
                    fs.writeFileSync(__dirname+"/save.json", JSON.stringify(data))
                    resolve(account)
                }else{
                    reject(err)
                }
            })
        })
    }
}

class Game{
    static list = {
        genshin: {
            fullname: "Genshin Impact", 
            name: "Genshin Impact",
            pathtoexe: "Genshin Impact game",
            exe: "GenshinImpact"
        },
        hsr: {
            fullname: "Honkai: Star Rail",
            name: "Star Rail",
            pathtoexe: "Games",
            exe: "StarRail",
        }
    }

    constructor(id){
        if(Game.list[id]){
            Object.assign(this, Game.list[id])
            this.id = id
        }else{
            throw new Error("Game does not exists")
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
                exec(cmd, (err)=>{
                    if(err){
                        throw err
                    }
                })
            }).catch(err => {throw err})
        }else{
            throw new Error("Le jeu est déjà lancé")
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
}

module.exports = {Account, Game}