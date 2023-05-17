const { questionMarkURL, con } = require('./functions.js');
const fs = require("fs")
const mysql = require('mysql');
const {spawn} = require("child_process");

const toLevelUp = ["level", "weapon", "talents", "artifacts"]

class Artifacts{
    constructor(list){
        this.artifacts = {
            flower: list.find(item => item.pos == 1) ?? null,
            feather: list.find(item => item.pos == 2) ?? null,
            sands: list.find(item => item.pos == 3) ?? null,
            goblet: list.find(item => item.pos == 4) ?? null,
            circlet: list.find(item => item.pos == 5) ?? null,
        }

        if(list[0]){
            this.icon = list[0].icon
        }else{
            this.icon = questionMarkURL
        }

        this.sets = {}
        for(let artifact of list){
            let set = String(artifact.id).slice(0, 2)
            if(typeof this.sets[set] == "undefined"){
                this.sets[set] = 1
            }else{
                this.sets[set]++
            }
        }
    }

    ratio(counts = ["level", "rarity", "set"]){
        let sigma = 0
        if(counts.includes("level")){
            counts.push("level2")
            let levelsigma = 0
            for(let artifact of Object.keys(this.artifacts)){
                if(this.artifacts[artifact]){
                    levelsigma += this.artifacts[artifact].level/this.artifacts[artifact].max_level
                }
            }
            sigma += (levelsigma/Object.keys(this.artifacts).length)*2
        }
        
        if(counts.includes("rarity")){
            let raritysigma = 0
            for(let artifact of Object.keys(this.artifacts)){
                if(this.artifacts[artifact]){
                    raritysigma += this.artifacts[artifact].rarity/5
                }
            }
            sigma += raritysigma/Object.keys(this.artifacts).length
        }
        
        if(counts.includes("set")){
            let ratio = 0
            for(let set of Object.keys(this.sets)){
                if(this.sets[set] >= 4){
                    ratio += 1
                }else if(this.sets[set] >= 2){
                    ratio += 0.5
                } 
            }
            sigma += ratio
        }

        return sigma/counts.length
    }
}

class Weapon{
    constructor(obj){
        this.name = obj.name
        this.level = {value: obj.level, max: obj.max_level}
        this.icon = obj.icon
    }

    ratio(){
        return this.level.value/this.level.max
    }
}

class Level{
    constructor(obj){
        this.value = obj.level
        this.max = obj.max_level
        this.icon = obj.icon
    }

    ratio(){
        return this.value/this.max
    }
}

class Talents{
    constructor(list){
        this.auto = list[0]
        this.e = list[1]
        this.a = list[2]

        this.icon = this.e.icon
    }

    ratio(talents = ["e", "a"]){
        let sigma = 0
        for(let talent of talents){
            sigma += this[talent].level/this[talent].max_level
        }
        return sigma/talents.length
    }
}

class Character{
    constructor(obj){
        this.id = obj.id
        this.name = obj.name
        this.element = obj.element

        this.artifacts = new Artifacts(obj.artifacts)
        this.talents = new Talents(obj.talents)
        this.weapon = new Weapon(obj.weapon)
        this.level = new Level(obj)
    }

    shouldLevelUp(){
        let ratio = {}
        let sigma = 0
        for(let item of toLevelUp){
            ratio[item] = this[item].ratio()
            sigma += ratio[item]
        }

        let moyenne = sigma/toLevelUp.length
        let required = {}
        for(let item of toLevelUp){
            if(ratio[item] != 1 || item == "artifacts"){
                required[item] = moyenne - ratio[item]
            }else{
                required[item] = -1
            }
        }
        return required
    }

