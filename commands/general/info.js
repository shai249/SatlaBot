const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Ticket = require('../../models/Ticket');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Display bot information and statistics'),

    async execute(interaction) {
        try {
            const client = interaction.client;
            
            // Get ticket statistics
            const totalTickets = await Ticket.countDocuments({ guildId: interaction.guild.id });
            const openTickets = await Ticket.countDocuments({ 
                guildId: interaction.guild.id, 
                status: { $in: ['open', 'claimed'] } 
            });
            const closedTickets = await Ticket.countDocuments({ 
                guildId: interaction.guild.id, 
                status: 'closed' 
            });

            // Calculate uptime
            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor(uptime / 3600) % 24;
            const minutes = Math.floor(uptime / 60) % 60;
            const seconds = Math.floor(uptime % 60);

            const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

            const infoEmbed = new EmbedBuilder()
                .setTitle('🤖 Satla Bot Information')
                .setDescription('A comprehensive Discord bot with ticket system, welcome messages, and auto-role functionality.')
                .addFields(
                    { 
                        name: '📊 Bot Statistics', 
                        value: `**Servers:** ${client.guilds.cache.size}\n**Users:** ${client.users.cache.size.toLocaleString()}\n**Commands:** ${client.commands.size}`, 
                        inline: true 
                    },
                    { 
                        name: '🎫 Ticket Statistics', 
                        value: `**Total:** ${totalTickets}\n**Open:** ${openTickets}\n**Closed:** ${closedTickets}`, 
                        inline: true 
                    },
                    { 
                        name: '⚙️ System Info', 
                        value: `**Uptime:** ${uptimeString}\n**Node.js:** ${process.version}\n**Discord.js:** v${require('discord.js').version}`, 
                        inline: true 
                    },
                    {
                        name: '✨ Features',
                        value: '• 🎫 Advanced ticket system with modals\n• 👋 Customizable welcome messages\n• 🔧 Auto-role assignment\n• 📊 Ticket logging and statistics\n• 🛡️ Permission-based commands\n• 🌐 Multi-language support ready',
                        inline: false
                    },
                    {
                        name: '🔗 Quick Setup',
                        value: '1. `/ticketconfig` - Configure ticket system\n2. `/welcome set` - Set up welcome messages\n3. `/autorole set` - Configure auto-roles\n4. `/ticketpanel` - Create ticket panel',
                        inline: false
                    }
                )
                .setColor('#00aaff')
                .setThumbnail(client.user.displayAvatarURL())
                .setFooter({ 
                    text: `Requested by ${interaction.user.username}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                })
                .setTimestamp();

            await interaction.reply({ embeds: [infoEmbed] });

        } catch (error) {
            console.error('Error in info command:', error);
            await interaction.reply({
                content: '❌ An error occurred while fetching bot information.',
                flags: 64
            });
        }
    },

    cooldown: 10000 // 10 seconds
};
