const { REST, Routes } = require('discord.js');
const { Collection } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const commands = [];
const commandsCollection = new Collection();

async function loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    
    try {
        const commandFolders = await fs.readdir(commandsPath);
        
        for (const folder of commandFolders) {
            const folderPath = path.join(commandsPath, folder);
            const stat = await fs.stat(folderPath);
            
            if (stat.isDirectory()) {
                const commandFiles = await fs.readdir(folderPath);
                const jsFiles = commandFiles.filter(file => file.endsWith('.js'));
                
                for (const file of jsFiles) {
                    const filePath = path.join(folderPath, file);
                    
                    try {
                        const command = require(filePath);
                        
                        if ('data' in command && 'execute' in command) {
                            commands.push(command.data.toJSON());
                            commandsCollection.set(command.data.name, command);
                            console.log(`✅ Loaded command: ${command.data.name}`);
                        } else {
                            console.log(`⚠️ Command at ${filePath} is missing required "data" or "execute" property.`);
                        }
                    } catch (error) {
                        console.error(`❌ Error loading command ${file}:`, error);
                    }
                }
            }
        }
    } catch (error) {
        console.error('❌ Error loading commands:', error);
        process.exit(1);
    }
}

async function deployCommands() {
    const rest = new REST().setToken(process.env.TOKEN);

    try {
        console.log(`🔄 Started refreshing ${commands.length} application (/) commands.`);

        // Deploy to specific guild (faster for development)
        if (process.env.GUILD_ID) {
            const data = await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands },
            );
            console.log(`✅ Successfully reloaded ${data.length} guild application (/) commands.`);
        } else {
            // Deploy globally (takes up to 1 hour to propagate)
            const data = await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands },
            );
            console.log(`✅ Successfully reloaded ${data.length} global application (/) commands.`);
        }
    } catch (error) {
        console.error('❌ Error deploying commands:', error);
        process.exit(1);
    }
}

async function main() {
    console.log('🚀 Starting command deployment...');
    
    if (!process.env.TOKEN || !process.env.CLIENT_ID) {
        console.error('❌ Missing required environment variables: TOKEN and CLIENT_ID');
        process.exit(1);
    }

    await loadCommands();
    await deployCommands();
    
    console.log('🎉 Command deployment completed!');
    process.exit(0);
}

main();
