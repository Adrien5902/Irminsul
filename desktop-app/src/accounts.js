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
        Account.key(this.gameId).set(Account.miHoYotokenLoaction, Reg.REG_BINARY, this.token, (err)=>{
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
        let data = JSON.parse(fs.readFileSync("save.json").toString())
        let accounts = data.accounts

        const res = []
        accounts.forEach(el => {
            let account = new Account(el)
            res.push(account)
        });

        if(name){
            res.filter(el => el.name.startsWith(name))
        }

        if(gameId){
            res.filter(el => {return el.gameId == gameId})
        }

        // console.log(res)

        return res
    }

    static add(gameId, name){
        return new Promise((resolve, reject)=>{
            let data = JSON.parse(fs.readFileSync("save.json").toString())
            
            Account.key(gameId).get(Account.miHoYotokenLoaction, (err, res) => {
                if(!err){
                    let account = new Account({gameId, token: res.value, name})
                    data.accounts.push(account)
                    fs.writeFileSync("save.json", JSON.stringify(data))
                    resolve()
                }else{
                    reject(err)
                }
            })
        })
    }
}

module.exports = {
    Account,
}