# Satla Bot - Advanced Discord Support Bot

A comprehensive Discord bot featuring an advanced ticket system, welcome messages, auto-role assignment, and robust error handling.

## 🚀 Features

### 🎫 Advanced Ticket System
- **Modal-based ticket creation** with subject, description, and priority
- **Smart duplicate prevention** to avoid interaction conflicts
- **Ticket claiming and management** by staff members
- **Automated ticket logging** with detailed action history
- **Configurable ticket categories** and staff roles
- **Maximum ticket limits** per user to prevent spam
- **Ticket transcripts** and closure confirmations

### 👋 Welcome System
- **Customizable welcome messages** with user and server placeholders
- **Rich embed welcome cards** with member information
- **Configurable welcome channels** and message styling
- **Test functionality** to preview welcome messages

### 🔧 Auto-Role System
- **Automatic role assignment** for new members
- **Permission-based configuration** with safety checks
- **Role hierarchy validation** to prevent conflicts

### 🛡️ Advanced Security & Error Handling
- **Interaction deduplication** to prevent "already acknowledged" errors
- **Operation tracking** to avoid duplicate ticket creation
- **Robust permission system** with multiple validation layers
- **Comprehensive error logging** and graceful failure handling

## 📋 Commands

### General Commands
- `/info` - Display bot information and statistics
- `/autorole set|remove|status` - Configure automatic role assignment
- `/welcome set|disable|test|status` - Configure welcome messages

### Ticket Commands
- `/ticketpanel [channel]` - Create a ticket panel for users
- `/ticketconfig category|staffrole|logs|maxtickets|status` - Configure ticket system

### Admin Commands
- All configuration commands require appropriate permissions

## 🔧 Setup Instructions

### 1. Prerequisites
- Node.js 16.0.0 or higher
- MongoDB database
- Discord application with bot token

### 2. Installation

```bash
# Clone or download the project
cd satla-bot

# Install dependencies
npm install

# Configure environment variables
# Copy .env.example to .env and fill in your values
```

### 3. Environment Variables

Create a `.env` file with the following variables:

```env
TOKEN=your_discord_bot_token
MONGODB_URI=your_mongodb_connection_string
GUILD_ID=your_server_id_for_testing
CLIENT_ID=your_bot_application_id
STAFF_ROLE_ID=your_staff_role_id
```

### 4. Deploy Commands

```bash
# Deploy slash commands to Discord
npm run deploy
```

### 5. Start the Bot

```bash
# Production
npm start

# Development (with auto-restart)
npm run dev
```

## ⚙️ Configuration

### Initial Setup

1. **Configure Ticket System:**
   ```
   /ticketconfig category #ticket-category
   /ticketconfig staffrole @Staff
   /ticketconfig logs #ticket-logs
   /ticketconfig maxtickets 3
   ```

2. **Set Up Welcome Messages:**
   ```
   /welcome set #welcome "Welcome {user} to {server}! 🎉"
   ```

3. **Configure Auto-Role:**
   ```
   /autorole set @Member
   ```

4. **Create Ticket Panel:**
   ```
   /ticketpanel #support
   ```

### Permission Requirements

The bot requires the following permissions:
- Send Messages
- Read Message History
- Manage Channels
- Manage Roles
- Embed Links
- Use External Emojis
- Add Reactions

## 📁 Project Structure

```
satla-bot/
├── commands/
│   ├── admin/          # Admin-only commands
│   ├── general/        # General commands
│   └── tickets/        # Ticket-related commands
├── events/
│   ├── ready.js        # Bot startup event
│   └── guildMemberAdd.js # New member handling
├── handlers/
│   ├── commandHandler.js    # Command loading
│   ├── eventHandler.js      # Event loading
│   ├── interactionHandler.js # Interaction management
│   ├── ticketHandler.js     # Ticket operations
│   └── confirmHandler.js    # Confirmation dialogs
├── models/
│   ├── Ticket.js       # Ticket database schema
│   └── GuildConfig.js  # Guild configuration schema
├── utils/
│   ├── database.js     # Database connection
│   ├── permissions.js  # Permission checking
│   └── translations.js # Multi-language support
├── index.js            # Main bot file
├── deploy-commands.js  # Command deployment script
└── package.json        # Dependencies and scripts
```

## 🎫 Ticket System Features

### Ticket Creation
- Users click the "Create Ticket" button on the ticket panel
- Modal form collects subject and description
- Automatic duplicate prevention and user limit checking
- Unique ticket ID generation (TICKET-0001, TICKET-0002, etc.)

### Ticket Management
- Staff can claim tickets for assignment
- Ticket status tracking (open, claimed, closed)
- Confirmation dialogs for closing tickets
- Automatic channel deletion after closure

### Ticket Logging
- All ticket actions are logged to a designated channel
- Detailed audit trail with timestamps and user information
- Status-based color coding for easy identification

## 🔒 Security Features

### Interaction Handling
- **Duplicate Prevention:** Tracks recent interactions to prevent spam
- **Operation Tracking:** Prevents duplicate ticket creation attempts
- **Safe Response Handling:** Graceful handling of acknowledged interactions
- **Cooldown System:** Per-command and per-user cooldowns

### Permission System
- **Role-based Access:** Different permission levels for different commands
- **Hierarchy Validation:** Prevents role assignment conflicts
- **Permission Checking:** Validates bot permissions before operations

## 🌐 Multi-Language Support

The bot includes a translation system ready for multiple languages:
- Easy translation key management
- Placeholder replacement for dynamic content
- Language-specific configuration per guild (ready for implementation)

## 📊 Database Models

### Ticket Model
- Unique ticket ID and user tracking
- Status management and timestamps
- Message and log history
- Priority and category classification

### Guild Configuration Model
- Welcome system settings
- Auto-role configuration
- Ticket system parameters
- Customizable limits and channels

## 🛠️ Development

### Adding New Commands

1. Create a new file in the appropriate command folder
2. Follow the command template structure
3. Include proper permission checks and error handling
4. Add cooldowns for rate limiting

### Adding New Events

1. Create a new file in the `events/` folder
2. Export an object with `name` and `execute` properties
3. Handle errors gracefully

### Database Operations

All database operations include error handling and connection management. The bot automatically reconnects on database disconnection.

## 🐛 Troubleshooting

### Common Issues

1. **"Interaction already acknowledged" errors:**
   - The bot includes robust duplicate prevention
   - Check for multiple instances running simultaneously

2. **Missing permissions:**
   - Verify bot role hierarchy
   - Check channel-specific permissions

3. **Database connection issues:**
   - Verify MongoDB URI in environment variables
   - Check network connectivity

### Error Logging

The bot logs all errors with detailed information:
- Command execution errors
- Database operation failures
- Permission issues
- Interaction handling problems

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper error handling
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support or questions:
1. Check the troubleshooting section
2. Review the console logs for error details
3. Ensure all environment variables are properly configured
4. Verify bot permissions in your Discord server

---

**Note:** This bot is designed with production-ready error handling and security features. All interactions are properly managed to prevent common Discord.js issues like duplicate responses and permission conflicts.
