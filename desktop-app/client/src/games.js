const { exec } = require("child_process")
const Reg = require("winreg")


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
            let key = new Reg({
                hive: Reg.HKLM,
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

module.exports = Game