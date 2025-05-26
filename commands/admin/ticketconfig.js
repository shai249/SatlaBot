const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');
const { checkPermissions } = require('../../utils/permissions');
const translations = require('../../utils/translations');
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
        }        // Now proceed with permission checks and other logic
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id }) || new GuildConfig({ guildId: interaction.guild.id });
        const lang = guildConfig.language || 'en';
        
        if (!checkPermissions.canConfigureBot(interaction.member)) {
            return await interaction.editReply({
                content: translations.get('ticketconfig_permission_denied', lang)
            });
        }

        const subcommand = interaction.options.getSubcommand();        try {
            let guildConfigForSave = await GuildConfig.findOne({ guildId: interaction.guild.id });
            if (!guildConfigForSave) {
                guildConfigForSave = new GuildConfig({ guildId: interaction.guild.id });
            }

            switch (subcommand) {                case 'category':
                    const category = interaction.options.getChannel('category');
                    
                    if (category.type !== 4) { // CategoryChannel type
                        return await interaction.editReply({
                            content: translations.get('ticketconfig_category_invalid', lang)
                        });
                    }

                    guildConfigForSave.ticketConfig.categoryId = category.id;
                    await guildConfigForSave.save();

                    await interaction.editReply({
                        content: translations.get('ticketconfig_category_set', lang, { category: category.name })
                    });
                    break;

                case 'staffrole':
                    const role = interaction.options.getRole('role');
                    
                    guildConfigForSave.ticketConfig.staffRoleId = role.id;
                    await guildConfigForSave.save();

                    await interaction.editReply({
                        content: translations.get('ticketconfig_staffrole_set', lang, { role: role.name })
                    });
                    break;                case 'logs':
                    const logChannel = interaction.options.getChannel('channel');
                      if (!logChannel.isTextBased()) {
                        return await interaction.editReply({
                            content: translations.get('ticketconfig_logs_invalid', lang)
                        });
                    }

                    // Check bot permissions
                    if (!logChannel.permissionsFor(interaction.guild.members.me).has(['SendMessages', 'EmbedLinks'])) {
                        return await interaction.editReply({
                            content: translations.get('config_channel_permissions', lang)
                        });
                    }

                    guildConfigForSave.ticketConfig.logChannelId = logChannel.id;
                    await guildConfigForSave.save();

                    await interaction.editReply({
                        content: translations.get('ticketconfig_logs_set', lang, { channel: logChannel.toString() })
                    });
                    break;

                case 'maxtickets':
                    const maxTickets = interaction.options.getInteger('amount');
                    
                    guildConfigForSave.ticketConfig.maxTicketsPerUser = maxTickets;
                    await guildConfigForSave.save();                    await interaction.editReply({
                        content: translations.get('ticketconfig_maxtickets_set', lang, { amount: maxTickets })
                    });
                    break;                case 'status':
                    const config = guildConfigForSave.ticketConfig;
                    
                    let statusMessage = translations.get('ticketconfig_status_title', lang) + '\n\n';
                    
                    // Category
                    if (config.categoryId) {
                        const cat = interaction.guild.channels.cache.get(config.categoryId);
                        statusMessage += translations.get('ticketconfig_status_category', lang, { 
                            category: cat ? cat.name : translations.get('ticketconfig_not_found', lang) 
                        }) + '\n';
                    } else {
                        statusMessage += translations.get('ticketconfig_status_category', lang, { 
                            category: translations.get('ticketconfig_not_configured', lang) 
                        }) + '\n';
                    }
                    
                    // Staff Role
                    if (config.staffRoleId) {
                        const staffRole = interaction.guild.roles.cache.get(config.staffRoleId);
                        statusMessage += translations.get('ticketconfig_status_staffrole', lang, { 
                            role: staffRole ? staffRole.name : translations.get('ticketconfig_not_found', lang) 
                        }) + '\n';
                    } else {
                        statusMessage += translations.get('ticketconfig_status_staffrole', lang, { 
                            role: translations.get('ticketconfig_not_configured', lang) 
                        }) + '\n';
                    }
                    
                    // Log Channel
                    if (config.logChannelId) {
                        const logCh = interaction.guild.channels.cache.get(config.logChannelId);
                        statusMessage += translations.get('ticketconfig_status_logs', lang, { 
                            channel: logCh ? `<#${logCh.id}>` : translations.get('ticketconfig_not_found', lang) 
                        }) + '\n';
                    } else {
                        statusMessage += translations.get('ticketconfig_status_logs', lang, { 
                            channel: translations.get('ticketconfig_not_configured', lang) 
                        }) + '\n';
                    }
                    
                    statusMessage += translations.get('ticketconfig_status_maxtickets', lang, { 
                        amount: config.maxTicketsPerUser 
                    }) + '\n';
                    statusMessage += translations.get('ticketconfig_status_enabled', lang, { 
                        status: config.enabled ? translations.get('ticketconfig_enabled', lang) : translations.get('ticketconfig_disabled', lang) 
                    });                    await interaction.editReply({
                        content: statusMessage
                    });
                    break;
            }        } catch (error) {
            console.error('Error in ticketconfig command:', error);
              // Try to respond with error message
            try {
                if (interaction.deferred) {
                    await interaction.editReply({
                        content: translations.get('ticketconfig_error', 'en')
                    });
                } else if (!interaction.replied) {
                    await interaction.reply({
                        content: translations.get('ticketconfig_error', 'en'),
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
