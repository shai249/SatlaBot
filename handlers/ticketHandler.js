const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle,
    ChannelType,
    PermissionFlagsBits
} = require('discord.js');
const Ticket = require('../models/Ticket');
const GuildConfig = require('../models/GuildConfig');
const { checkPermissions } = require('../utils/permissions');

class TicketHandler {
    constructor() {
        this.creatingTickets = new Set();
    }

    async handleTicketButton(interaction, params) {
        const [action, ...args] = params;
        
        switch (action) {
            case 'create':
                await this.showTicketModal(interaction);
                break;
            case 'claim':
                await this.claimTicket(interaction, args[0]);
                break;
            case 'close':
                await this.closeTicket(interaction, args[0]);
                break;
            case 'confirm_close':
                await this.confirmCloseTicket(interaction, args[0]);
                break;
            case 'cancel_close':
                await this.cancelCloseTicket(interaction);
                break;
            default:
                await interaction.reply({
                    content: '❌ Unknown ticket action.',
                    flags: 64
                });
        }
    }

    async showTicketModal(interaction) {
        // Check if user already has maximum tickets
        const existingTickets = await Ticket.find({
            userId: interaction.user.id,
            guildId: interaction.guild.id,
            status: { $in: ['open', 'claimed'] }
        });

        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        const maxTickets = guildConfig?.ticketConfig?.maxTicketsPerUser || 3;

        if (existingTickets.length >= maxTickets) {
            return await interaction.reply({
                content: `❌ You already have ${existingTickets.length} open tickets. Please close some before creating new ones.`,
                flags: 64
            });
        }

        const modal = new ModalBuilder()
            .setCustomId('ticket-create')
            .setTitle('Create Support Ticket');

        const subjectInput = new TextInputBuilder()
            .setCustomId('subject')
            .setLabel('Subject')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Brief description of your issue')
            .setRequired(true)
            .setMaxLength(100);

        const descriptionInput = new TextInputBuilder()
            .setCustomId('description')
            .setLabel('Description')            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Detailed description of your issue or question')
            .setRequired(false)
            .setMaxLength(1000);

        const firstActionRow = new ActionRowBuilder().addComponents(subjectInput);
        const secondActionRow = new ActionRowBuilder().addComponents(descriptionInput);

        modal.addComponents(firstActionRow, secondActionRow);

        await interaction.showModal(modal);
    }

    async handleTicketModal(interaction, params) {
        const action = params[0];
        
        if (action === 'create') {
            await this.createTicket(interaction);
        }
    }

    async createTicket(interaction) {
        // Prevent duplicate ticket creation
        const userKey = `${interaction.user.id}-${interaction.guild.id}`;
        if (this.creatingTickets.has(userKey)) {
            return await interaction.reply({
                content: '⏳ You already have a ticket being created. Please wait...',
                flags: 64
            });
        }

        this.creatingTickets.add(userKey);

        try {
            await interaction.deferReply({ flags: 64 });            const subject = interaction.fields.getTextInputValue('subject');
            const description = interaction.fields.getTextInputValue('description') || 'No description provided';

            // Get guild configuration
            const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
            const categoryId = guildConfig?.ticketConfig?.categoryId;

            // Generate unique ticket ID
            const ticketId = await Ticket.generateTicketId();

            // Create ticket channel
            const channel = await interaction.guild.channels.create({
                name: `${ticketId.toLowerCase()}-${interaction.user.username}`,
                type: ChannelType.GuildText,
                parent: categoryId,
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.everyone.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: interaction.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    }
                ]
            });

