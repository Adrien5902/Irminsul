const Discord = require('discord.js'); //import discord.js
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { REST, Routes } = require('discord.js');
const cron = require('node-cron');
const fs = require('fs');
const { Lang, langs, defaultLang, con , checkIn} = require('./functions.js');
const TOKEN = "MTA3MzkxNjQyNDMyMzYwNDQ5Mw.GqJvaP.IHMyg_7VJmAIMNdvI8VcvfHsPG-9LHlGCsaQ64"
const CLIENT_ID = "1073916424323604493"
const CLIENT_SECRET = "GNG7K3XvzIg0VkSnsOPKf8mNYg1OAVzw"

const client = new Discord.Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
	]
})

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);

	autoCheckIn()
	cron.schedule("0 5 17 * * *", () => {
		autoCheckIn()
	});
	cron.schedule("0 5 18 * * *", () => {
		autoCheckIn()
	});
});

const commands = [];
client.commands = new Collection();

const commandsPath = 'commands';
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	let command = require(`./commands/${file}`);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		let names = {}
		let desc = {}
		for(let lang of Object.keys(langs)){
			names[lang] = langs[lang].commands[command.data.name].name
			desc[lang] = langs[lang].commands[command.data.name].desc
		}
		command.data.setNameLocalizations(names)
		command.data.setDescriptionLocalizations(desc)

		client.commands.set(command.data.name, command);
		commands.push(command.data.toJSON());
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();

client.on(Events.InteractionCreate, async interaction => {
	let lang = langs[interaction.locale] ?? defaultLang
	interaction.lang = lang
	if (interaction.isChatInputCommand()){

		const command = interaction.client.commands.get(interaction.commandName);
	
		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}
	
		if(!interaction.user.bot){
			try {
				await command.execute(interaction);
			} catch (error) {
				console.error(`Error executing ${interaction.commandName}`);
				console.error(error);
			}
		}
	}else if(interaction.isButton()){
		const btnPath = "./buttons/"
		if(fs.existsSync(btnPath+interaction.customId+".js")){
			const {execute} = require(btnPath+interaction.customId+".js")
			execute(interaction)
		}else{
			interaction.reply({content: lang.errors.undefined, ephemeral: true})
		}
	}else{
		return;
	}
});

client.login(TOKEN);

function autoCheckIn(){
	con.query("SELECT `gen-check-in`, `hsr-check-in`, CONVERT(discordId USING utf8) as discordId FROM irminsul_hoyolab WHERE `gen-check-in`= 1 OR `hsr-check-in` = 1", async(err, res)=>{
		console.log("Checking-in...")
		if(!err){
			for(let data of res){
				let id = data.discordId
				let user = await client.users.fetch(id)
				const games = []
				if(data["gen-check-in"]){
					games.push("gen")
				}
				if(data["hsr-check-in"]){
					games.push("hsr")
				}
				checkIn(user, games)
			}
		}else{
			console.error(err)
		}
	})
}