    getDays() {
        return new Promise((resolve, reject) => {
            let endId = String(this.id).slice(-3)

            let wepP = new Promise((resolve, reject) => {
                let wepName = this.weapon.name
                con.query(`SELECT asc_mat FROM weapons WHERE name = "${wepName}"`, (err, result) => {
                    if(!err){
                        if(result && result[0]){
                            let mat = result[0]["asc_mat"]
                            con.query(`SELECT day FROM weapons_mats WHERE 1st = "${mat}"`, (err, result) => {
                                if(!err){
                                    if(result && result[0]){
                                        resolve({weapon: result[0].day})
                                    }else{
                                        reject(new Error(`mat ${mat} does not exist`))
                                    }
                                }else{
                                    reject(err)
                                }
                            })
                        }else{
                            reject(new Error(`weapon ${wepName} does not exist`))
                        }
                    }else{
                        reject(err)
                    }
                })
            })
    
            let talentsP = new Promise((resolve, reject) => {
                con.query(`SELECT name FROM chars WHERE id = "${endId}"`, (err, result) => {
                    if(!err){
                        if(result && result[0]){
                            this.dbname = result[0].name
                            con.query(`SELECT talent_books FROM el_materials WHERE name = "${this.dbname}"`, (err, result) => {
                                if(!err){
                                    if(result && result[0]){
                                        let books = result[0].talent_books
                                        con.query(`SELECT day FROM talent_books WHERE 1st = "${books}"`, (err, result) => {
                                            if(!err){
                                                if(result && result[0]){
                                                    resolve({talents: result[0].day})
                                                }else{
                                                    reject(new Error(`${books} does not exist`))
                                                }
                                            }else{
                                                reject(err)
                                            }
                                        })
                                    }else{
                                        reject(new Error(`charcter with name ${this.dbname} has no materials set`))
                                    }
                                }else{
                                    reject(err)
                                }
                            })
                        }else{
                            reject(new Error(`charcter with id ${endId} not found`))
                        }
                    }else{
                        reject(err)
                    }
                })
            })
    
            Promise.all([wepP, talentsP])
            .then((values)=>{
                const output = values.reduce((acc, obj) => {
                    return { ...acc, ...obj };
                }, {});
                resolve(output)
            })
            .catch((err) =>{
                reject(err)
            })
        })
    }
}

async function refreshFarming(auth = {code: 0, discordId: 0}){
    let sql = "SELECT * FROM irminsul_hoyolab WHERE "
    if(auth.discordId){
        sql += "discordId = " + mysql.escape(auth.discordId)
    }else if(auth.code){
        sql += "authcode = " + mysql.escape(auth.code)
    }else{
        return new Error("wrong auth")
    }

    return new Promise((resolve, reject)=>{
        con.query(sql, (err, result) => {
            if(!err){
                if(result && result[0]){
                    const userData = result[0]
                    const python = spawn('python', ['hoyolab.py', userData.server, userData.ltoken, userData.ltuid, "calc"]);
                    python.stdout.on('data', async (data) => {
                        data = await data.toString();
                        data = await JSON.parse(data)
                        if(!data.err){
                            resolve(data)
                        }else{
                            reject(data.err)
                        }
                    });        
                }else{
                    reject(new Error("unknown user"))
                }
            }else{
                reject(err)
            }
        })
    })
}

