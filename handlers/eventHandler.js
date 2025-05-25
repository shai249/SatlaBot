const fs = require('fs').promises;
const path = require('path');

async function loadEvents(client) {
    const eventsPath = path.join(__dirname, '../events');
    
    try {
        const eventFiles = await fs.readdir(eventsPath);
        const jsFiles = eventFiles.filter(file => file.endsWith('.js'));
        
        for (const file of jsFiles) {
            const filePath = path.join(eventsPath, file);
            delete require.cache[require.resolve(filePath)];
            
            try {
                const event = require(filePath);
                
                if (event.once) {
                    client.once(event.name, (...args) => event.execute(...args));
                } else {
                    client.on(event.name, (...args) => event.execute(...args));
                }
                
                console.log(`✅ Loaded event: ${event.name}`);
            } catch (error) {
                console.error(`❌ Error loading event ${file}:`, error);
            }
        }
        
        console.log(`📁 Loaded ${jsFiles.length} events total`);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('📁 Events directory not found, creating it...');
            await fs.mkdir(eventsPath, { recursive: true });
        } else {
            console.error('❌ Error loading events:', error);
        }
    }
}

module.exports = { loadEvents };
