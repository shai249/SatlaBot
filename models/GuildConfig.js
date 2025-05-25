const mongoose = require('mongoose');

const guildConfigSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
      // Welcome system configuration
    welcomeConfig: {
        enabled: {
            type: Boolean,
            default: false
        },
        channelId: {
            type: String,
            default: null
        },
        message: {
            type: String,
            default: 'Welcome {user} to {server}! 🎉'
        },
        embedColor: {
            type: String,
            default: '#7289da'
        },
        embedTitle: {
            type: String,
            default: '👋 Welcome to {server}!'
        },
        embedDescription: {
            type: String,
            default: 'Welcome {user}! We\'re glad to have you here. Please read the rules and enjoy your stay!'
        },
        embedFooter: {
            type: String,
            default: 'Member #{memberCount}'
        },
        embedImage: {
            type: String,
            default: null // URL for banner image
        },
        showAvatar: {
            type: Boolean,
            default: true
        },
        showMemberCount: {
            type: Boolean,
            default: true
        },
        showServerIcon: {
            type: Boolean,
            default: true
        },
        embedStyle: {
            type: String,
            enum: ['modern', 'classic', 'minimal'],
            default: 'modern'
        }
    },
    
    // Auto-role configuration
    autoRoleConfig: {
        enabled: {
            type: Boolean,
            default: false
        },
        roleId: {
            type: String,
            default: null
        }
    },
    
    // Ticket system configuration
    ticketConfig: {
        enabled: {
            type: Boolean,
            default: true
        },
        categoryId: {
            type: String,
            default: null
        },
        staffRoleId: {
            type: String,
            default: null
        },
        logChannelId: {
            type: String,
            default: null
        },
        maxTicketsPerUser: {
            type: Number,
            default: 3
        },
        autoDeleteAfter: {
            type: Number,
            default: 24 // hours
        },
        transcriptEnabled: {
            type: Boolean,
            default: true
        }
    },
    
    // General settings
    language: {
        type: String,
        default: 'en'
    },
    
    prefix: {
        type: String,
        default: '!'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('GuildConfig', guildConfigSchema);
