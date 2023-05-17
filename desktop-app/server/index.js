const express = require("express")
const fs = require("fs")
const cors = require("cors")
const https = require('https')
const conn = require("./functions")

const app = express()
const port = 3001

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



app.get("genshin/character-info", cors(), async (req, res)=>{
    
})

app.get(requests + "auto-check-in", cors(), async (req, res)=>{
    const authcode = req.query.authcode
    if(authcode){
        userInfo(authcode, (err, data)=>{
            if(!err){
                if(req.query.action){
                    let enable = (req.query.action == "enable") ? 1 : 0
                    conn.query("UPDATE irminsul_hoyolab SET `check-in` = "+ enable +" WHERE authcode = " + mysql.escape(authcode) + " LIMIT 1", (err)=>{
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

app.get(requests + "events", cors(), async (req, res)=>{
})
