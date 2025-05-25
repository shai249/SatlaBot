const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');
const { checkPermissions } = require('../../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autorole')
        .setDescription('Configure automatic role assignment for new members')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set the auto-role for new members')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('The role to assign to new members')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Disable auto-role assignment')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check current auto-role configuration')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        if (!checkPermissions.canConfigureBot(interaction.member)) {
            return await interaction.reply({
                content: '❌ You do not have permission to configure auto-role settings.',
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
                    const role = interaction.options.getRole('role');
                    
                    // Check if bot can assign this role
                    const botMember = interaction.guild.members.me;
                    if (role.position >= botMember.roles.highest.position) {
                        return await interaction.reply({
                            content: '❌ I cannot assign this role as it is higher than or equal to my highest role.',
                            flags: 64
                        });
                    }

                    if (role.managed) {
                        return await interaction.reply({
                            content: '❌ This role is managed by an integration and cannot be assigned.',
                            flags: 64
                        });
                    }

                    guildConfig.autoRoleConfig.enabled = true;
                    guildConfig.autoRoleConfig.roleId = role.id;
                    await guildConfig.save();

                    await interaction.reply({
                        content: `✅ Auto-role has been set to **${role.name}**. New members will automatically receive this role.`,
                        flags: 64
                    });
                    break;

                case 'remove':
                    guildConfig.autoRoleConfig.enabled = false;
                    guildConfig.autoRoleConfig.roleId = null;
                    await guildConfig.save();

                    await interaction.reply({
                        content: '✅ Auto-role has been disabled.',
                        flags: 64
                    });
                    break;

                case 'status':
                    if (guildConfig.autoRoleConfig.enabled && guildConfig.autoRoleConfig.roleId) {
                        const configuredRole = interaction.guild.roles.cache.get(guildConfig.autoRoleConfig.roleId);
                        if (configuredRole) {
                            await interaction.reply({
                                content: `✅ Auto-role is **enabled**.\n📝 Role: **${configuredRole.name}**`,
                                flags: 64
                            });
                        } else {
                            await interaction.reply({
                                content: '⚠️ Auto-role is enabled but the configured role no longer exists.',
                                flags: 64
                            });
                        }
                    } else {
                        await interaction.reply({
                            content: '❌ Auto-role is **disabled**.',
                            flags: 64
                        });
                    }
                    break;
            }
        } catch (error) {
            console.error('Error in autorole command:', error);
            await interaction.reply({
                content: '❌ An error occurred while configuring auto-role.',
                flags: 64
            });
        }
    },

    cooldown: 5000 // 5 seconds
};
