# 🚀 Quick Setup Guide for Satla Bot

## ✅ Prerequisites Checklist

Before setting up the bot, ensure you have:

- [x] Discord Bot Application created
- [x] Bot token from Discord Developer Portal
- [x] MongoDB database (local or cloud)
- [x] Node.js 16+ installed
- [x] Bot added to your Discord server with required permissions

## 🏃‍♂️ Quick Start (5 minutes)

### 1. Environment Setup
Ensure your `.env` file contains:
```env
TOKEN=your_discord_bot_token
MONGODB_URI=your_mongodb_connection_string
GUILD_ID=your_server_id
CLIENT_ID=your_bot_application_id
STAFF_ROLE_ID=your_staff_role_id
```

### 2. Install & Start
```bash
npm install
npm run deploy
npm start
```

### 3. Initial Bot Configuration

Run these commands in your Discord server:

#### Essential Setup
```
/health                     # Check bot status
/ticketconfig category #tickets-category
/ticketconfig staffrole @Staff
/ticketpanel #support      # Create ticket panel
```

#### Optional Setup
```
/welcome set #welcome "Welcome {user} to {server}! 🎉"
/autorole set @Member
/ticketconfig logs #ticket-logs
/ticketconfig maxtickets 3
```

## 🎫 Ticket System Setup

### Step 1: Create Category
1. Create a category channel named "Tickets" or similar
2. Set permissions so only staff can see it
3. Run: `/ticketconfig category #your-tickets-category`

### Step 2: Configure Staff Role
1. Create or identify your staff role
2. Run: `/ticketconfig staffrole @YourStaffRole`

### Step 3: Set Up Logging (Optional)
1. Create a private channel for ticket logs
2. Run: `/ticketconfig logs #ticket-logs`

### Step 4: Create Ticket Panel
1. Go to your support channel
2. Run: `/ticketpanel`
3. Users can now click the button to create tickets!

## 🔧 Permission Requirements

The bot needs these permissions:
- ✅ Send Messages
- ✅ Read Message History  
- ✅ Manage Channels (for creating ticket channels)
- ✅ Manage Roles (for auto-role and ticket permissions)
- ✅ Embed Links
- ✅ Use External Emojis
- ✅ Add Reactions

## 📋 Command Reference

### General Commands
- `/ping` - Test bot responsiveness
- `/info` - Bot information and statistics
- `/health` - System health check (admin only)

### Configuration Commands
- `/ticketconfig` - Configure ticket system
- `/welcome` - Configure welcome messages
- `/autorole` - Configure automatic role assignment

### Ticket Management
- `/ticketpanel` - Create ticket creation panel
- `/tickets list` - List tickets (filtered view)
- `/tickets view <id>` - View specific ticket details
- `/tickets close <id>` - Force close a ticket
- `/tickets stats` - View ticket statistics

## ⚡ Quick Troubleshooting

### Bot Not Responding?
1. Check if bot is online (green status)
2. Verify bot has required permissions
3. Run `/health` to check system status
4. Check console for error messages

### Tickets Not Working?
1. Verify ticket category is set: `/ticketconfig status`
2. Check staff role is configured
3. Ensure bot can manage channels
4. Test with `/health` command

### Welcome Messages Not Sending?
1. Check welcome is enabled: `/welcome status`
2. Verify bot can send messages in welcome channel
3. Test with `/welcome test`

### Database Issues?
1. Verify MongoDB URI in `.env` file
2. Check network connectivity to database
3. Look for connection errors in console

## 🔄 Regular Maintenance

### Daily Tasks
- Monitor ticket activity with `/tickets stats`
- Check for any error messages in console
- Ensure ticket channels aren't accumulating

### Weekly Tasks
- Run `/health` to check system status
- Review and close old tickets if needed
- Update welcome messages if necessary

### Monthly Tasks
- Update bot dependencies: `npm update`
- Review ticket statistics and performance
- Clean up old ticket data if needed

## 📞 Getting Help

If you encounter issues:

1. **Check the logs**: Look at the console output for error messages
2. **Run diagnostics**: Use `/health` command to identify issues
3. **Verify configuration**: Use status subcommands (`/ticketconfig status`, `/welcome status`, etc.)
4. **Check permissions**: Ensure bot has all required permissions
5. **Restart if needed**: Sometimes a simple restart resolves issues

## 🎉 You're All Set!

Your Discord bot is now ready to:
- ✅ Handle support tickets efficiently
- ✅ Welcome new members automatically  
- ✅ Assign roles to new joiners
- ✅ Provide detailed ticket management
- ✅ Log all activities for audit purposes

**Next Steps:**
- Customize welcome messages for your server
- Set up ticket categories for different types of support
- Train your staff on using ticket management commands
- Monitor bot performance with health checks

---

**🔗 Need more help?** Check the full README.md for detailed documentation and advanced features!