async function getFarming(auth = {code: 0, discordId: 0}, jour = true, level_min = 1, selectedCharacter = null, limit = 10, uptype = false) {
    let sql = "SELECT * FROM irminsul_hoyolab WHERE "
    if(auth.discordId){
        sql += "discordId = " + mysql.escape(auth.discordId)
    }else if(auth.code){
        sql += "authcode = " + mysql.escape(auth.code)
    }else{
        return new Error("wrong auth")
    }

    return new Promise((resolve, reject)=>{
        con.query(sql, (err, result) => {
            if(!err){
                if(result && result[0]){
                    const path = __dirname + "/calcs/" + result[0].ltuid + ".json"
                    if(fs.existsSync(path)){
                        fs.readFile(path, async(err, data)=>{
                            if(!err){
                                data = JSON.parse(data.toString())
                                const promises = []
    
                                let farmDay = (new Date(Date.now())).getDay()
                                if (farmDay >= 4){
                                    farmDay -= 3
                                }
    
                                for(let character of data){
                                    if(character.name != "Voyageur/Voyageuse" && (!selectedCharacter || selectedCharacter == character.name)){
                                        let char = new Character(character)
                                        if(char.level.value >= level_min){
                                            promises.push(
                                                new Promise((resolve, reject) =>{
                                                    char.getDays()
                                                    .then((value)=>{
                                                        const up = []
                                                        const shouldUp = char.shouldLevelUp()
    
                                                        if(shouldUp.level > -1){
                                                            up.push({character: char, type: "level", icon: char.level.icon, pertinence: shouldUp.level, day: null})
                                                        }
    
                                                        if(shouldUp.artifacts > -1){
                                                            up.push({character: char, type: 'artifacts', icon: char.artifacts.icon, pertinence: shouldUp.artifacts, day: null})
                                                        }
    
                                                        let istalentday = value.talents == farmDay || !farmDay
                                                        let weekly_boss = new Promise((resolve, reject) => {
                                                            if(shouldUp.talents > -1){
                                                                if(!jour || istalentday){
                                                                    resolve({character: char, type: "talents", icon: char.talents.icon, pertinence: shouldUp.talents, day: istalentday})
                                                                }else{
                                                                    con.query(`SELECT weekly_drop FROM el_materials WHERE name = "${char.dbname}"`, (err, result) => {
                                                                        if(!err){
                                                                            if(result && result[0]){
                                                                                let weekly_drop = result[0].weekly_drop
                                                                                con.query(`SELECT source FROM weekly_loots WHERE 1st = "${weekly_drop}" OR 2nd = "${weekly_drop}" OR 3rd = "${weekly_drop}"`, (err, result) => {
                                                                                    if(!err){
                                                                                        if(result && result[0]){
                                                                                            let boss = result[0].source
                                                                                            resolve({
                                                                                                character: char,
                                                                                                icon: encodeURI("https://adrien5902.ddns.net/genshin-impact/imgs/enemies/" + boss + ".png"),
                                                                                                type: "weekly_boss",
                                                                                                pertinence: shouldUp.talents,
                                                                                                day: !farmDay,
                                                                                                info: boss
                                                                                            })
                                                                                        }else{
                                                                                            console.error("err boss not found for " + weekly_drop + " " + char.dbname)
                                                                                            resolve(false)
                                                                                        }
                                                                                    }else{
                                                                                        reject(err)
                                                                                    }
                                                                                })
                                                                            }else{
                                                                                console.error("err weekly_drop not found for " + char.dbname)
                                                                                resolve(false)
                                                                            }
                                                                        }else{
                                                                            reject(err)
                                                                        }
                                                                    })
                                                                }
                                                            }else{
                                                                resolve(false)
                                                            }
                                                        })
    
                                                        let isweaponday = value.weapon == farmDay || !farmDay
                                                        if((!jour || isweaponday) && shouldUp.weapon > -1){
                                                            up.push({character: char, type: "weapon", icon: char.weapon.icon, pertinence: shouldUp.weapon, day: isweaponday})
                                                        }

                                                        weekly_boss
                                                        .then((v) => {
                                                            if(v){
                                                                up.push(v)
                                                            }
                                                            resolve(up)
                                                        })
                                                        .catch((err) => {
                                                            reject(err)
                                                        })
                                                    })
                                                    .catch((err)=>{
                                                        reject(err)
                                                    })
                                                })
                                            )
                                        }
                                    }
                                }
    
                                Promise.all(promises)
                                .then((values) => {
                                    let list = values.flat(1)

                                    list.sort((a, b) => b.pertinence - a.pertinence)
                                        
                                    if(uptype){
                                        list = list.filter(function(item) {
                                            return item.type == uptype
                                        })
                                    }

                                    list = list.filter((obj, index, self) =>
                                    obj.type !== 'weekly_boss' || index === self.findIndex((t) => (
                                        t.info === obj.info
                                    ))
                                  );

                                    list = list.slice(0, limit)
                                    resolve(list)
                                })
                                .catch((err)=>{
                                    reject(err)
                                })
                            }else{
                                reject(err)
                            }
                        })
                    }else{
                        reject(new Error("account not registered"))
                    }            
                }else{
                    reject(new Error("unknown user"))
                }
            }else{
                reject(err)
            }
        })
    })
}

module.exports = {
	getFarming,
    refreshFarming
};