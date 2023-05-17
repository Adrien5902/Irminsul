const puppeteer = require("puppeteer");
const mysql = require('mysql');

const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'genshin'
})

// class Hoyolab{
//     static links = {
//         home: "https://hoyolab.com/",
//         "check-in": {
//             hsr: "",
//             genshin: "",
//         },
//     }

//     static goto(url, cookies, isheadless = true){
//         return new Promise(async(resolve, reject)=>{
//             const headless = isheadless ? "new" : false
//             const browser = await puppeteer.launch({headless});
//             const page = await browser.newPage();
        
//             await page.goto(this.links[url]);
//             for(let cookie of cookies){
//                 await page.setCookie(
//                     cookie
//                 )
//             }
//             resolve({browser, page})
//         })
//     }
// }

Date.prototype.addDays = function(days) {
    let date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

Date.prototype.getYYYYMMDD = function(){
    let date = new Date(this.valueOf());
    return date.toISOString().slice(0, 10)
}

class User{
    constructor(data){
        Object.assign(this, data)
    }

    static get(info = {authcode: null, discordId: null}){
        return new Promise((resolve, reject)=>{
            const {authcode, discordId} = info
            let sql = "SELECT * FROM irminsul_hoyolab WHERE "

            if(authcode){
                sql += `authcode = '${authcode}'`
            }else if(discordId){
                sql += `discordId = '${discordId}'`
            }else{
                reject(new Error("Please specify something"))
            }

            sql += " LIMIT 1"

            conn.query(sql, (err, res)=>{
                if(!err){
                    if(res && res[0]){
                        resolve(new User(res[0]))
                    }else{
                        throw new Error("User not found")
                    }
                }else{
                    throw err
                }
            })
        })
    }
    
    // getmyuuid(){
    //     return new Promise((resolve, reject)=>{
    //         const {ltoken, ltuid} = this
        
    //         Hoyolab.goto("home", [
    //             {
    //                 name: "ltoken",
    //                 value: ltoken,
    //             },
    //             {
    //                 name: "ltuid",
    //                 value: String(ltuid),
    //             }
    //         ], false)
    //         .then(async({browser, page})=>{
    //             let cookies = await page.cookies()
    //             let {value: myuuiud} = cookies.find(c => 
    //                 c.name == "_MHYUUID"
    //             )
    //             // await browser.close();
    //             resolve(myuuiud)
    //         })
    //     })
    // }
}


class GenshinEvent{
    constructor(type, date, value = null){
        this.type = type
        this.date = date
        this.value = value
    }
    
    static from = {
        shop_reset: (month = 0) => {
            const shop_rotations = [
                {
                    characters: [
                        "Fischl",
                        "Xiangling"
                    ],
                    weapons: "Rochenoires"
                },{
                    characters: [
                        "Beidou",
                        "Noelle"
                    ],
                    weapons: "Royales"
                },{
                    characters: [
                        "Ningguang",
                        "Xingqiu"
                    ],
                    weapons: "Rochenoires"
                },{
                    characters: [
                        "Razor",
                        "Amber"
                    ],
                    weapons: "Royales"
                },{
                    characters: [
                        "Bennett",
                        "Lisa"
                    ],
                    weapons: "Rochenoires"
                },{
                    characters: [
                        "Barbara",
                        "Kaeya"
                    ],
                    weapons: "Royales"
                }
            ]

            let m = month
            if (m > 5) {
                m = m - 6
            }

            return new GenshinEvent("shop_reset", new Date((new Date(Date.now())).getFullYear(), month, 1, 0, 0, 0, 0), shop_rotations[m])
        },
        abyss_reset: (date) => {
            return new this("abyss_reset", date)
        },
        version: (date) => new Promise((resolve, reject)=>{
            conn.query(`SELECT ver FROM version WHERE date = '${date}'`, (err, result) => {
                if (!err) {
                    if(result && result[0]){
                        resolve(new this("version", date, result[0].ver))
                    }else{
                        resolve(null)
                    }
                } else {
                    reject(err)
                }
            })
        }),
        banners: (date) => new Promise((resolve, reject) => {
            conn.query(`SELECT ver, date FROM version WHERE date = '${date}' OR phase2date = '${date}'`, (err, result) => {
                if (!err) {
                    if(result && result[0]){
                        let ver = result[0].ver
                        let phase = (date == new Date(result[0].date.getTime() + 60*60*1000*2).getYYYYMMDD()) ? 1 : 2
                        conn.query(`SELECT name FROM banner_leaks WHERE ver = ${ver} AND phase = ${phase} ORDER BY prob DESC`, (err, result) => {
                            if (!err) {
                                if (result && result[0]) {
                                    const inClause = '(' + result.map(val => `'${val.name}'`).join(', ') + ')';
                                    conn.query(`SELECT name FROM chars WHERE rarity = 5 AND name IN ${inClause}`, (err, resultRar) => {
                                        let data = []
                                        if(!err){
                                            if(resultRar && resultRar[0]){
                                                for (let banner of resultRar) {
                                                    data.push(new this("banner", date, {name: banner.name, icon: "https://adrien5902.ddns.net/genshin-impact/imgs/char/icon/"+banner.name+".png"}))
                                                }
                                                resolve(data)
                                            }else{
                                                resolve(null)
                                            }
                                        }else{
                                            reject(err)
                                        }
                                    })
                                }else{
                                    resolve(null)
                                }
                            } else {
                                reject(err)
                            }
                        })
                    }else{
                        resolve(null)
                    }
                } else {
                    reject(err)
                }
            })
        }),
        live: (date) => new Promise((resolve, reject) => {
            let verDate = new Date(date.getTime() + 12 * 24 * 60 * 60 * 1000)
            conn.query(`SELECT ver FROM version WHERE date = '${verDate.getYYYYMMDD()}'`, (err, result) => {
                if (!err) {
                    if (result && result[0]) {
                        resolve(new this("live", date, result[0].ver))
                    } else {
                        resolve(null)
                    }
                } else {
                    reject(err)
                }
            })
        }),
        events: (date) => new Promise((resolve, reject) => {
            conn.query(`SELECT name, type, id FROM calendar_events WHERE date = '${date.getYYYYMMDD()}'`, (err, result)=>{
                if(!err){
                    let data = []
                    if(result && result[0]){
                        for(let event of result){
                            data.push(new this("event", date, {name: event.name, type: event.type, icon: "https://adrien5902.ddns.net/genshin-impact/imgs/events/"+event.id+".png"}))
                        }
                        resolve(data)
                    }else{
                        resolve(null)
                    }
                }else{
                    reject(err)
                }
            })
        })
    }

    static get(days = 7){
        return new Promise(async (resolve, reject)=>{
            let now = new Date(Date.now())
            let dayPromises = []

            for(let i = 0; i < days; i++){
                dayPromises.push(new Promise(async (resolve, reject) => {
                    const res = []

                    let current = now.addDays(i)
                    let date = current.getDate()
                    let d = current.getYYYYMMDD()

                    if (date == 1 || date == 16) {
                        res.push(this.from.abyss_reset(d))
                    }

                    if(date == 1){
                        res.push(this.from.shop_reset(current.getMonth() + 1))
                    }

                    Promise.all([
                        this.from.version(current), 
                        this.from.banners(current), 
                        this.from.live(current), 
                        this.from.events(current)
                    ])
                    .then((values) => {
                        for(let value of values){
                            if(value){
                                res.push(value)
                            }
                        }
                        resolve(res)
                    })
                    .catch((err) => {
                        reject(err)
                    })
                }))
            }

            Promise.all(dayPromises)
            .then((days) => {
                const result = days.flat()
                resolve(result)
            })
            .catch((err)=>{
                reject(err)
            })
        })
    }
}

module.exports = {
    User, 
    // Hoyolab,
    conn,
    GenshinEvent,
}