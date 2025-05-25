const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');
const { checkPermissions } = require('../../utils/permissions');
const { isConnected } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('health')
        .setDescription('Check bot health and configuration status')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        if (!checkPermissions.canConfigureBot(interaction.member)) {
            return await interaction.reply({
                content: '❌ You do not have permission to view health status.',
                flags: 64
            });
        }

        await interaction.deferReply({ flags: 64 });

        try {
            // Check database connection
            const dbStatus = isConnected() ? '🟢 Connected' : '🔴 Disconnected';

            // Check guild configuration
            const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
            
            // Check bot permissions
            const botMember = interaction.guild.members.me;
            const permissionCheck = await checkPermissions.checkGuildPermissions(interaction.guild, botMember);

            // Check configured channels and roles
            let configStatus = '';
            
            if (guildConfig) {
                // Welcome config
                if (guildConfig.welcomeConfig.enabled) {
                    const welcomeChannel = interaction.guild.channels.cache.get(guildConfig.welcomeConfig.channelId);
                    configStatus += `👋 **Welcome:** ${welcomeChannel ? '🟢 Configured' : '🟡 Channel missing'}\n`;
                } else {
                    configStatus += `👋 **Welcome:** 🔴 Disabled\n`;
                }

                // Auto-role config
                if (guildConfig.autoRoleConfig.enabled) {
                    const autoRole = interaction.guild.roles.cache.get(guildConfig.autoRoleConfig.roleId);
                    configStatus += `🔧 **Auto-role:** ${autoRole ? '🟢 Configured' : '🟡 Role missing'}\n`;
                } else {
                    configStatus += `🔧 **Auto-role:** 🔴 Disabled\n`;
                }

                // Ticket config
                const ticketConfig = guildConfig.ticketConfig;
                let ticketStatus = '🟢 Configured';
                
                if (!ticketConfig.categoryId || !interaction.guild.channels.cache.get(ticketConfig.categoryId)) {
                    ticketStatus = '🟡 Category missing';
                }
                if (!ticketConfig.staffRoleId || !interaction.guild.roles.cache.get(ticketConfig.staffRoleId)) {
                    ticketStatus = '🟡 Staff role missing';
                }
                if (!ticketConfig.enabled) {
                    ticketStatus = '🔴 Disabled';
                }

                configStatus += `🎫 **Tickets:** ${ticketStatus}\n`;

                if (ticketConfig.logChannelId) {
                    const logChannel = interaction.guild.channels.cache.get(ticketConfig.logChannelId);
                    configStatus += `📋 **Ticket Logs:** ${logChannel ? '🟢 Configured' : '🟡 Channel missing'}\n`;
                } else {
                    configStatus += `📋 **Ticket Logs:** 🟡 Not configured\n`;
                }
            } else {
                configStatus = '🔴 No configuration found - run setup commands';
            }

            // System info
            const memUsage = process.memoryUsage();
            const uptime = process.uptime();

            const embed = new EmbedBuilder()
                .setTitle('🏥 Bot Health Check')
                .addFields(
                    { 
                        name: '💾 Database', 
                        value: dbStatus, 
                        inline: true 
                    },
                    { 
                        name: '🔑 Permissions', 
                        value: permissionCheck.hasAllPermissions ? '🟢 All good' : '🟡 Some missing', 
                        inline: true 
                    },
                    { 
                        name: '📊 Commands', 
                        value: `🟢 ${interaction.client.commands.size} loaded`, 
                        inline: true 
                    },
                    { 
                        name: '⚙️ Configuration Status', 
                        value: configStatus, 
                        inline: false 
                    },
                    { 
                        name: '💻 System Resources', 
                        value: `**Memory:** ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB\n**Uptime:** ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`, 
                        inline: true 
                    },
                    { 
                        name: '🌐 Connection', 
                        value: `**Ping:** ${interaction.client.ws.ping}ms\n**Guilds:** ${interaction.client.guilds.cache.size}`, 
                        inline: true 
                    }
                )
                .setColor(permissionCheck.hasAllPermissions && isConnected() ? '#00ff00' : '#ffaa00')
                .setFooter({ text: 'Health check completed' })
                .setTimestamp();

            // Add missing permissions details if any
            if (!permissionCheck.hasAllPermissions) {
                const missingPerms = permissionCheck.missingPermissions.map(perm => `• ${perm}`).join('\n');
                embed.addFields({ 
                    name: '⚠️ Missing Permissions', 
                    value: missingPerms.slice(0, 1000), 
                    inline: false 
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in health command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while checking bot health.'
            });
        }
    },

    cooldown: 30000 // 30 seconds
};
