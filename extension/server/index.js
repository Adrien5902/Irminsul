const express = require("express")
const fs = require("fs")
const app = express()
const port = 3002
const cors = require("cors")
const https = require('https')
const {spawn} = require('child_process');
const mysql = require('mysql');
const { getFarming, refreshFarming } = require("./../../discord-bot/farming")

const requests = "/genshin-impact/irminsul/requests/"

const sslDir = "C:/SSL certs/"
const options = {
    key: fs.readFileSync(sslDir+'privkey.pem'),
    cert: fs.readFileSync(sslDir+'cert.pem'),
};

app.use(express.urlencoded({extended: true}))
app.use(express.json())
app.use(cors())

https.createServer(options, app).listen(port, ()=>{
    console.log("Starting server...")
})

function connect(db){
    con = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        passwd: '',
        database: db
    });
    
    con.connect((err) => {
        if (err) throw err
    })
    
    return con
}
con = connect("genshin")

Date.prototype.addDays = function(days) {
    let date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

Date.prototype.getYYYYMMDD = function(){
    let date = new Date(this.valueOf());
    return date.toISOString().slice(0, 10)
}

function userInfo(authcode, callback){
	con.query("SELECT * FROM irminsul_hoyolab WHERE authcode = "+ mysql.escape(authcode), async(err, result)=>{
        if(!err){
            if(result, result[0]){
                callback(false, result[0])
            }else{
                callback("USERNOTFOUND")
            }
        }else{
            callback(err)
        }
    })
}

function hoyolabGet(userData, arg, callback){
    const pyPath = "../../hoyolab.py"
    const python = spawn('python', [pyPath, userData.server, userData.ltoken, userData.ltuid, arg]);
    if(python){
        python.stdout.on('data', async (data) => {
            data = await data.toString();
            data = await JSON.parse(data)

            if(!data.err){
                callback(false, data)
            }else{
                callback(data.err)
            }
        })
    }else{
        callback("PROCSPAWNERROR")
    }
}


function info(authcode, arg, callback){
    userInfo(authcode, (err, res)=>{
        if(!err && res){
            hoyolabGet(res, arg, (err, data)=>{
                if(!err && data){
                    callback(false, data)
                }else{
                    callback(err)
                }
            })
        }else{
            callback(err)
        }
    })
}

app.get(requests + "notes", cors(), async (req, res)=>{
    const authcode = req.query.authcode
    if(authcode){
        info(authcode, "notes", (err, data)=>{
            if(!err && data){
                res.send(data)
            }else{
                res.send(JSON.stringify({err: err}))
            }
        })
    }else{
        res.send('{"err": "Please specify an authcode"}')
    }
})

app.get(requests + "birthday", cors(), async (req, res)=>{
    let now = new Date(Date.now())
    con.query("SELECT name FROM chars WHERE birthday = '" + ("0" + now.getDate()).slice(-2) + "/" + ("0" + (now.getMonth() + 1)).slice(-2) +"'", (err, result)=>{
        if(!err){
            if(result && result[0]){
                res.send(JSON.stringify({character: result[0].name, icon: "https://adrien5902.ddns.net/genshin-impact/imgs/char/icon/"+result[0].name + ".png"}))
            }else{
                res.send(JSON.stringify({character: false}))
            }
        }else{
            console.log(err)
        }
    })    
})

app.get(requests + "autoCheckIn", cors(), async (req, res)=>{
    const authcode = req.query.authcode
    if(authcode){
        userInfo(authcode, (err, data)=>{
            if(!err){
                if(req.query.action){
                    let enable = (req.query.action == "enable") ? 1 : 0
                    con.query("UPDATE irminsul_hoyolab SET `check-in` = "+ enable +" WHERE authcode = " + mysql.escape(authcode) + " LIMIT 1", (err)=>{
                        if(!err){
                            res.send(JSON.stringify({ok: true, enabled: enable == 1}))
                        }else{
                            res.send(JSON.stringify({err: err}))
                        }
                    })
                }else{
                    res.send(JSON.stringify({enabled: data['check-in']}))
                }
            }else{
                res.send(JSON.stringify({err: err}))
            }
        })
    }else{
        res.send('{"err": "Please specify an authcode"}')
    }
})

const shopRotation = [
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
app.get(requests + "events", cors(), async (req, res)=>{
    let now = new Date(Date.now())
    let dayCount = req.query.day ?? 7
    let dayPromises = []

    for(i = 0; i < dayCount; i++){
        dayPromises.push(
            new Promise(async (resolve, reject) => {
                let send = []

                let current = now.addDays(i)
                let date = current.getDate()
                let year = current.getFullYear()
                let montIndex = current.getMonth() + 1
                let d = current.getYYYYMMDD()

                let abyss_reset = date == 1 || date == 16
                if (abyss_reset) {
                    send.push({ type: "abyss_reset", date: d })
                }

                let shop_reset = date == 1
                if (shop_reset) {
                    let m = montIndex
                    if (m > 6) {
                        m = m - 6
                    }

                    send.push({ type: "shop_reset", date: d, value: shopRotation[m - 1] })
                }

                let Pversion = new Promise((resolve, reject) => {
                    con.query(`SELECT ver FROM version WHERE date = '${d}'`, (err, result) => {
                        if (!err) {
                            if(result && result[0]){
                                resolve({ type: "version", date: d, value: result[0].ver })
                            }else{
                                resolve(null)
                            }
                        } else {
                            reject(err)
                        }
                    })
                })

                let Pbanners = new Promise((resolve, reject) => {
                    con.query(`SELECT ver, date FROM version WHERE date = '${d}' OR phase2date = '${d}'`, (err, result) => {
                        if (!err) {
                            if(result && result[0]){
                                let ver = result[0].ver
                                let phase = (d == new Date(result[0].date.getTime() + 60*60*1000*2).getYYYYMMDD()) ? 1 : 2
                                con.query(`SELECT name FROM banner_leaks WHERE ver = ${ver} AND phase = ${phase} ORDER BY prob DESC`, (err, result) => {
                                    if (!err) {
                                        if (result && result[0]) {
                                            const inClause = '(' + result.map(val => `'${val.name}'`).join(', ') + ')';
                                            con.query(`SELECT name FROM chars WHERE rarity = 5 AND name IN ${inClause}`, (err, resultRar) => {
                                                let data = []
                                                if(!err){
                                                    if(resultRar && resultRar[0]){
                                                        for (let banner of resultRar) {
                                                            data.push({ type: "banner", value: {name: banner.name, icon: "https://adrien5902.ddns.net/genshin-impact/imgs/char/icon/"+banner.name+".png"}, date: d})
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
                })

                let Plive = new Promise((resolve, reject) => {
                    let verDate = new Date(current.getTime() + 12 * 24 * 60 * 60 * 1000)

                    con.query(`SELECT ver FROM version WHERE date = '${verDate.getYYYYMMDD()}'`, (err, result) => {
                        if (!err) {
                            if (result && result[0]) {
                                resolve({ type: "live", date: d, value: result[0].ver})
                            } else {
                                resolve(null)
                            }
                        } else {
                            reject(err)
                        }
                    })
                })

                let Pevents = new Promise((resolve, reject) => {
                    con.query(`SELECT name, type, id FROM calendar_events WHERE date = '${d}'`, (err, result)=>{
                        if(!err){
                            let data = []
                            if(result && result[0]){
                                for(let event of result){
                                    data.push({type: "event", date: d, value: {name: event.name, type: event.type, icon: "https://adrien5902.ddns.net/genshin-impact/imgs/events/"+event.id+".png"}})
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

                Promise.all([Pversion, Pbanners, Plive, Pevents]).then((values) => {
                    for (let value of values) {
                        if (value) {
                            if (typeof value == "object" && Array.isArray(value)) {
                                for (let v of value) {
                                    send.push(v)
                                }
                            } else {
                                send.push(value)
                            }
                        }
                    }

                    resolve(send)
                })
                .catch((err) => {
                    reject(err)
                })
            })
        )
    }

    Promise.all(dayPromises).then((days) => {
        let result = [] 
        for(let day of days){
            if(day){
                if (typeof day == "object" && Array.isArray(day)){
                    for(let v of day){
                        result.push(v)
                    }
                }else{
                    result.push(day)
                }
            }
        }

        res.send(JSON.stringify({err: null, data: result}))
    })
    .catch((err)=>{
        console.log(err)
        res.send(JSON.stringify({err: err}))
    })
})

app.get(requests + "farming", cors(), async (req, res)=>{
    const authcode = req.query.authcode
    if(authcode){
        if(req.query.refresh){
            refreshFarming({code: authcode})
            .then((value)=>{
                res.send(value)
            })
            .catch((err)=>{
                console.error(err)
                res.send(JSON.stringify({err: "Something bad happened, please contact the admin for more info."}))
            })
        }else{
            getFarming({code: authcode}, req.query.day, req.query.level_min, req.query.character, req.query.limit, req.query.type)
            .then((value)=>{
                res.send(value)
            })
            .catch((err)=>{
                if(err.message){
                    if(err.message == "unknown user"){
                        res.send(JSON.stringify({err: "User not found"}))
                    }else{
                        console.error(err)
                        res.send(JSON.stringify({err: "Something bad happened, please contact the admin for more info."}))
                    }
                }else{
                    console.error(err)
                    res.send(JSON.stringify({err: "Something bad happened, please contact the admin for more info."}))
                }
            })
        }
    }else{
        res.send(JSON.stringify({err: "Please specify an authcode"}))
    }
})