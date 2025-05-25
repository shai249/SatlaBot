const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    PermissionFlagsBits
} = require('discord.js');
const { checkPermissions } = require('../../utils/permissions');

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
        }        if (!checkPermissions.isStaff(interaction.member)) {
            try {
                return await interaction.editReply({
                    content: '❌ You do not have permission to create ticket panels.'
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
                        content: '❌ I do not have permission to send messages in that channel.'
                    });
                } catch (error) {
                    console.error('Error sending permissions error message:', error);
                    return;
                }
            }

            // Create the ticket panel embed
            const ticketEmbed = new EmbedBuilder()
                .setTitle('🎫 Support Ticket System')
                .setDescription(`
**Need help or have a question?**

Click the button below to create a support ticket. Our staff team will assist you as soon as possible.

**Before creating a ticket:**
• Check if your question has been answered in our FAQ
• Make sure your issue hasn't been resolved already
• Provide clear and detailed information about your problem

**Ticket Categories:**
🔧 Technical Support
💬 General Questions  
🛠️ Bug Reports
💡 Feature Requests
`)
                .setColor('#00aaff')
                .setFooter({ 
                    text: '• One ticket per issue • Be patient and respectful', 
                    iconURL: interaction.guild.iconURL() 
                })
                .setThumbnail(interaction.guild.iconURL())
                .setTimestamp();

            // Create the button
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket-create')
                        .setLabel('Create Ticket')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🎫')
                );            // Send the panel
            const panelMessage = await channel.send({
                embeds: [ticketEmbed],
                components: [actionRow]
            });

            try {
                await interaction.editReply({
                    content: `✅ Ticket panel created successfully in ${channel}!`
                });
            } catch (error) {
                console.error('Error sending success message:', error);
            }

        } catch (error) {
            console.error('Error creating ticket panel:', error);
            try {
                await interaction.editReply({
                    content: '❌ Failed to create ticket panel. Please check my permissions and try again.'
                });
            } catch (editError) {
                console.error('Error sending error message:', editError);
            }
        }
    },

    cooldown: 10000 // 10 seconds
};
