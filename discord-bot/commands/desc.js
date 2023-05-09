const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const {itemEmbed} = require('../functions.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('desc')
		.setDescription('Affiche la description du personnage')
        .addStringOption(option =>
            option
                .setName('character')
                .setDescription('Nom du personnage')
                .setRequired(true)
        ),
        
	async execute(interaction) {
        const lang = interaction.lang
        await interaction.deferReply({ephemeral:true})
        const character = interaction.options.getString('character') ?? "none";
        con.query("SELECT * FROM chars WHERE name = '"+ character +"'", async(err, result)=>{
            if(result[0]){
                let files = []
                const char = result[0] 

                let reply = ""

                reply += "**"+char.name+"** "
                if(char.gender == 1){
                    reply += ":male_sign:"
                }else if(char.gender == 2){
                    reply += ":female_sign:"
                }
                reply += "\n"

                reply += lang.genshin.element + " : "
                if(interaction.member && interaction.member.guild && typeof interaction.member.guild.emojis.cache.find(emoji => emoji.name === char.element) != "undefined"){
                    let emoji = interaction.member.guild.emojis.cache.find(emoji => emoji.name === char.element)
                    reply += ` ${emoji}`
                }
                reply += char.element +"\n"

                reply += lang.genshin.rarity + " : "
                for(let i = 0; i < char.rarity; i++){
                    reply += ":star:"
                }
                reply += "\n"

                reply += lang.genshin.weapon + " : "
                reply += lang.genshin.weapons[char.weapon] +"\n"

                reply += lang.genshin.region + " : "
                reply += char.region +"\n"

                reply += lang.genshin.birthday + " : "
                reply += char.birthday +"\n"

                if(fs.existsSync("F:/xampp/htdocs/genshin-impact/imgs/char/icon/"+ char.name + ".png")){
                    files.push({
                        attachment: "https://adrien5902.ddns.net/genshin-impact/imgs/char/icon/"+ char.name + ".png"
                    })
                }

                await interaction.editReply({content: reply, ephemeral:true, files:files})
            }else{
                await interaction.editReply({content: lang.errors.characterUnknown.replace("&1", "*"+character+"*"), ephemeral:true})
            }
        })
	},
};