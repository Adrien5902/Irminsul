const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
const {con, itemEmbed} = require('../functions.js')

const farmDays = [
    "Lundi/Jeudi",
    "Mardi/Vendredi",
    "Mercredi/Samedi"
]

const ints = [
    "1st",
    "2nd",
    "3rd"
]

const elMobDrops = [
    18, 30, 36
]

const talentsBooksN = [
    9, 63, 114
]

const talentsMobDrops = [
    18, 66, 93
]

module.exports = {
	data: new SlashCommandBuilder()
		.setName('materials')
		.setDescription('Affiche les matériaux requis pour améliorer le personnage')
        .addStringOption(option =>
            option
                .setName('character')
                .setDescription('Nom du personnage')
                .setRequired(true)
        ),
        
	async execute(interaction) {
        const lang = interaction.lang
        const character = interaction.options.getString('character') ?? "none";
        con.query('SELECT * FROM chars WHERE name = "'+ character +'"', async(err, result)=>{
            const char = result[0]
            con.query('SELECT * FROM el_materials WHERE name = "'+ character +'"', async(err, result)=>{
                if(result[0]){
                    const mat = result[0]
                    let elevationEmbed = []
                    let talentsEmbed = []

                    elevationEmbed.push(itemEmbed(mat.product, 1, 168))
                    const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('map')
                            .setLabel('Carte 🗺️')
                            .setStyle(ButtonStyle.Primary)
                    );

                    elevationEmbed.push(itemEmbed(mat.boss_drop, 4, 46))

                    await con.query('SELECT * FROM mob_loots WHERE 1st = "'+ mat.mob_drop +'"', async(err, result)=>{
                        const mobDrop = result[0]
                        for(let i in elMobDrops){
                            i = parseInt(i)
                            elevationEmbed.push(itemEmbed(mobDrop[ints[i]], (mobDrop.type + i + 1), elMobDrops[i], mobDrop.source))
                        }

                        elevationEmbed.push(itemEmbed("Mora", 3, 2092530))

                        await con.query('SELECT * FROM talent_books WHERE 1st = "'+ mat.talent_books +'"', async(err, result)=>{  
                            const talent_books = result[0] 
                            for(let i in talentsBooksN){
                                i = parseInt(i)
                                talentsEmbed.push(itemEmbed(talent_books[ints[i]], i + 2, talentsBooksN[i], "à "+talent_books.region+" le "+farmDays[talent_books.day-1]+"/Dimanche"))
                            }

                            for(let i in talentsMobDrops){
                                i = parseInt(i)
                                talentsEmbed.push(itemEmbed(mobDrop[ints[i]], (mobDrop.type + i + 1), talentsMobDrops[i], mobDrop.source))
                            }

                            await con.query('SELECT * FROM weekly_loots WHERE 1st = "'+ mat.weekly_drop +'" OR 2nd = "'+ mat.weekly_drop +'" OR 3rd = "'+ mat.weekly_drop +'"', async(err, result)=>{
                                if (result && result[0]){
                                    talentsEmbed.push(itemEmbed(mat.weekly_drop, 5, 18, result[0].source))
                                }
                                talentsEmbed.push(itemEmbed("Couronne de la sagesse", 5, 3, "Events et arbres"))
                                talentsEmbed.push(itemEmbed("Mora", 3, 4957500))

                                firstMsg = "**"+char.name+"**"
                                if(interaction.member && interaction.member.guild && typeof interaction.member.guild.emojis.cache.find(emoji => emoji.name === char.element) != "undefined"){
                                    let emoji = interaction.member.guild.emojis.cache.find(emoji => emoji.name === char.element)
                                    firstMsg += ` ${emoji}`
                                }
                                firstMsg += "\n**"+ lang.genshin.elevation +" : **"
        
                                await interaction.reply({content: firstMsg, ephemeral:true, embeds: elevationEmbed, components: [row]})
                                await interaction.followUp({content: "**"+ lang.genshin.talents +" :**", ephemeral:true, embeds: talentsEmbed})
                            })
                        })
                    })
                }else{
                    interaction.reply({content: lang.errors.characterUnknown.replace("&1", "*"+character+"*"), ephemeral:true})
                }
            })
        })
	},
};