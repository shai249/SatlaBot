const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const { connectDatabase } = require('./utils/database');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const interactionHandler = require('./handlers/interactionHandler');
require('dotenv').config();

class SatlaBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMessageReactions
            ],
            partials: [Partials.Message, Partials.Channel, Partials.Reaction]
        });

        this.client.commands = new Collection();
        this.client.cooldowns = new Collection();
        this.init();
    }

    async init() {
        try {
            // Connect to database
            await connectDatabase();
            console.log('✅ Database connected successfully');

            // Load commands and events
            await loadCommands(this.client);
            await loadEvents(this.client);

            // Initialize interaction handler
            interactionHandler.init(this.client);

            // Login to Discord
            await this.client.login(process.env.TOKEN);
        } catch (error) {
            console.error('❌ Error initializing bot:', error);
            process.exit(1);
        }
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Start the bot
new SatlaBot();
