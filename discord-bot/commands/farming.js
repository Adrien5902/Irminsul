const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { reply, UnicodeToUTF, hoyolabLinked, colorByElements, questionMarkURL, defaultLang, con } = require('../functions.js');
const fs = require("fs")
const {getFarming, refreshFarming} = require("./../farming.js");
const { type } = require('os');

String.prototype.UnicodeToUTF = UnicodeToUTF

const types = {
    "level": "Niveau",
    "weapon": "Arme",
    "talents": "Aptitudes", 
    "artifacts": "Artéfacts",
    "weekly_boss": "Boss hebdo"
}

function lvlUpEmbed(data){

    let icon = data.icon ?? questionMarkURL
    let embed = new EmbedBuilder()
        .setThumbnail(icon)
        .setColor(colorByElements[data.character.element])
        .addFields(
            {name: data.character.name, value: types[data.type]},
        )

    if(data.info){
        embed.addFields(
            {name: "\u200e", value: data.info},
        )
    }
        
    return embed
}

const limitMax = 50
const discordMaxEmbeds = 10

module.exports = {
    hoyolab: {script: true},
	data: new SlashCommandBuilder()
		.setName('farming')
		.setDescription("Que farmer ?")
        .addIntegerOption(option => 
            option
                .setName("level_min")
                .setDescription("Ne montreras que des personnages avec un niveau supérieur(ou égal) à celui demandé")
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(90)
        )
        .addStringOption(option => 
            option
                .setName("refresh")
                .setDescription("Rafraichis les personnages...")
                .setRequired(false)
                .addChoices(
                    {name: "Oui", value: "true"},
                    {name: "Non", value: "false"}
                )  
        )
        .addStringOption(option => 
            option
                .setName("character")
                .setDescription("Un personnage en particulier")
                .setRequired(false)
        )
        .addStringOption(option => 
            option
                .setName("jour")
                .setDescription("Seulement ce qu'on peut farmer aujourd'hui ?")
                .addChoices(
                    {name: "Afficher seulement ce qu'on peut farmer aujourd'hui (par défaut)", value: "true"},
                    {name: "Afficher tout", value: "false"}
                )
        )
        .addStringOption((option) => {
                option
                .setName("type")
                .setDescription("Type de ce que vous voulez farmer");

                const choices = []
                for(let i in types){
                    choices.push({name: types[i], value: i})
                }

                choices.forEach((el) => {
                    if(el){
                        option.addChoices(el)
                    }
                })

                return option
            }
        )
        
        .addIntegerOption(option => 
            option
                .setName("limit")
                .setDescription("Nombre de résultats (10 par défaut, 50 max)")
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(limitMax)
        ),
        
	async execute(interaction, exec = 1) {
        try{
            if(exec == 1){
                await interaction.deferReply({ephemeral:true})
            }

            const lang = interaction.lang
            
            const refresh = interaction.options.getString("refresh") === "true" ?? false
            const jour = (interaction.options.getString("jour") ?? true) === "true" || true
            const selectedCharacter = interaction.options.getString("character") ?? null
            const level_min = interaction.options.getInteger("level_min") ?? 1
            const uptype = interaction.options.getString("type") ?? false

            let limit
            if(selectedCharacter){
                limit = 3
            }else{
                let l = interaction.options.getInteger("limit") ?? discordMaxEmbeds
                limit = l > limitMax ? limitMax : l
            }
            
            hoyolabLinked(interaction, interaction.user, lang, async(err, data)=>{
                if(!err){
                    const path = "calcs/"+data.ltuid+".json"
                    
                    let p = new Promise(async(resolve, reject) => {
                        if(!fs.existsSync(path) || refresh){
                            await interaction.editReply(reply("Récupération des informations de vos personnages depuis hoyolab..."))

                            refreshFarming({discordId: interaction.user.id})
                            .then(async(value)=>{
                                await interaction.editReply(reply("Calcul des données..."))
                                resolve()
                            })
                            .catch((err)=>{
                                reject(err.message)
                            })
                        }else{
                            await interaction.editReply(reply("Calcul des données..."))
                            resolve()
                        }
                    })

                    p.then(()=>{
                        getFarming({discordId: interaction.user.id}, jour, level_min, selectedCharacter, limit, uptype)
                        .then(async(value)=>{
                            const embeds = []
                            value.forEach(element => {
                                embeds.push(lvlUpEmbed(element))
                            });
                            if(value.length){
                                if(limit <= discordMaxEmbeds){
                                    await interaction.editReply(reply("Ajourd'hui vous pouvez farmer :", true, embeds))
                                }else{
                                    await interaction.editReply(reply("Ajourd'hui vous pouvez farmer :", true))
                                    for(i = 0; i < Math.ceil(limit/discordMaxEmbeds); i++){
                                        const mE = embeds.slice(i*discordMaxEmbeds, (i+1)*discordMaxEmbeds)
                                        if(mE.length){
                                            await interaction.followUp({content:":arrow_up:", ephemeral: true, embeds: mE})
                                        }else{
                                            break
                                        }
                                    }
                                }
                            }else{
                                await interaction.editReply(reply("Aucun résultats"))
                            }
                        })
                        .catch(async(err)=>{
                            console.error(err)
                            await interaction.editReply(reply(err.message))
                        })
                    })
                    .catch(async(err)=>{
                        console.error(err)
                        await interaction.editReply(reply(err.message))
                    })
                    
                }else{
                    console.error(err)
                    await interaction.editReply(reply(err))
                }
            })
        }catch(err){
            console.error(err)
            await interaction.editReply(reply(err))
        }
	},
};