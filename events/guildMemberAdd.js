const { Events, EmbedBuilder } = require('discord.js');
const GuildConfig = require('../models/GuildConfig');
const welcomeCommand = require('../commands/general/welcome');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        try {
            const guildConfig = await GuildConfig.findOne({ guildId: member.guild.id });
            
            if (!guildConfig) return;

            // Handle auto-role
            if (guildConfig.autoRoleConfig.enabled && guildConfig.autoRoleConfig.roleId) {
                try {
                    const role = member.guild.roles.cache.get(guildConfig.autoRoleConfig.roleId);
                    if (role && member.guild.members.me.roles.highest.position > role.position) {
                        await member.roles.add(role);
                        console.log(`✅ Auto-role "${role.name}" assigned to ${member.user.username}`);
                    }
                } catch (error) {
                    console.error('Error assigning auto-role:', error);
                }
            }

            // Handle welcome message with enhanced system
            if (guildConfig.welcomeConfig.enabled && guildConfig.welcomeConfig.channelId) {
                try {
                    const welcomeChannel = member.guild.channels.cache.get(guildConfig.welcomeConfig.channelId);
                    
                    if (welcomeChannel && welcomeChannel.permissionsFor(member.guild.members.me).has(['SendMessages', 'EmbedLinks'])) {
                        // Use the enhanced welcome embed from the welcome command
                        const welcomeEmbed = await welcomeCommand.createWelcomeEmbed(member, guildConfig, member.guild, false);
                        
                        await welcomeChannel.send({ embeds: [welcomeEmbed] });
                        console.log(`✅ Enhanced welcome message sent for ${member.user.username}`);
                    }
                } catch (error) {
                    console.error('Error sending welcome message:', error);
                }
            }

        } catch (error) {
            console.error('Error in guildMemberAdd event:', error);
        }
    }
};
