const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    channelId: {
        type: String,
        required: true
    },
    guildId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'claimed', 'closed'],
        default: 'open'
    },
    claimedBy: {
        type: String,
        default: null
    },
    claimedAt: {
        type: Date,
        default: null
    },    
    category: {
        type: String,
        default: 'general'
    },
    subject: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    closedAt: {
        type: Date,
        default: null
    },
    messages: [{
        authorId: String,
        authorName: String,
        content: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    logs: [{
        action: String,
        userId: String,
        username: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        details: String
    }]
}, {
    timestamps: true
});

// Generate unique ticket ID
ticketSchema.statics.generateTicketId = async function() {
    const count = await this.countDocuments();
    return `TICKET-${String(count + 1).padStart(4, '0')}`;
};

// Add log entry
ticketSchema.methods.addLog = function(action, userId, username, details = '') {
    this.logs.push({
        action,
        userId,
        username,
        details
    });
    return this.save();
};

module.exports = mongoose.model('Ticket', ticketSchema);
