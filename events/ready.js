const { Events, ActivityType } = require('discord.js');
const { checkPermissions } = require('../utils/permissions');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`✅ ${client.user.tag} is now online!`);
        console.log(`📊 Serving ${client.guilds.cache.size} servers with ${client.users.cache.size} users`);

        // Set bot activity
        client.user.setActivity('🎫 Managing Tickets', { type: ActivityType.Custom });

        // Check bot permissions in all guilds
        for (const guild of client.guilds.cache.values()) {
            try {
                const botMember = guild.members.me;
                if (!botMember) continue;

                const permissionCheck = await checkPermissions.checkGuildPermissions(guild, botMember);
                
                if (!permissionCheck.hasAllPermissions) {
                    console.log(`⚠️ Missing permissions in ${guild.name}:`, permissionCheck.missingPermissions);
                }
            } catch (error) {
                console.error(`Error checking permissions for guild ${guild.name}:`, error);
            }
        }

        // Log some statistics
        const stats = {
            guilds: client.guilds.cache.size,
            users: client.users.cache.size,
            channels: client.channels.cache.size,
            commands: client.commands.size
        };

        console.log('📈 Bot Statistics:');
        console.log(`   Guilds: ${stats.guilds}`);
        console.log(`   Users: ${stats.users}`);
        console.log(`   Channels: ${stats.channels}`);
        console.log(`   Commands: ${stats.commands}`);
        console.log('🚀 Bot is ready to serve!');
    }
};
