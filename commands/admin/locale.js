const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');
const { checkPermissions } = require('../../utils/permissions');
const { getTranslation, getLanguageName } = require('../../utils/translations');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('locale')
        .setDescription('Manage server language settings')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set the server language')
                .addStringOption(option =>
                    option
                        .setName('language')
                        .setDescription('Select language')
                        .setRequired(true)
                        .addChoices(
                            { name: 'English', value: 'en' },
                            { name: 'עברית (Hebrew)', value: 'he' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('current')
                .setDescription('Show current server language')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        if (!checkPermissions.canConfigureBot(interaction.member)) {
            return await interaction.reply({
                content: '❌ You do not have permission to manage server settings.',
                flags: 64
            });
        }

        const subcommand = interaction.options.getSubcommand();

        try {
            let guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
            if (!guildConfig) {
                guildConfig = new GuildConfig({ guildId: interaction.guild.id });
            }

            switch (subcommand) {
                case 'set':
                    const language = interaction.options.getString('language');
                    
                    guildConfig.language = language;
                    await guildConfig.save();

                    await interaction.reply({
                        content: `✅ Server language has been set to **${getLanguageName(language)}**.`,
                        flags: 64
                    });
                    break;

                case 'current':
                    const currentLang = guildConfig.language || 'en';
                    await interaction.reply({
                        content: `🌐 Current server language: **${getLanguageName(currentLang)}** (\`${currentLang}\`)`,
                        flags: 64
                    });
                    break;
            }
        } catch (error) {
            console.error('Error in locale command:', error);
            await interaction.reply({
                content: '❌ An error occurred while managing language settings.',
                flags: 64
            });
        }
    },

    cooldown: 5000 // 5 seconds
};