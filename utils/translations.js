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
                'ticket_claim_title': '🔧 Ticket Claimed!',
                'ticket_claim_description': '**{user}** has claimed this ticket and will assist you shortly.',
                'ticket_claim_footer': 'Please be patient while our staff assists you',                'ticket_close_confirm': 'Are you sure you want to close ticket **{ticketId}**?\n\nThis action cannot be undone and the channel will be deleted.',
                'ticket_closing': '✅ Ticket will be closed in 5 seconds...',
                'ticket_close_cancelled': '❌ Ticket close cancelled.',
                
                // Ticket field labels
                'ticket_field_staff': '👤 Staff Member',
                'ticket_field_ticket_id': '🎫 Ticket ID',
                'ticket_field_response_time': '⏱️ Response Time',
                
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
                  // Ticket Panel
                'ticketpanel_title': '🎫 Support Ticket System',
                'ticketpanel_description': '**Need help or have a question?**\n\nClick the button below to create a support ticket. Our staff team will assist you as soon as possible.\n\n**Before creating a ticket:**\n• Check if your question has been answered in our FAQ\n• Make sure your issue hasn\'t been resolved already\n• Provide clear and detailed information about your problem\n\n**Ticket Categories:**\n🔧 Technical Support\n💬 General Questions\n🛠️ Bug Reports\n💡 Feature Requests',
                'ticketpanel_footer': '• One ticket per issue • Be patient and respectful',
                'ticketpanel_button': 'Create Ticket',
                'ticketpanel_created': '✅ Ticket panel created successfully in {channel}!',
                'ticketpanel_permission_denied': '❌ You do not have permission to create ticket panels.',
                'ticketpanel_error': '❌ Failed to create ticket panel. Please check my permissions and try again.',
                
                // Ticket Commands
                'tickets_list_title': '🎫 Ticket List',
                'tickets_list_empty': '📭 No tickets found matching your criteria.',
                'tickets_list_footer': 'Showing {count} tickets',
                'tickets_no_permission': '❌ You do not have permission to manage tickets.',
                'tickets_stats_title': '📊 Ticket Statistics',
                'tickets_total': '🎫 Total Tickets',
                'tickets_open': '🟢 Open',
                'tickets_claimed': '🟡 Claimed',
                'tickets_closed': '🔴 Closed',
                'tickets_today': '📅 Today',
                'tickets_avg_response': '⏱️ Avg Response Time',
                'tickets_stats_footer': 'Statistics for {server}',
                'tickets_view_title': '🎫 {ticketId}',
                'tickets_view_user': '👤 User',
                'tickets_view_subject': '📝 Subject',
                'tickets_view_status': '🔹 Status',
                'tickets_view_created': '📅 Created',
                'tickets_view_claimed_by': '🔧 Claimed by',
                'tickets_view_closed': '🔒 Closed',
                'tickets_view_recent_activity': '📋 Recent Activity',
                'tickets_force_closed': '✅ Ticket **{ticketId}** has been force closed.\n**Reason:** {reason}',
                
                // Ticket Config
                'ticketconfig_permission_denied': '❌ You do not have permission to configure ticket settings.',
                'ticketconfig_category_set': '✅ Ticket category has been set to **{category}**.',
                'ticketconfig_category_invalid': '❌ Please select a category channel.',
                'ticketconfig_staffrole_set': '✅ Staff role has been set to **{role}**.',
                'ticketconfig_logs_set': '✅ Ticket log channel has been set to {channel}.',
                'ticketconfig_logs_invalid': '❌ Please select a text channel.',
                'ticketconfig_maxtickets_set': '✅ Maximum tickets per user has been set to **{amount}**.',
                'ticketconfig_status_title': '**🎫 Ticket System Configuration**',
                'ticketconfig_status_category': '📁 **Category:** {category}',
                'ticketconfig_status_staffrole': '👥 **Staff Role:** {role}',
                'ticketconfig_status_logs': '📋 **Log Channel:** {channel}',
                'ticketconfig_status_maxtickets': '🔢 **Max Tickets per User:** {amount}',
                'ticketconfig_status_enabled': '⚙️ **System Status:** {status}',
                'ticketconfig_not_configured': 'Not configured',
                'ticketconfig_not_found': 'Not found',
                'ticketconfig_enabled': 'Enabled',
                'ticketconfig_disabled': 'Disabled',
                'ticketconfig_error': '❌ An error occurred while configuring ticket settings.',
                
                // Ticket Creation Modal
                'ticket_modal_title': 'Create Support Ticket',
                'ticket_modal_subject': 'Subject',
                'ticket_modal_subject_placeholder': 'Brief description of your issue',
                'ticket_modal_description': 'Description',
                'ticket_modal_description_placeholder': 'Detailed description of your issue or question',
                
                // Ticket Buttons
                'ticket_button_claim': '🔧 Claim Ticket',
                'ticket_button_close': '🔒 Close Ticket',
                'ticket_button_claimed': '✅ Claimed',
                'ticket_button_confirm_close': '✅ Yes, Close Ticket',
                'ticket_button_cancel': '❌ Cancel',
                
                // Configuration
                'config_updated': '✅ Configuration updated successfully.',
                'config_channel_permissions': '❌ I do not have permission to send messages in that channel.',
                'config_invalid_channel': '❌ Please select a valid channel.',
                'config_invalid_role': '❌ Please select a valid role.'
            },

            he: {
                // כללי
                'error_generic': '❌ אירעה שגיאה בעת עיבוד הבקשה שלך.',
                'error_permissions': '❌ אין לך הרשאה להשתמש בפקודה זו.',
                'error_cooldown': '⏱️ המתן {time} שניות לפני השימוש הבא בפקודה זו.',
                'success_generic': '✅ הפעולה הושלמה בהצלחה.',
                  // טיקטים
                'ticket_created': '✅ טיקט נפתח בהצלחה! בדוק את {channel} עבור בקשת התמיכה שלך.',
                'ticket_max_reached': '❌ יש לך כבר {count} טיקטים פתוחים. סגור חלק מהם לפני פתיחה חדשה.',
                'ticket_not_found': '❌ טיקט לא נמצא.',
                'ticket_already_claimed': '❌ טיקט זה כבר טופל על ידי {user}.',
                'ticket_already_closed': '❌ טיקט זה כבר נסגר.',
                'ticket_claimed': '🔧 **{user}** טיפל בכרטיס הזה ויעזור לך בקרוב.',
                'ticket_claim_title': '🔧 טיקט נטפל!',
                'ticket_claim_description': '**{user}** טיפל בכרטיס הזה ויעזור לך בקרוב.',
                'ticket_claim_footer': 'אנא היה סבלני בזמן שהצוות שלנו עוזר לך',                'ticket_close_confirm': 'האם אתה בטוח שברצונך לסגור את הכרטיס **{ticketId}**?\n\nלא ניתן לבטל פעולה זו והערוץ יימחק.',
                'ticket_closing': '✅ הכרטיס ייסגר בעוד 5 שניות...',
                'ticket_close_cancelled': '❌ סגירת הכרטיס בוטלה.',
                
                // תוויות שדות טיקט
                'ticket_field_staff': '👤 איש צוות',
                'ticket_field_ticket_id': '🎫 מזהה טיקט',
                'ticket_field_response_time': '⏱️ זמן תגובה',
                
                // ברוכים הבאים
                'welcome_default': 'ברוך הבא {user} ל-{server}! 🎉',
                'welcome_configured': '✅ הודעות ברוכים הבאים הוגדרו בהצלחה!',
                'welcome_disabled': '✅ הודעות ברוכים הבאים הושבתו.',
                'welcome_not_configured': '❌ הודעות ברוכים הבאים לא הוגדרו. השתמש ב-`/welcome set` תחילה.',
                'welcome_test_sent': '✅ הודעת ברוכים הבאים נשלחה לבדיקה אל {channel}!',
                
                // תפקיד אוטומטי
                'autorole_set': '✅ תפקיד אוטומטי הוגדר כ-**{role}**. חברים חדשים יקבלו את התפקיד הזה באופן אוטומטי.',
                'autorole_disabled': '✅ תפקיד אוטומטי הושבת.',
                'autorole_role_too_high': '❌ איני יכול להקצות תפקיד זה כיוון שהוא שווה או גבוה מהתפקיד הגבוה ביותר שלי.',
                'autorole_managed_role': '❌ תפקיד זה מנוהל על ידי אינטגרציה ולא ניתן להקצות אותו.',
                  // פאנל טיקטים
                'ticketpanel_title': '🎫 מערכת כרטיסי תמיכה',
                'ticketpanel_description': '**צריך עזרה או יש לך שאלה?**\n\nלחץ על הכפתור למטה כדי ליצור טיקט תמיכה. צוות הסטאף שלנו יעזור לך בהקדם האפשרי.\n\n**לפני יצירת טיקט:**\n• בדוק אם השאלה שלך נענתה בשאלות נפוצות\n• וודא שהבעיה שלך עדיין לא נפתרה\n• ספק מידע ברור ומפורט על הבעיה שלך\n\n**קטגוריות טיקטים:**\n🔧 תמיכה טכנית\n💬 שאלות כלליות\n🛠️ דיווח על באגים\n💡 בקשות לתכונות',
                'ticketpanel_footer': '• טיקט אחד לכל בעיה • היה סבלני ומכבד',
                'ticketpanel_button': 'צור טיקט',
                'ticketpanel_created': '✅ פאנל טיקטים נוצר בהצלחה ב-{channel}!',
                'ticketpanel_permission_denied': '❌ אין לך הרשאה ליצור פאנלי טיקטים.',
                'ticketpanel_error': '❌ נכשל ליצור פאנל טיקטים. אנא בדוק את ההרשאות שלי ונסה שוב.',
                
                // פקודות טיקטים
                'tickets_list_title': '🎫 רשימת טיקטים',
                'tickets_list_empty': '📭 לא נמצאו טיקטים התואמים לקריטריונים שלך.',
                'tickets_list_footer': 'מציג {count} טיקטים',
                'tickets_no_permission': '❌ אין לך הרשאה לנהל טיקטים.',
                'tickets_stats_title': '📊 סטטיסטיקות טיקטים',
                'tickets_total': '🎫 סך הכל טיקטים',
                'tickets_open': '🟢 פתוחים',
                'tickets_claimed': '🟡 נטפלים',
                'tickets_closed': '🔴 סגורים',
                'tickets_today': '📅 היום',
                'tickets_avg_response': '⏱️ זמן תגובה ממוצע',
                'tickets_stats_footer': 'סטטיסטיקות עבור {server}',
                'tickets_view_title': '🎫 {ticketId}',
                'tickets_view_user': '👤 משתמש',
                'tickets_view_subject': '📝 נושא',
                'tickets_view_status': '🔹 סטטוס',
                'tickets_view_created': '📅 נוצר',
                'tickets_view_claimed_by': '🔧 נטפל על ידי',
                'tickets_view_closed': '🔒 נסגר',
                'tickets_view_recent_activity': '📋 פעילות אחרונה',
                'tickets_force_closed': '✅ הכרטיס **{ticketId}** נסגר בכוח.\n**סיבה:** {reason}',
                
                // הגדרות טיקטים
                'ticketconfig_permission_denied': '❌ אין לך הרשאה להגדיר הגדרות טיקטים.',
                'ticketconfig_category_set': '✅ קטגוריית טיקטים הוגדרה כ-**{category}**.',
                'ticketconfig_category_invalid': '❌ אנא בחר ערוץ קטגוריה.',
                'ticketconfig_staffrole_set': '✅ תפקיד הסטאף הוגדר כ-**{role}**.',
                'ticketconfig_logs_set': '✅ ערוץ יומני טיקטים הוגדר כ-{channel}.',
                'ticketconfig_logs_invalid': '❌ אנא בחר ערוץ טקסט.',
                'ticketconfig_maxtickets_set': '✅ מספר טיקטים מקסימלי למשתמש הוגדר כ-**{amount}**.',
                'ticketconfig_status_title': '**🎫 הגדרות מערכת טיקטים**',
                'ticketconfig_status_category': '📁 **קטגוריה:** {category}',
                'ticketconfig_status_staffrole': '👥 **תפקיד סטאף:** {role}',
                'ticketconfig_status_logs': '📋 **ערוץ יומנים:** {channel}',
                'ticketconfig_status_maxtickets': '🔢 **מקסימום טיקטים למשתמש:** {amount}',
                'ticketconfig_status_enabled': '⚙️ **סטטוס מערכת:** {status}',
                'ticketconfig_not_configured': 'לא מוגדר',
                'ticketconfig_not_found': 'לא נמצא',
                'ticketconfig_enabled': 'מופעל',
                'ticketconfig_disabled': 'מושבת',
                'ticketconfig_error': '❌ אירעה שגיאה בעת הגדרת הגדרות טיקטים.',
                
                // מודל יצירת טיקט
                'ticket_modal_title': 'צור טיקט תמיכה',
                'ticket_modal_subject': 'נושא',
                'ticket_modal_subject_placeholder': 'תיאור קצר של הבעיה שלך',
                'ticket_modal_description': 'תיאור',
                'ticket_modal_description_placeholder': 'תיאור מפורט של הבעיה או השאלה שלך',
                
                // כפתורי טיקט
                'ticket_button_claim': '🔧 טפל בכרטיס',
                'ticket_button_close': '🔒 סגור טיקט',
                'ticket_button_claimed': '✅ נטפל',
                'ticket_button_confirm_close': '✅ כן, סגור טיקט',
                'ticket_button_cancel': '❌ בטל',
                
                // הגדרות
                'config_updated': '✅ ההגדרות עודכנו בהצלחה.',
                'config_channel_permissions': '❌ אין לי הרשאה לשלוח הודעות בערוץ זה.',
                'config_invalid_channel': '❌ אנא בחר ערוץ חוקי.',
                'config_invalid_role': '❌ אנא בחר תפקיד חוקי.'
            }
        };
    }

    get(key, lang = 'he', replacements = {}) {
        const translation = this.translations[lang]?.[key] || this.translations.en[key] || key;

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
