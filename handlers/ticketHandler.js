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
const translations = require('../utils/translations');

class TicketHandler {
    constructor() {
        this.creatingTickets = new Set();
    }    async handleTicketButton(interaction, params) {
        // For ticket buttons, the format is: ticket-ACTION_TICKETID
        // After split('-'), params[0] will be 'ACTION_TICKETID'
        const fullAction = params[0]; // e.g., 'claim_TICKET-0001' or 'close_TICKET-0001'
        
        let action = null;
        let ticketId = null;
          if (fullAction === 'create') {
            action = 'create';
        } else if (fullAction === 'cancel_close') {
            action = 'cancel_close';        } else if (fullAction && fullAction.includes('_')) {
            // Split on underscore to separate action from ticket ID
            const underscoreIndex = fullAction.indexOf('_');
            action = fullAction.substring(0, underscoreIndex);
            
            // Reconstruct the full ticket ID from the remaining parts
            // params[0] = 'claim_TICKET', params[1] = '0011', etc.
            const ticketIdPart = fullAction.substring(underscoreIndex + 1); // 'TICKET'
            const remainingParts = params.slice(1); // ['0011'] or ['0011', 'EXTRA'] etc.
            ticketId = ticketIdPart + (remainingParts.length > 0 ? '-' + remainingParts.join('-') : '');
        } else {
            // Fallback to old format for backwards compatibility
            action = params[0];
            ticketId = params[1];
            console.log('Using fallback format:', { action, ticketId });
        }
          switch (action) {
            case 'create':
                await this.showTicketModal(interaction);
                break;
            case 'claim':
                await this.claimTicket(interaction, ticketId);
                break;
            case 'close':
                await this.closeTicket(interaction, ticketId);
                break;
            case 'confirmclose':
                await this.confirmCloseTicket(interaction, ticketId);
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
    }    async showTicketModal(interaction) {
        // Check if user already has maximum tickets
        const existingTickets = await Ticket.find({
            userId: interaction.user.id,
            guildId: interaction.guild.id,
            status: { $in: ['open', 'claimed'] }
        });

        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        const maxTickets = guildConfig?.ticketConfig?.maxTicketsPerUser || 3;
        const lang = guildConfig?.language || 'en';

        if (existingTickets.length >= maxTickets) {
            return await interaction.reply({
                content: translations.get('ticket_max_reached', lang, { count: existingTickets.length }),
                flags: 64
            });
        }        const modal = new ModalBuilder()
            .setCustomId('ticket-create')
            .setTitle(translations.get('ticket_modal_title', lang));

        const subjectInput = new TextInputBuilder()
            .setCustomId('subject')
            .setLabel(translations.get('ticket_modal_subject', lang))
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(translations.get('ticket_modal_subject_placeholder', lang))
            .setRequired(true)
            .setMaxLength(100);

        const descriptionInput = new TextInputBuilder()
            .setCustomId('description')
            .setLabel(translations.get('ticket_modal_description', lang))            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder(translations.get('ticket_modal_description_placeholder', lang))
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
            const description = interaction.fields.getTextInputValue('description') || 'No description provided';            // Get guild configuration
            const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
            const categoryId = guildConfig?.ticketConfig?.categoryId;
            const lang = guildConfig?.language || 'en';

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
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter({ text: `Ticket ID: ${ticketId}` })
                .setTimestamp();// Create action buttons
            const actionRow = new ActionRowBuilder()
                .addComponents(                    new ButtonBuilder()
                        .setCustomId(`ticket-claim_${ticketId}`)
                        .setLabel(translations.get('ticket_button_claim', lang))
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`ticket-close_${ticketId}`)
                        .setLabel(translations.get('ticket_button_close', lang))
                        .setStyle(ButtonStyle.Danger)
                );

            // Send ticket message
            await channel.send({
                content: `<@${interaction.user.id}> Welcome to your support ticket!\n${guildConfig?.ticketConfig?.staffRoleId ? `<@&${guildConfig.ticketConfig.staffRoleId}>` : ''}`,
                embeds: [ticketEmbed],
                components: [actionRow]
            });

            // Log ticket creation
            await this.logTicketAction(interaction.guild, 'created', ticket, interaction.user);            await interaction.editReply({
                content: translations.get('ticket_created', lang, { channel: `<#${channel.id}>` })
            });

        } catch (error) {
            console.error('Error creating ticket:', error);
            await interaction.editReply({
                content: '❌ Failed to create ticket. Please try again later.'
            });
        } finally {
            this.creatingTickets.delete(userKey);
        }
    }    async claimTicket(interaction, ticketId) {
        try {
            // Check if user has permission to claim tickets
            if (!checkPermissions.isStaff(interaction.member)) {
                return await interaction.reply({
                    content: translations.get('error_permissions', 'en'),
                    flags: 64
                });
            }

            const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
            const lang = guildConfig?.language || 'en';

            const ticket = await Ticket.findOne({ 
                ticketId: { $regex: new RegExp(`^${ticketId}$`, 'i') }, 
                guildId: interaction.guild.id 
            });
            
            if (!ticket) {
                return await interaction.reply({
                    content: translations.get('ticket_not_found', lang),
                    flags: 64
                });
            }

            if (ticket.status === 'claimed') {
                return await interaction.reply({
                    content: translations.get('ticket_already_claimed', lang, { user: `<@${ticket.claimedBy}>` }),
                    flags: 64
                });
            }

            if (ticket.status === 'closed') {
                return await interaction.reply({
                    content: translations.get('ticket_already_closed', lang),
                    flags: 64
                });
            }

            // Update ticket
            ticket.status = 'claimed';
            ticket.claimedBy = interaction.user.id;
            ticket.claimedAt = new Date();
            await ticket.save();
            await ticket.addLog('claimed', interaction.user.id, interaction.user.username);            // Update embed with enhanced styling - preserve original ticket creator's avatar
            const originalEmbed = interaction.message.embeds[0];
            const embed = EmbedBuilder.from(originalEmbed)
                .addFields(
                    { name: '🔧 Claimed by', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '⏰ Claimed at', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                    { name: '📊 Status', value: '🟡 **CLAIMED**', inline: true }
                )
                .setColor('#ffaa00')
                .setFooter({ 
                    text: `Claimed by ${interaction.user.username} • Ticket ID: ${ticket.ticketId}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                });
            
            // Preserve the original ticket creator's avatar thumbnail
            if (originalEmbed.thumbnail) {
                embed.setThumbnail(originalEmbed.thumbnail.url);
            }            // Update buttons
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`ticket-claim_${ticketId}`)
                        .setLabel(translations.get('ticket_button_claimed', lang))
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId(`ticket-close_${ticketId}`)
                        .setLabel(translations.get('ticket_button_close', lang))
                        .setStyle(ButtonStyle.Danger)
                );

            await interaction.update({
                embeds: [embed],
                components: [actionRow]
            });            // Enhanced claim notification with embed
            const claimEmbed = new EmbedBuilder()
                .setTitle(translations.get('ticket_claim_title', lang))
                .setDescription(translations.get('ticket_claim_description', lang, { user: interaction.user.username }))
                .addFields(
                    { name: translations.get('ticket_field_staff', lang), value: `<@${interaction.user.id}>`, inline: true },
                    { name: translations.get('ticket_field_ticket_id', lang), value: ticket.ticketId, inline: true },
                    { name: translations.get('ticket_field_response_time', lang), value: `<t:${Math.floor((Date.now() - ticket.createdAt.getTime()) / 1000)}:R>`, inline: true }
                )
                .setColor('#00ff00')
                .setThumbnail(interaction.user.displayAvatarURL())
                .setTimestamp()
                .setFooter({ 
                    text: translations.get('ticket_claim_footer', lang), 
                    iconURL: interaction.guild.iconURL() 
                });

            await interaction.followUp({
                embeds: [claimEmbed],
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
    }    async closeTicket(interaction, ticketId) {
        try {
            const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
            const lang = guildConfig?.language || 'en';
            
            const ticket = await Ticket.findOne({ ticketId, guildId: interaction.guild.id });
            
            if (!ticket) {
                return await interaction.reply({
                    content: translations.get('ticket_not_found', lang),
                    flags: 64
                });
            }

            if (ticket.status === 'closed') {
                return await interaction.reply({
                    content: translations.get('ticket_already_closed', lang),
                    flags: 64
                });
            }

            // Check permissions - ticket creator or staff can close
            const canClose = ticket.userId === interaction.user.id || checkPermissions.isStaff(interaction.member);
            
            if (!canClose) {
                return await interaction.reply({
                    content: translations.get('error_permissions', lang),
                    flags: 64
                });
            }

            // Show confirmation dialog
            const confirmEmbed = new EmbedBuilder()
                .setTitle('🔒 Close Ticket')
                .setDescription(translations.get('ticket_close_confirm', lang, { ticketId }))
                .setColor('#ff0000');            const confirmRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`ticket-confirmclose_${ticketId}`)
                        .setLabel(translations.get('ticket_button_confirm_close', lang))
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('ticket-cancel_close')
                        .setLabel(translations.get('ticket_button_cancel', lang))
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
    }    async confirmCloseTicket(interaction, ticketId) {
        try {
            const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
            const lang = guildConfig?.language || 'en';
            
            const ticket = await Ticket.findOne({ ticketId, guildId: interaction.guild.id });
            
            if (!ticket) {
                return await interaction.update({
                    content: translations.get('ticket_not_found', lang),
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
                content: translations.get('ticket_closing', lang),
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
    }    async cancelCloseTicket(interaction) {
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        const lang = guildConfig?.language || 'en';
        
        await interaction.update({
            content: translations.get('ticket_close_cancelled', lang),
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
