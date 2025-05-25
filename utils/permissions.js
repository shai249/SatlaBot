const { PermissionFlagsBits } = require('discord.js');

class PermissionChecker {
    isStaff(member) {
        if (!member || !member.guild) return false;
        
        // Check if user has admin permissions
        if (member.permissions.has(PermissionFlagsBits.Administrator)) {
            return true;
        }
        
        // Check if user has manage channels permission
        if (member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return true;
        }
        
        // Check if user has the staff role from environment
        const staffRoleId = process.env.STAFF_ROLE_ID;
        if (staffRoleId && member.roles.cache.has(staffRoleId)) {
            return true;
        }
        
        return false;
    }

    isModerator(member) {
        if (!member || !member.guild) return false;
        
        // Staff members are also moderators
        if (this.isStaff(member)) return true;
        
        // Check if user has manage messages permission
        if (member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return true;
        }
        
        return false;
    }

    isAdmin(member) {
        if (!member || !member.guild) return false;
        
        // Check if user has admin permissions
        if (member.permissions.has(PermissionFlagsBits.Administrator)) {
            return true;
        }
        
        // Check if user is guild owner
        if (member.id === member.guild.ownerId) {
            return true;
        }
        
        return false;
    }

    hasPermission(member, permission) {
        if (!member || !member.guild) return false;
        
        return member.permissions.has(permission);
    }

    canManageTickets(member) {
        return this.isStaff(member);
    }

    canConfigureBot(member) {
        return this.isAdmin(member);
    }

    async checkGuildPermissions(guild, clientMember) {
        const missingPermissions = [];
        
        const requiredPermissions = [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.ManageRoles,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.UseExternalEmojis,
            PermissionFlagsBits.AddReactions
        ];

        for (const permission of requiredPermissions) {
            if (!clientMember.permissions.has(permission)) {
                missingPermissions.push(permission);
            }
        }

        return {
            hasAllPermissions: missingPermissions.length === 0,
            missingPermissions
        };
    }
}

module.exports = {
    checkPermissions: new PermissionChecker()
};
