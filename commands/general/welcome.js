const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');
const { checkPermissions } = require('../../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Configure welcome messages for new members')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Set up basic welcome configuration')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Channel to send welcome messages')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('message')
                .setDescription('Configure welcome message content')
                .addStringOption(option =>
                    option
                        .setName('title')
                        .setDescription('Embed title (use {user}, {server}, {memberCount})')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option
                        .setName('description')
                        .setDescription('Embed description (use {user}, {server}, {memberCount})')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option
                        .setName('footer')
                        .setDescription('Embed footer text')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('style')
                .setDescription('Configure welcome message appearance')
                .addStringOption(option =>
                    option
                        .setName('color')
                        .setDescription('Embed color (hex code like #7289da)')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option
                        .setName('style')
                        .setDescription('Embed style preset')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Modern (Blue theme)', value: 'modern' },
                            { name: 'Classic (Green theme)', value: 'classic' },
                            { name: 'Minimal (Gray theme)', value: 'minimal' }
                        )
                )
                .addStringOption(option =>
                    option
                        .setName('image')
                        .setDescription('Banner image URL for the embed')
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option
                        .setName('show_avatar')
                        .setDescription('Show user avatar as thumbnail')
                        .setRequired(false)
                )                .addBooleanOption(option =>
                    option
                        .setName('show_member_count')
                        .setDescription('Show member count in footer')
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option
                        .setName('show_server_icon')
                        .setDescription('Show server icon in footer')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Disable welcome messages')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('test')
                .setDescription('Test the welcome message')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check current welcome configuration')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    
    async execute(interaction) {
        // Defer reply immediately
        await interaction.deferReply({ ephemeral: true });

        if (!checkPermissions.canConfigureBot(interaction.member)) {
            return await interaction.editReply({
                content: '❌ You do not have permission to configure welcome settings.'
            });
        }

        const subcommand = interaction.options.getSubcommand();

        try {
            let guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
            if (!guildConfig) {
                guildConfig = new GuildConfig({ guildId: interaction.guild.id });
            }

            switch (subcommand) {
                case 'setup':
                    const channel = interaction.options.getChannel('channel');

                    // Check if bot can send messages in the channel
                    if (!channel.permissionsFor(interaction.guild.members.me).has(['SendMessages', 'EmbedLinks'])) {
                        return await interaction.editReply({
                            content: '❌ I do not have permission to send messages in that channel.'
                        });
                    }                    guildConfig.welcomeConfig.enabled = true;
                    guildConfig.welcomeConfig.channelId = channel.id;
                    
                    // Set default values if not already set
                    if (!guildConfig.welcomeConfig.embedTitle) {
                        guildConfig.welcomeConfig.embedTitle = 'Welcome to {server}! 🎉';
                    }
                    if (!guildConfig.welcomeConfig.embedDescription) {
                        guildConfig.welcomeConfig.embedDescription = 'Hey {user}! Welcome to **{server}**!\n\nYou are our **{memberCount}** member. We hope you enjoy your stay! 🌟';
                    }
                    if (!guildConfig.welcomeConfig.embedFooter) {
                        guildConfig.welcomeConfig.embedFooter = 'Member #{memberCount}';
                    }
                    
                    await guildConfig.save();

                    const setupEmbed = new EmbedBuilder()
                        .setTitle('✅ Welcome System Configured!')
                        .setDescription(`Welcome messages will be sent to ${channel}`)
                        .addFields([
                            { name: '🎨 Customize Style', value: 'Use `/welcome style` to change colors and appearance', inline: true },
                            { name: '📝 Customize Message', value: 'Use `/welcome message` to edit the content', inline: true },
                            { name: '🧪 Test Setup', value: 'Use `/welcome test` to preview your welcome message', inline: true }
                        ])
                        .setColor('#00ff00')
                        .setTimestamp();

                    await interaction.editReply({ embeds: [setupEmbed] });
                    break;

                case 'message':
                    if (!guildConfig.welcomeConfig.enabled) {
                        return await interaction.editReply({
                            content: '❌ Welcome messages are not enabled. Use `/welcome setup` first.'
                        });
                    }

                    const title = interaction.options.getString('title');
                    const description = interaction.options.getString('description');
                    const footer = interaction.options.getString('footer');

                    let changes = [];

                    if (title) {
                        guildConfig.welcomeConfig.embedTitle = title;
                        changes.push(`**Title:** ${title}`);
                    }

                    if (description) {
                        guildConfig.welcomeConfig.embedDescription = description;
                        changes.push(`**Description:** ${description}`);
                    }

                    if (footer) {
                        guildConfig.welcomeConfig.embedFooter = footer;
                        changes.push(`**Footer:** ${footer}`);
                    }

                    if (changes.length === 0) {
                        return await interaction.editReply({
                            content: '❌ Please provide at least one option to update.\n\n**Available placeholders:**\n`{user}` - User mention\n`{server}` - Server name\n`{memberCount}` - Current member count'
                        });
                    }

                    await guildConfig.save();

                    await interaction.editReply({
                        content: `✅ Welcome message updated!\n\n${changes.join('\n')}\n\n**Tip:** Use '/welcome test' to preview your changes.`
                    });
                    break;

                case 'style':
                    if (!guildConfig.welcomeConfig.enabled) {
                        return await interaction.editReply({
                            content: '❌ Welcome messages are not enabled. Use `/welcome setup` first.'
                        });
                    }                    const color = interaction.options.getString('color');
                    const style = interaction.options.getString('style');
                    const image = interaction.options.getString('image');
                    const showAvatar = interaction.options.getBoolean('show_avatar');
                    const showMemberCount = interaction.options.getBoolean('show_member_count');
                    const showServerIcon = interaction.options.getBoolean('show_server_icon');

                    let styleChanges = [];

                    if (color) {
                        // Validate hex color
                        if (!/^#[0-9A-F]{6}$/i.test(color)) {
                            return await interaction.editReply({
                                content: '❌ Invalid color format. Please use hex format like #7289da'
                            });
                        }
                        guildConfig.welcomeConfig.embedColor = color;
                        styleChanges.push(`**Color:** ${color}`);
                    }

                    if (style) {
                        guildConfig.welcomeConfig.embedStyle = style;
                        // Apply style presets
                        switch (style) {
                            case 'modern':
                                guildConfig.welcomeConfig.embedColor = '#7289da';
                                break;
                            case 'classic':
                                guildConfig.welcomeConfig.embedColor = '#43b581';
                                break;
                            case 'minimal':
                                guildConfig.welcomeConfig.embedColor = '#747f8d';
                                break;
                        }
                        styleChanges.push(`**Style:** ${style.charAt(0).toUpperCase() + style.slice(1)}`);
                    }

                    if (image) {
                        // Basic URL validation
                        try {
                            new URL(image);
                            guildConfig.welcomeConfig.embedImage = image;
                            styleChanges.push(`**Banner Image:** Set`);
                        } catch {
                            return await interaction.editReply({
                                content: '❌ Invalid image URL provided.'
                            });
                        }
                    }

                    if (showAvatar !== null) {
                        guildConfig.welcomeConfig.showAvatar = showAvatar;
                        styleChanges.push(`**Show Avatar:** ${showAvatar ? 'Enabled' : 'Disabled'}`);
                    }                    if (showMemberCount !== null) {
                        guildConfig.welcomeConfig.showMemberCount = showMemberCount;
                        styleChanges.push(`**Show Member Count:** ${showMemberCount ? 'Enabled' : 'Disabled'}`);
                    }

                    if (showServerIcon !== null) {
                        guildConfig.welcomeConfig.showServerIcon = showServerIcon;
                        styleChanges.push(`**Show Server Icon:** ${showServerIcon ? 'Enabled' : 'Disabled'}`);
                    }

                    if (styleChanges.length === 0) {
                        return await interaction.editReply({
                            content: '❌ Please provide at least one style option to update.'
                        });
                    }

                    await guildConfig.save();

                    await interaction.editReply({
                        content: `🎨 Welcome message style updated!\n\n${styleChanges.join('\n')}\n\n**Tip:** Use '/welcome test' to preview your changes.`
                    });
                    break;

                case 'disable':
                    guildConfig.welcomeConfig.enabled = false;
                    await guildConfig.save();

                    await interaction.editReply({
                        content: '✅ Welcome messages have been disabled.'
                    });
                    break;

                case 'test':
                    if (!guildConfig.welcomeConfig.enabled) {
                        return await interaction.editReply({
                            content: '❌ Welcome messages are not configured. Use `/welcome setup` first.'
                        });
                    }

                    const testChannel = interaction.guild.channels.cache.get(guildConfig.welcomeConfig.channelId);
                    if (!testChannel) {
                        return await interaction.editReply({
                            content: '❌ Welcome channel no longer exists. Please reconfigure.'
                        });
                    }

                    // Create enhanced welcome embed with all features
                    const welcomeEmbed = await this.createWelcomeEmbed(interaction.member, guildConfig, interaction.guild, true);

                    try {
                        await testChannel.send({ embeds: [welcomeEmbed] });
                        await interaction.editReply({
                            content: `✅ Test welcome message sent to ${testChannel}!`
                        });
                    } catch (error) {
                        console.error('Error sending test welcome:', error);
                        await interaction.editReply({
                            content: '❌ Failed to send test message. Check bot permissions in the welcome channel.'
                        });
                    }
                    break;

                case 'status':
                    if (guildConfig.welcomeConfig.enabled) {
                        const welcomeChannel = interaction.guild.channels.cache.get(guildConfig.welcomeConfig.channelId);
                        
                        const statusEmbed = new EmbedBuilder()
                            .setTitle('📊 Welcome System Status')
                            .setColor(guildConfig.welcomeConfig.embedColor)
                            .addFields([
                                { 
                                    name: '📍 Channel', 
                                    value: welcomeChannel ? `${welcomeChannel}` : '❌ Channel not found', 
                                    inline: true 
                                },
                                { 
                                    name: '🎨 Style', 
                                    value: `${guildConfig.welcomeConfig.embedStyle.charAt(0).toUpperCase() + guildConfig.welcomeConfig.embedStyle.slice(1)}`, 
                                    inline: true 
                                },
                                { 
                                    name: '🖼️ Features',                                    value: [
                                        `Avatar: ${guildConfig.welcomeConfig.showAvatar ? '✅' : '❌'}`,
                                        `Member Count: ${guildConfig.welcomeConfig.showMemberCount ? '✅' : '❌'}`,
                                        `Server Icon: ${guildConfig.welcomeConfig.showServerIcon ? '✅' : '❌'}`,
                                        `Banner: ${guildConfig.welcomeConfig.embedImage ? '✅' : '❌'}`
                                    ].join('\n'),
                                    inline: true 
                                },
                                { 
                                    name: '📝 Current Title', 
                                    value: guildConfig.welcomeConfig.embedTitle || 'Not set', 
                                    inline: false 
                                },
                                { 
                                    name: '💬 Current Description', 
                                    value: guildConfig.welcomeConfig.embedDescription || 'Not set', 
                                    inline: false 
                                }
                            ])
                            .setTimestamp();

                        await interaction.editReply({ embeds: [statusEmbed] });
                    } else {
                        await interaction.editReply({
                            content: '❌ Welcome messages are **disabled**.\n\nUse `/welcome setup` to get started!'
                        });
                    }
                    break;            }
        } catch (error) {
            console.error('Error in welcome command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while configuring welcome messages.'
            });
        }
    },

    // Helper method to create welcome embeds
    async createWelcomeEmbed(member, guildConfig, guild, isTest = false) {
        const config = guildConfig.welcomeConfig;
        
        // Replace placeholders
        const title = config.embedTitle
            .replace('{user}', member.user.username)
            .replace('{server}', guild.name)
            .replace('{memberCount}', guild.memberCount.toString());
        
        const description = config.embedDescription
            .replace('{user}', `<@${member.user.id}>`)
            .replace('{server}', guild.name)
            .replace('{memberCount}', guild.memberCount.toString());
        
        let footer = config.embedFooter;
        if (config.showMemberCount) {
            footer = footer.replace('{memberCount}', guild.memberCount.toString());
        }
        
        // Create embed
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(config.embedColor)
            .setTimestamp();
        
        // Add user avatar as thumbnail if enabled
        if (config.showAvatar) {
            embed.setThumbnail(member.user.displayAvatarURL({ size: 256 }));
        }
        
        // Add banner image if set
        if (config.embedImage) {
            embed.setImage(config.embedImage);
        }
        
        // Add footer
        const footerOptions = { text: isTest ? `${footer} (Test Message)` : footer };
        if (config.showServerIcon && guild.iconURL()) {
            footerOptions.iconURL = guild.iconURL();
        }
        embed.setFooter(footerOptions);
        
        return embed;
    },

    cooldown: 5000 // 5 seconds
};