            // Add staff role permissions if configured
            if (guildConfig?.ticketConfig?.staffRoleId) {
                await channel.permissionOverwrites.create(guildConfig.ticketConfig.staffRoleId, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true,
                    ManageMessages: true
                });
            }            // Create ticket in database
            const ticket = new Ticket({
                ticketId,
                userId: interaction.user.id,
                username: interaction.user.username,
                channelId: channel.id,
                guildId: interaction.guild.id,
                subject,
                description,
                status: 'open'
            });

            await ticket.save();
            await ticket.addLog('created', interaction.user.id, interaction.user.username, `Subject: ${subject}`);            // Create ticket embed
            const ticketEmbed = new EmbedBuilder()
                .setTitle(`🎫 Ticket ${ticketId}`)
                .setDescription(description)
                .addFields(
                    { name: '👤 Created by', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '📝 Subject', value: subject, inline: true },
                    { name: '🕐 Created', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
                )
                .setColor('#00aaff')
                .setFooter({ text: `Ticket ID: ${ticketId}` })
                .setTimestamp();

            // Create action buttons
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`ticket-claim-${ticketId}`)
                        .setLabel('🔧 Claim Ticket')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`ticket-close-${ticketId}`)
                        .setLabel('🔒 Close Ticket')
                        .setStyle(ButtonStyle.Danger)
                );

            // Send ticket message
            await channel.send({
                content: `<@${interaction.user.id}> Welcome to your support ticket!\n${guildConfig?.ticketConfig?.staffRoleId ? `<@&${guildConfig.ticketConfig.staffRoleId}>` : ''}`,
                embeds: [ticketEmbed],
                components: [actionRow]
            });

            // Log ticket creation
            await this.logTicketAction(interaction.guild, 'created', ticket, interaction.user);

            await interaction.editReply({
                content: `✅ Ticket created successfully! Please check <#${channel.id}> for your support ticket.`
            });

        } catch (error) {
            console.error('Error creating ticket:', error);
            await interaction.editReply({
                content: '❌ Failed to create ticket. Please try again later.'
            });
        } finally {
            this.creatingTickets.delete(userKey);
        }
    }

    async claimTicket(interaction, ticketId) {
        try {
            // Check if user has permission to claim tickets
            if (!checkPermissions.isStaff(interaction.member)) {
                return await interaction.reply({
                    content: '❌ You do not have permission to claim tickets.',
                    flags: 64
                });
            }

            const ticket = await Ticket.findOne({ ticketId, guildId: interaction.guild.id });
            
            if (!ticket) {
                return await interaction.reply({
                    content: '❌ Ticket not found.',
                    flags: 64
                });
            }

            if (ticket.status === 'claimed') {
                return await interaction.reply({
                    content: `❌ This ticket is already claimed by <@${ticket.claimedBy}>.`,
                    flags: 64
                });
            }

            if (ticket.status === 'closed') {
                return await interaction.reply({
                    content: '❌ This ticket is already closed.',
                    flags: 64
                });
            }

            // Update ticket
            ticket.status = 'claimed';
            ticket.claimedBy = interaction.user.id;
            ticket.claimedAt = new Date();
            await ticket.save();
            await ticket.addLog('claimed', interaction.user.id, interaction.user.username);

            // Update embed
            const embed = EmbedBuilder.from(interaction.message.embeds[0])
                .addFields({ name: '🔧 Claimed by', value: `<@${interaction.user.id}>`, inline: true })
                .setColor('#ffaa00');

            // Update buttons
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`ticket-claim-${ticketId}`)
                        .setLabel('✅ Claimed')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId(`ticket-close-${ticketId}`)
                        .setLabel('🔒 Close Ticket')
                        .setStyle(ButtonStyle.Danger)
                );

            await interaction.update({
                embeds: [embed],
                components: [actionRow]
            });

            // Send claim notification
            await interaction.followUp({
                content: `🔧 **${interaction.user.username}** has claimed this ticket and will assist you shortly.`,
                ephemeral: false
            });

            // Log action
            await this.logTicketAction(interaction.guild, 'claimed', ticket, interaction.user);

        } catch (error) {
            console.error('Error claiming ticket:', error);
            await interaction.reply({
                content: '❌ Failed to claim ticket.',
                flags: 64
            });
        }
    }

    async closeTicket(interaction, ticketId) {
        try {
            const ticket = await Ticket.findOne({ ticketId, guildId: interaction.guild.id });
            
            if (!ticket) {
                return await interaction.reply({
                    content: '❌ Ticket not found.',
                    flags: 64
                });
            }

            if (ticket.status === 'closed') {
                return await interaction.reply({
                    content: '❌ This ticket is already closed.',
                    flags: 64
                });
            }

            // Check permissions - ticket creator or staff can close
            const canClose = ticket.userId === interaction.user.id || checkPermissions.isStaff(interaction.member);
            
            if (!canClose) {
                return await interaction.reply({
                    content: '❌ You do not have permission to close this ticket.',
                    flags: 64
                });
            }

            // Show confirmation dialog
            const confirmEmbed = new EmbedBuilder()
                .setTitle('🔒 Close Ticket')
                .setDescription(`Are you sure you want to close ticket **${ticketId}**?\n\nThis action cannot be undone and the channel will be deleted.`)
                .setColor('#ff0000');

            const confirmRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`ticket-confirm_close-${ticketId}`)
                        .setLabel('✅ Yes, Close Ticket')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('ticket-cancel_close')
                        .setLabel('❌ Cancel')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.reply({
                embeds: [confirmEmbed],
                components: [confirmRow],
                flags: 64
            });

        } catch (error) {
            console.error('Error initiating ticket close:', error);
            await interaction.reply({
                content: '❌ Failed to close ticket.',
                flags: 64
            });
        }
    }

    async confirmCloseTicket(interaction, ticketId) {
        try {
            const ticket = await Ticket.findOne({ ticketId, guildId: interaction.guild.id });
            
            if (!ticket) {
                return await interaction.update({
                    content: '❌ Ticket not found.',
                    embeds: [],
                    components: []
                });
            }

            // Update ticket status
            ticket.status = 'closed';
            ticket.closedAt = new Date();
            await ticket.save();
            await ticket.addLog('closed', interaction.user.id, interaction.user.username);

            // Log action
            await this.logTicketAction(interaction.guild, 'closed', ticket, interaction.user);

            await interaction.update({
                content: '✅ Ticket will be closed in 5 seconds...',
                embeds: [],
                components: []
            });

            // Delete channel after delay
            setTimeout(async () => {
                try {
                    const channel = interaction.guild.channels.cache.get(ticket.channelId);
                    if (channel) {
                        await channel.delete('Ticket closed');
                    }
                } catch (error) {
                    console.error('Error deleting ticket channel:', error);
                }
            }, 5000);

        } catch (error) {
            console.error('Error confirming ticket close:', error);
            await interaction.update({
                content: '❌ Failed to close ticket.',
                embeds: [],
                components: []
            });
        }
    }

    async cancelCloseTicket(interaction) {
        await interaction.update({
            content: '❌ Ticket close cancelled.',
            embeds: [],
            components: []
        });
    }

    async logTicketAction(guild, action, ticket, user) {
        try {
            const guildConfig = await GuildConfig.findOne({ guildId: guild.id });
            const logChannelId = guildConfig?.ticketConfig?.logChannelId;
            
            if (!logChannelId) return;

            const logChannel = guild.channels.cache.get(logChannelId);
            if (!logChannel) return;            const logEmbed = new EmbedBuilder()
                .setTitle(`📋 Ticket ${action.charAt(0).toUpperCase() + action.slice(1)}`)
                .addFields(
                    { name: '🎫 Ticket ID', value: ticket.ticketId, inline: true },
                    { name: '👤 User', value: `<@${user.id}>`, inline: true },
                    { name: '📝 Subject', value: ticket.subject, inline: true },
                    { name: '📅 Action Time', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setColor(this.getActionColor(action))
                .setFooter({ text: `Action by ${user.username}`, iconURL: user.displayAvatarURL() })
                .setTimestamp();

            await logChannel.send({ embeds: [logEmbed] });
        } catch (error) {
            console.error('Error logging ticket action:', error);
        }
    }    getActionColor(action) {
        switch (action) {
            case 'created': return '#00ff00';
            case 'claimed': return '#ffaa00';
            case 'closed': return '#ff0000';
            default: return '#00aaff';
        }
    }
}

module.exports = new TicketHandler();
