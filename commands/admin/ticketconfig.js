const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');
const { checkPermissions } = require('../../utils/permissions');
const interactionHandler = require('../../handlers/interactionHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketconfig')
        .setDescription('Configure the ticket system settings')
        .addSubcommand(subcommand =>
            subcommand
                .setName('category')
                .setDescription('Set the category for ticket channels')
                .addChannelOption(option =>
                    option
                        .setName('category')
                        .setDescription('Category channel for tickets')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildCategory)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('staffrole')
                .setDescription('Set the staff role for ticket management')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Staff role')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('logs')
                .setDescription('Set the log channel for ticket actions')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Log channel')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('maxtickets')
                .setDescription('Set maximum tickets per user')
                .addIntegerOption(option =>
                    option
                        .setName('amount')
                        .setDescription('Maximum number of tickets per user')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(10)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('View current ticket system configuration')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),    async execute(interaction) {
        // CRITICAL: Defer immediately to prevent timeout - must be first operation
        try {
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferReply({ flags: 64 });
            }
        } catch (error) {
            console.error('Failed to defer interaction:', error);
            // If we can't defer, try to respond immediately
            try {
                if (!interaction.replied) {
                    return await interaction.reply({
                        content: '❌ An error occurred while processing your request.',
                        flags: 64
                    });
                }
            } catch (replyError) {
                console.error('Failed to send error response:', replyError);
                return;
            }
        }

        // Now proceed with permission checks and other logic
        if (!checkPermissions.canConfigureBot(interaction.member)) {
            return await interaction.editReply({
                content: '❌ You do not have permission to configure ticket settings.'
            });
        }

        const subcommand = interaction.options.getSubcommand();

        try {
            let guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
            if (!guildConfig) {
                guildConfig = new GuildConfig({ guildId: interaction.guild.id });
            }

            switch (subcommand) {
                case 'category':
                    const category = interaction.options.getChannel('category');
                    
                    if (category.type !== 4) { // CategoryChannel type
                        return await interaction.editReply({
                            content: '❌ Please select a category channel.'
                        });
                    }

                    guildConfig.ticketConfig.categoryId = category.id;
                    await guildConfig.save();

                    await interaction.editReply({
                        content: `✅ Ticket category has been set to **${category.name}**.`
                    });
                    break;

                case 'staffrole':
                    const role = interaction.options.getRole('role');
                    
                    guildConfig.ticketConfig.staffRoleId = role.id;
                    await guildConfig.save();

                    await interaction.editReply({
                        content: `✅ Staff role has been set to **${role.name}**.`
                    });
                    break;

                case 'logs':
                    const logChannel = interaction.options.getChannel('channel');
                      if (!logChannel.isTextBased()) {
                        return await interaction.editReply({
                            content: '❌ Please select a text channel.'
                        });
                    }

                    // Check bot permissions
                    if (!logChannel.permissionsFor(interaction.guild.members.me).has(['SendMessages', 'EmbedLinks'])) {
                        return await interaction.editReply({
                            content: '❌ I do not have permission to send messages in that channel.'
                        });
                    }

                    guildConfig.ticketConfig.logChannelId = logChannel.id;
                    await guildConfig.save();

                    await interaction.editReply({
                        content: `✅ Ticket log channel has been set to ${logChannel}.`
                    });
                    break;

                case 'maxtickets':
                    const maxTickets = interaction.options.getInteger('amount');
                    
                    guildConfig.ticketConfig.maxTicketsPerUser = maxTickets;
                    await guildConfig.save();                    await interaction.editReply({
                        content: `✅ Maximum tickets per user has been set to **${maxTickets}**.`
                    });
                    break;

                case 'status':
                    const config = guildConfig.ticketConfig;
                    
                    let statusMessage = '**🎫 Ticket System Configuration**\n\n';
                    
                    // Category
                    if (config.categoryId) {
                        const cat = interaction.guild.channels.cache.get(config.categoryId);
                        statusMessage += `📁 **Category:** ${cat ? cat.name : 'Not found'}\n`;
                    } else {
                        statusMessage += `📁 **Category:** Not configured\n`;
                    }
                    
                    // Staff Role
                    if (config.staffRoleId) {
                        const staffRole = interaction.guild.roles.cache.get(config.staffRoleId);
                        statusMessage += `👥 **Staff Role:** ${staffRole ? staffRole.name : 'Not found'}\n`;
                    } else {
                        statusMessage += `👥 **Staff Role:** Not configured\n`;
                    }
                    
                    // Log Channel
                    if (config.logChannelId) {
                        const logCh = interaction.guild.channels.cache.get(config.logChannelId);
                        statusMessage += `📋 **Log Channel:** ${logCh ? `<#${logCh.id}>` : 'Not found'}\n`;
                    } else {
                        statusMessage += `📋 **Log Channel:** Not configured\n`;
                    }
                    
                    statusMessage += `🔢 **Max Tickets per User:** ${config.maxTicketsPerUser}\n`;
                    statusMessage += `⚙️ **System Status:** ${config.enabled ? 'Enabled' : 'Disabled'}`;                    await interaction.editReply({
                        content: statusMessage
                    });
                    break;
            }        } catch (error) {
            console.error('Error in ticketconfig command:', error);
            
            // Try to respond with error message
            try {
                if (interaction.deferred) {
                    await interaction.editReply({
                        content: '❌ An error occurred while configuring ticket settings.'
                    });
                } else if (!interaction.replied) {
                    await interaction.reply({
                        content: '❌ An error occurred while configuring ticket settings.',
                        flags: 64
                    });
                }
            } catch (responseError) {
                console.error('Failed to send error response:', responseError);
            }
        }
    },

    cooldown: 5000 // 5 seconds
};
