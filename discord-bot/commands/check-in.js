const { SlashCommandBuilder } = require('discord.js');
const {hoyolab, con, reply, hoyolabLinkURL, checkIn} = require('../functions.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('check-in')
		.setDescription('Connexion quotidienne hoyolab')
        .addSubcommand(subcommand =>
            subcommand
                .setName('redeem')
                .setDescription('Récupérer ses récompenses de connexion quotidienne hoyolab')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('auto')
                .setDescription('Récompenses de connexion quotidienne hoyolab automatiques')
                .addBooleanOption(option => 
                    option
                        .setName("on")
                        .setDescription('Activé?')
                        .setRequired(false)
                )
        ),
        
	async execute(interaction) {
        await interaction.deferReply({ephemeral: true})

        const lang = interaction.lang
        const subcommand = interaction.options._subcommand ?? null
        const user = interaction.user

        let content = false
        if(subcommand == "redeem"){
            hoyolab(interaction, false, "check-in", user, async (err, data)=>{
                if(!err){
                    if(!data.claimed){
                        await interaction.editReply(reply("**"+lang.commands["check-in"].desc+ ":**\n"+ lang.commands["check-in"].reward.replace("&1", data.amount).replace("&2", data.name) +"\n"+lang.commands["check-in"].mail))
                    }else{
                        await interaction.editReply(reply("**"+lang.commands["check-in"].desc+ ":**\n"+lang.commands["check-in"].alreadyClaimed))
                    }
                }else{
                    await interaction.editReply(reply(err))
                }
            })
        }else if(subcommand == "auto"){
            const query = "SELECT * FROM irminsul_hoyolab WHERE discordId = '"+ user.id +"'"
            con.query(query, async(err, res)=>{
                if(res){
                    if(res[0] && res[0].ltoken != "" && res[0].ltuid != "" && res[0].ltoken && res[0].ltuid){
                        const on = interaction.options.getBoolean("on") ?? null
                        if(on !== null){
                            const query = "UPDATE irminsul_hoyolab SET `check-in`="+ Number(on) +" WHERE discordId = '"+ user.id +"'"
                            con.query(query, async(err, res)=>{
                                if(res){
                                    await interaction.editReply(reply(lang.commands["check-in"].changedState + lang.enabled[String(on)] + "\n", query))
                                    if(on === true){
                                        checkIn(interaction.user)
                                    }
                                }else{
                                    await interaction.editReply(reply(lang.errors.sql + err + "\n", query))
                                }
                            })
                        }else{
                            let enabled = res[0]["check-in"]
                            content = lang.commands["check-in"].state
                            content += lang.enabled[String(Boolean(enabled))]
    
                            await interaction.editReply(reply(content))
                        }
                    }else{
                        await interaction.editReply(reply(lang.errors.hoyolab.linkRequired+" :\n"+hoyolabLinkURL))
                    }
                }else{
                    await interaction.editReply(reply(lang.errors.sql + err + "\n", query))
                }
            })
        }else{
            content = lang.wrongSubcommand
        }

        if(content){
            await interaction.editReply(reply(content))
        }
	},
};