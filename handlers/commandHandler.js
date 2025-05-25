const { Collection } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

async function loadCommands(client) {
    const commandsPath = path.join(__dirname, '../commands');
    
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
                    delete require.cache[require.resolve(filePath)];
                    
                    try {
                        const command = require(filePath);
                        
                        if ('data' in command && 'execute' in command) {
                            client.commands.set(command.data.name, command);
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
        
        console.log(`📁 Loaded ${client.commands.size} commands total`);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('📁 Commands directory not found, creating it...');
            await fs.mkdir(commandsPath, { recursive: true });
        } else {
            console.error('❌ Error loading commands:', error);
        }
    }
}

module.exports = { loadCommands };
