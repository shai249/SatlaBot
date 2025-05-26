const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    PermissionFlagsBits
} = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');
const { checkPermissions } = require('../../utils/permissions');
const translations = require('../../utils/translations');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketpanel')
        .setDescription('Create a ticket panel for users to create support tickets')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Channel to send the ticket panel (optional)')
                .setRequired(false)
        )        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
      async execute(interaction) {
        // Defer reply immediately with robust error handling
        if (!interaction.deferred && !interaction.replied) {
            try {
                await interaction.deferReply({ ephemeral: true });
            } catch (error) {
                console.error('Error deferring interaction:', error);
                return;
            }
        }

        // Get guild configuration for language
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        const lang = guildConfig?.language || 'en';

        if (!checkPermissions.isStaff(interaction.member)) {
            try {
                return await interaction.editReply({
                    content: translations.get('ticketpanel_permission_denied', lang)
                });
            } catch (error) {
                console.error('Error sending permission denied message:', error);
                return;
            }
        }

        try {
            const channel = interaction.options.getChannel('channel') || interaction.channel;            // Check if bot has permissions in the target channel
            if (!channel.permissionsFor(interaction.guild.members.me).has(['SendMessages', 'EmbedLinks'])) {
                try {
                    return await interaction.editReply({
                        content: translations.get('config_channel_permissions', lang)
                    });
                } catch (error) {
                    console.error('Error sending permissions error message:', error);
                    return;
                }
            }

            // Create the ticket panel embed
            const ticketEmbed = new EmbedBuilder()
                .setTitle(translations.get('ticketpanel_title', lang))
                .setDescription(translations.get('ticketpanel_description', lang))
                .setColor('#00aaff')
                .setFooter({ 
                    text: translations.get('ticketpanel_footer', lang), 
                    iconURL: interaction.guild.iconURL() 
                })
                .setThumbnail(interaction.guild.iconURL())
                .setTimestamp();

            // Create the button
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket-create')
                        .setLabel(translations.get('ticketpanel_button', lang))
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🎫')
                );// Send the panel
            const panelMessage = await channel.send({
                embeds: [ticketEmbed],
                components: [actionRow]
            });            try {
                await interaction.editReply({
                    content: translations.get('ticketpanel_created', lang, { channel: channel.toString() })
                });
            } catch (error) {
                console.error('Error sending success message:', error);
            }

        } catch (error) {
            console.error('Error creating ticket panel:', error);
            try {
                await interaction.editReply({
                    content: translations.get('ticketpanel_error', lang)
                });
            } catch (editError) {
                console.error('Error sending error message:', editError);
            }
        }
    },

    cooldown: 10000 // 10 seconds
};
