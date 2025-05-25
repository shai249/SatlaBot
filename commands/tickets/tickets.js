const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Ticket = require('../../models/Ticket');
const GuildConfig = require('../../models/GuildConfig');
const { checkPermissions } = require('../../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tickets')
        .setDescription('Manage and view tickets')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all tickets')
                .addStringOption(option =>
                    option
                        .setName('status')
                        .setDescription('Filter by status')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Open', value: 'open' },
                            { name: 'Claimed', value: 'claimed' },
                            { name: 'Closed', value: 'closed' },
                            { name: 'All', value: 'all' }
                        )
                )
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('Filter by user')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View a specific ticket')
                .addStringOption(option =>
                    option
                        .setName('ticket_id')
                        .setDescription('Ticket ID to view')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('close')
                .setDescription('Force close a ticket')
                .addStringOption(option =>
                    option
                        .setName('ticket_id')
                        .setDescription('Ticket ID to close')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('Reason for closing')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('View ticket statistics')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // Check if user has permission for staff commands
        const isStaff = checkPermissions.isStaff(interaction.member);
        const isOwner = interaction.user.id === interaction.guild.ownerId;

        if (!isStaff && !isOwner && subcommand !== 'list') {
            return await interaction.reply({
                content: '❌ You do not have permission to manage tickets.',
                flags: 64
            });
        }

        try {
            switch (subcommand) {
                case 'list':
                    await this.listTickets(interaction, isStaff);
                    break;
                case 'view':
                    await this.viewTicket(interaction);
                    break;
                case 'close':
                    await this.forceCloseTicket(interaction);
                    break;
                case 'stats':
                    await this.showStats(interaction);
                    break;
            }
        } catch (error) {
            console.error(`Error in tickets ${subcommand}:`, error);
            await interaction.reply({
                content: '❌ An error occurred while processing your request.',
                flags: 64
            });
        }
    },

    async listTickets(interaction, isStaff) {
        const status = interaction.options.getString('status') || 'all';
        const user = interaction.options.getUser('user');

        let filter = { guildId: interaction.guild.id };

        // If not staff, only show own tickets
        if (!isStaff) {
            filter.userId = interaction.user.id;
        } else if (user) {
            filter.userId = user.id;
        }

        if (status !== 'all') {
            filter.status = status;
        }

        const tickets = await Ticket.find(filter)
            .sort({ createdAt: -1 })
            .limit(10);

        if (tickets.length === 0) {
            return await interaction.reply({
                content: '📭 No tickets found matching your criteria.',
                flags: 64
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('🎫 Ticket List')
            .setColor('#00aaff')
            .setFooter({ text: `Showing ${tickets.length} tickets` })
            .setTimestamp();

        let description = '';
        for (const ticket of tickets) {
            const statusEmoji = {
                'open': '🟢',
                'claimed': '🟡',
                'closed': '🔴'
            }[ticket.status] || '⚪';

            const member = interaction.guild.members.cache.get(ticket.userId);
            const username = member ? member.user.username : ticket.username;

            description += `${statusEmoji} **${ticket.ticketId}** - ${username}\n`;
            description += `📝 ${ticket.subject}\n`;
            description += `📅 <t:${Math.floor(ticket.createdAt.getTime() / 1000)}:R>\n\n`;
        }

        embed.setDescription(description.slice(0, 4000)); // Discord embed limit

        await interaction.reply({ embeds: [embed], flags: 64 });
    },

    async viewTicket(interaction) {
        const ticketId = interaction.options.getString('ticket_id');
        
        const ticket = await Ticket.findOne({
            ticketId: ticketId.toUpperCase(),
            guildId: interaction.guild.id
        });

        if (!ticket) {
            return await interaction.reply({
                content: '❌ Ticket not found.',
                flags: 64
            });
        }        const embed = new EmbedBuilder()
            .setTitle(`🎫 ${ticket.ticketId}`)
            .setDescription(ticket.description || 'No description provided')
            .addFields(
                { name: '👤 User', value: `<@${ticket.userId}>`, inline: true },
                { name: '📝 Subject', value: ticket.subject, inline: true },
                { name: '🔹 Status', value: ticket.status.toUpperCase(), inline: true },
                { name: '📅 Created', value: `<t:${Math.floor(ticket.createdAt.getTime() / 1000)}:F>`, inline: true }
            )
            .setColor(this.getStatusColor(ticket.status))
            .setFooter({ text: `Ticket ID: ${ticket.ticketId}` })
            .setTimestamp();

        if (ticket.claimedBy) {
            embed.addFields({ 
                name: '🔧 Claimed by', 
                value: `<@${ticket.claimedBy}>`, 
                inline: true 
            });
        }

        if (ticket.closedAt) {
            embed.addFields({ 
                name: '🔒 Closed', 
                value: `<t:${Math.floor(ticket.closedAt.getTime() / 1000)}:F>`, 
                inline: true 
            });
        }

        // Show recent logs
        if (ticket.logs.length > 0) {
            const recentLogs = ticket.logs.slice(-3);
            let logText = '';
            for (const log of recentLogs) {
                logText += `• ${log.action} by ${log.username} <t:${Math.floor(log.timestamp.getTime() / 1000)}:R>\n`;
            }
            embed.addFields({ name: '📋 Recent Activity', value: logText, inline: false });
        }

        await interaction.reply({ embeds: [embed], flags: 64 });
    },

    async forceCloseTicket(interaction) {
        const ticketId = interaction.options.getString('ticket_id');
        const reason = interaction.options.getString('reason') || 'Force closed by staff';

        const ticket = await Ticket.findOne({
            ticketId: ticketId.toUpperCase(),
            guildId: interaction.guild.id
        });

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

        // Update ticket
        ticket.status = 'closed';
        ticket.closedAt = new Date();
        await ticket.save();
        await ticket.addLog('force_closed', interaction.user.id, interaction.user.username, reason);

        // Try to delete the channel
        const channel = interaction.guild.channels.cache.get(ticket.channelId);
        if (channel) {
            try {
                await channel.delete(`Force closed by ${interaction.user.username}: ${reason}`);
            } catch (error) {
                console.error('Error deleting ticket channel:', error);
            }
        }

        await interaction.reply({
            content: `✅ Ticket **${ticket.ticketId}** has been force closed.\n**Reason:** ${reason}`,
            flags: 64
        });
    },

    async showStats(interaction) {
        const totalTickets = await Ticket.countDocuments({ guildId: interaction.guild.id });
        const openTickets = await Ticket.countDocuments({ 
            guildId: interaction.guild.id, 
            status: 'open' 
        });
        const claimedTickets = await Ticket.countDocuments({ 
            guildId: interaction.guild.id, 
            status: 'claimed' 
        });
        const closedTickets = await Ticket.countDocuments({ 
            guildId: interaction.guild.id, 
            status: 'closed' 
        });

        // Get tickets created today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTickets = await Ticket.countDocuments({
            guildId: interaction.guild.id,
            createdAt: { $gte: today }
        });

        // Get average response time (time to claim)
        const claimedTicketsWithTime = await Ticket.find({
            guildId: interaction.guild.id,
            status: { $in: ['claimed', 'closed'] },
            claimedAt: { $ne: null }
        });

        let avgResponseTime = 0;
        if (claimedTicketsWithTime.length > 0) {
            const totalResponseTime = claimedTicketsWithTime.reduce((total, ticket) => {
                return total + (ticket.claimedAt - ticket.createdAt);
            }, 0);
            avgResponseTime = totalResponseTime / claimedTicketsWithTime.length;
        }

        const embed = new EmbedBuilder()
            .setTitle('📊 Ticket Statistics')
            .addFields(
                { name: '🎫 Total Tickets', value: totalTickets.toString(), inline: true },
                { name: '🟢 Open', value: openTickets.toString(), inline: true },
                { name: '🟡 Claimed', value: claimedTickets.toString(), inline: true },
                { name: '🔴 Closed', value: closedTickets.toString(), inline: true },
                { name: '📅 Today', value: todayTickets.toString(), inline: true },
                { name: '⏱️ Avg Response Time', value: this.formatDuration(avgResponseTime), inline: true }
            )
            .setColor('#00aaff')
            .setFooter({ text: `Statistics for ${interaction.guild.name}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
    },

    getStatusColor(status) {
        switch (status) {
            case 'open': return '#00ff00';
            case 'claimed': return '#ffaa00';
            case 'closed': return '#ff0000';
            default: return '#00aaff';
        }
    },

    formatDuration(ms) {
        if (ms === 0) return 'N/A';
        
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    },

    cooldown: 5000 // 5 seconds
};
