const { SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const {hoyolab} = require('../functions.js')

module.exports = {
    hoyolab: {script: true},
	data: new SlashCommandBuilder()
		.setName('resin')
		.setDescription('Affiche votre résine actuelle'),
        
	async execute(interaction) {
        const lang = interaction.lang
        await interaction.deferReply({ephemeral:true});
        await hoyolab(interaction, true, interaction.commandName, interaction.user, async(err, data)=>{
            if(!err){
                let embed = new EmbedBuilder()
                    .setColor("0x03b1fc")
                    .setThumbnail("https://static.wikia.nocookie.net/gensin-impact/images/3/35/Item_Fragile_Resin.png")
                    .addFields(
                        {name: lang.genshin.resin+" :", value: data.value + "/" + data.max},
                    )
    
            
                if(data.value >= data.max){
                    embed.addFields(
                        {name: '\u200B', value: lang.commands.resin.full},
                    )
                }else{
                    let minutes = (data.max - data.value) * 8
                    let hours = Math.floor(minutes/60)
                    let min = minutes%60
        
                    embed.addFields(
                        {name: lang.commands.resin.charging + " :", value: hours + "h" + min + "min"},
                    )
                }
        
                await interaction.editReply({ephemeral:true, embeds: [embed]})
            }else{
                await interaction.editReply({content: err, ephemeral:true})
            }
        })
	},
};