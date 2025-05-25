class TranslationManager {
    constructor() {
        this.translations = {
            en: {
                // General
                'error_generic': '❌ An error occurred while processing your request.',
                'error_permissions': '❌ You do not have permission to use this command.',
                'error_cooldown': '⏱️ Please wait {time} seconds before using this command again.',
                'success_generic': '✅ Operation completed successfully.',
                
                // Tickets
                'ticket_created': '✅ Ticket created successfully! Please check {channel} for your support ticket.',
                'ticket_max_reached': '❌ You already have {count} open tickets. Please close some before creating new ones.',
                'ticket_not_found': '❌ Ticket not found.',
                'ticket_already_claimed': '❌ This ticket is already claimed by {user}.',
                'ticket_already_closed': '❌ This ticket is already closed.',
                'ticket_claimed': '🔧 **{user}** has claimed this ticket and will assist you shortly.',
                'ticket_close_confirm': 'Are you sure you want to close ticket **{ticketId}**?\n\nThis action cannot be undone and the channel will be deleted.',
                'ticket_closing': '✅ Ticket will be closed in 5 seconds...',
                'ticket_close_cancelled': '❌ Ticket close cancelled.',
                
                // Welcome
                'welcome_default': 'Welcome {user} to {server}! 🎉',
                'welcome_configured': '✅ Welcome messages have been configured!',
                'welcome_disabled': '✅ Welcome messages have been disabled.',
                'welcome_not_configured': '❌ Welcome messages are not configured. Use `/welcome set` first.',
                'welcome_test_sent': '✅ Test welcome message sent to {channel}!',
                
                // Auto-role
                'autorole_set': '✅ Auto-role has been set to **{role}**. New members will automatically receive this role.',
                'autorole_disabled': '✅ Auto-role has been disabled.',
                'autorole_role_too_high': '❌ I cannot assign this role as it is higher than or equal to my highest role.',
                'autorole_managed_role': '❌ This role is managed by an integration and cannot be assigned.',
                
                // Configuration
                'config_updated': '✅ Configuration updated successfully.',
                'config_channel_permissions': '❌ I do not have permission to send messages in that channel.',
                'config_invalid_channel': '❌ Please select a valid channel.',
                'config_invalid_role': '❌ Please select a valid role.'
            }
        };
    }

    get(key, lang = 'en', replacements = {}) {
        const translation = this.translations[lang]?.[key] || this.translations.en[key] || key;
        
        // Replace placeholders
        let result = translation;
        for (const [placeholder, value] of Object.entries(replacements)) {
            result = result.replace(`{${placeholder}}`, value);
        }
        
        return result;
    }

    addTranslation(lang, key, value) {
        if (!this.translations[lang]) {
            this.translations[lang] = {};
        }
        this.translations[lang][key] = value;
    }

    getSupportedLanguages() {
        return Object.keys(this.translations);
    }
}

module.exports = new TranslationManager();
