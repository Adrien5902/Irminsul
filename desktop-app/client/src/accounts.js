const Reg = require("winreg")
const fs = require('fs');

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
        key.set(Account.miHoYotokenLoaction, Reg.REG_BINARY, this.token, (err)=>{
            if(err){
                throw err
            }
        })
    }

    static key(gameId){
        const path = Account.paths[gameId]
    
        return new Reg({
            hive: Reg.HKCU,
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

module.exports = Account