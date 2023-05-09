const { SlashCommandBuilder } = require('discord.js');
const {hoyolab} = require('../functions.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('info')
		.setDescription('Affiche les informations de genshin de la personne')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Nom de la personne (optionel)')
                .setRequired(false)
        ),
        
	async execute(interaction) {
        const lang = interaction.lang
        await interaction.deferReply({ephemeral:true});
        const user = interaction.options.getUser('user') ?? interaction.user;
        await hoyolab(interaction, true, interaction.commandName, user, async(err, data)=>{
            if(!err){
                let content = ""
                content += "Compte genshin de " + user.toString() + " : "
                content += "\n"+data.name
                content += "\nUID : " + data.uid
                content += "\nAR : " + data.ar
                content += "\nAbysses : Étage " + data.abyss.floor + ", " + data.abyss.stars + ":star:"
                content += "\nNombre de jours actifs : " + data.days_active
                content += "\nNombre de succès : " + data.achievements
                content += "\nNombre de personnages : " + data.characters
        
                await interaction.editReply({content:content, ephemeral:true})
            }else{
                await interaction.editReply({content: err, ephemeral:true})
            }
        })
	},
};