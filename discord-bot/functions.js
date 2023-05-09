const mysql = require('mysql');
const {spawn} = require('child_process');
const { EmbedBuilder } = require('discord.js')
const fs = require('fs')
let defaultLang = "fr"

const questionMarkURL = "https://adrien5902.ddns.net/genshin-impact/imgs/items/Unknown.png"

const rarityColor = [
    "a6a6a6",
    "00992e",
    "009dff",
    "9900ff",
    "ffc400"
]
const colorByElements = {
    Pyro: "EC4923",
    Hydro: "00BFFF",
    Anemo: "359697",
    Electro: "945dc4",
    Dendro: "608a00",
    Cryo: "4682B4",
    Geo: "debd6c",
}

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

class Lang{
	constructor (lang = "fr"){
		let data = fs.readFileSync("lang/"+lang+".json")
		data = data.toString()
		data = JSON.parse(data)
		this.lang = lang
		Object.assign(this, data)
	}
}
let langsDir
let langs = {}
if(fs.existsSync("lang")){
	langsDir = fs.readdirSync("lang")
	for(let lang of langsDir){
		lang = lang.replace(".json", "")
		langs[lang] = new Lang(lang)
	}
	defaultLang = langs[defaultLang]
}

function reply (content, ephemral = true, embeds) {
	return {content: content, ephemral: ephemral, embeds: embeds}
}

const hoyolabLinkURL = "https://adrien5902.ddns.net/genshin-impact/irminsul/hoyolab/"
async function hoyolabLinked(interaction, user, lang = defaultLang, _callback){
	con.query("SELECT * FROM irminsul_hoyolab WHERE discordId = '"+ user.id +"'", async(err, result)=>{
		if(!err){
			if(result[0] && result[0].ltoken && result[0].ltuid && result[0].server){
				const userData = result[0]
				return _callback(false, userData)
			}else{
				if(user == interaction.user){
					_callback(lang.errors.hoyolab.linkRequired+" :\n"+hoyolabLinkURL, null)
				}else{
					_callback(lang.errors.hoyolab.notLinked.replace("&1", user.toString()), null)
				}
			}
		}else{
			_callback(lang.errors.sql + " : "+err, null)
		}
	})	
}

async function hoyolab(interaction, needInfo, arg, user = null, _callback){
	const lang = interaction.lang
	if(user == null){
		user = interaction.user
	}
	
	hoyolabLinked(interaction, user, lang, (err, data)=>{	
		if(!err){
			const userData = data
			if(!needInfo || userData.showInfo){
				const python = spawn('python', ['hoyolab.py', userData.server, userData.ltoken, userData.ltuid, arg]);
				python.stdout.on('data', async (data) => {
					data = await data.toString();
					data = await JSON.parse(data)
					if(!data.err){
						_callback(false, data)
					}else{
						_callback(lang.errors.undefined + " : " + data.err, null)
					}
				});
			}else{
				_callback(lang.errors.hoyolab.unauthorized.replace("&1", user.toString()), null)
			}
		}else{
			_callback(err, null)
		}
	})
}

async function wishHistory(interaction, arg, _callback){
	const lang = interaction.lang
	const user = interaction.user
	con.query("SELECT authkey FROM irminsul_hoyolab WHERE discordId = '"+ user.id +"'", async(err, result)=>{
		if(!err){
			if(result[0] && result[0].wishAuthKey){
				const userData = result[0]
				const python = spawn('python', ['wish.py', userData.wishAuthKey, arg]);
				python.stdout.on('data', async (data) => {
					data = await data.toString();
					data = await JSON.parse(data)
					if(!data.err){
						_callback(false, data)
					}else{
						_callback(lang.errors.undefined + " : " + data.err, null)
					}
				});
			}else{
				let url = "https://adrien5902.ddns.net/genshin-impact/irminsul/wish/?discordId="+user.id+"&avatar="+user.avatar+"&name="+user.username

				url = url.replaceAll(" ", "%20")

				_callback(lang.errors.hoyolab.linkRequired+" :\n"+url, null)
			}
		}else{
			_callback(lang.errors.sql + " : "+err, null)
		}
	})
}

function itemEmbed(name, rarity, x = 1, source = null){
    let embed = new EmbedBuilder()
        .setThumbnail('https://adrien5902.ddns.net/genshin-impact/imgs/items/'+ name.replaceAll(" ", "%20") +'.png')
        .addFields(
            {name: name, value: "x"+x},
        )

	if(rarityColor[rarity-1]){
        embed.setColor(Number("0x"+rarityColor[rarity-1]))
	}

    if(source){
        embed.addFields({name: "Source", value: source})
    }

    return embed
}

async function checkIn(user, _callback){
	const lang = langs.fr
	con.query("SELECT ltoken, ltuid, server FROM irminsul_hoyolab WHERE discordId = '"+ user +"'", async(err, result)=>{
		if(!err){
			if(result[0] && result[0].ltoken && result[0].ltuid && result[0].server){
				const userData = result[0]
				const python = spawn('python', ['hoyolab.py', userData.server, userData.ltoken, userData.ltuid, "check-in"]);
				python.stdout.on('data', async (data) => {
					data = await data.toString();
					data = await JSON.parse(data)
					if(!data.err){
						if(!data.claimed){
							let embed = new EmbedBuilder()
							.setColor(0xffc400)
							.setThumbnail(data.icon)
							.addFields(
								{name: data.name, value: "x"+data.amount},
							)

							console.log(user.username + " claimed daily rewards : x" + data.amount + " " + data.name)
							user.send(reply("**"+lang.commands["check-in"].desc+ ":**\n" + lang.commands["check-in"].mail, false, [embed]))
						}
					}
				});
			}
		}
	})
}

function UnicodeToUTF(){
    let utf8String = '';
    for(let i = 0; i < this.length; i++) {
        const charCode = this.charCodeAt(i);
        if(charCode > 127) { // check if the character is a Unicode character
            utf8String += String.fromCharCode(parseInt(this[i].replace('\\u', '0x'), 16)); // convert the Unicode character to UTF-8 encoded string
        } else {
            utf8String += this[i]; // if the character is not a Unicode character, add it to the UTF-8 string as it is
        }
    }
}

function farmDay(){
	let now = new Date(Date.now())
	return now.getDay()/2
}

module.exports = {
	rarityColor,
	colorByElements,
	
	defaultLang,
	langs,
	Lang,

	con,

	hoyolabLinkURL,
	questionMarkURL,

	reply,
	itemEmbed,
	farmDay,

	hoyolab,
	hoyolabLinked,
	checkIn,
	wishHistory,

	UnicodeToUTF,
}