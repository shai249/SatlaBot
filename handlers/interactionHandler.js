const { InteractionType } = require('discord.js');

class InteractionHandler {
    constructor() {
        this.processingInteractions = new Set();
        this.recentInteractions = new Map();
        this.cooldowns = new Map();
    }

    init(client) {
        this.client = client;
        
        client.on('interactionCreate', async (interaction) => {
            try {
                await this.handleInteraction(interaction);
            } catch (error) {
                console.error('Error handling interaction:', error);
                await this.safeReply(interaction, {
                    content: '❌ An error occurred while processing your request.',
                    flags: 64
                });
            }
        });
    }

    async handleInteraction(interaction) {
        // Generate unique interaction ID
        const interactionId = `${interaction.user.id}-${interaction.type}-${Date.now()}`;
        
        // Check if we're already processing a similar interaction
        if (this.isProcessing(interaction)) {
            return;
        }

        // Add to processing set
        this.processingInteractions.add(interactionId);
        
        try {
            if (interaction.type === InteractionType.ApplicationCommand) {
                await this.handleSlashCommand(interaction);
            } else if (interaction.isButton()) {
                await this.handleButton(interaction);
            } else if (interaction.isStringSelectMenu()) {
                await this.handleSelectMenu(interaction);
            } else if (interaction.isModalSubmit()) {
                await this.handleModal(interaction);
            }
        } finally {
            // Remove from processing set
            this.processingInteractions.delete(interactionId);
            
            // Add to recent interactions to prevent duplicates
            this.recentInteractions.set(
                `${interaction.user.id}-${interaction.customId || interaction.commandName}`,
                Date.now()
            );
            
            // Clean up old entries
            this.cleanupRecentInteractions();
        }
    }

    isProcessing(interaction) {
        const key = `${interaction.user.id}-${interaction.customId || interaction.commandName}`;
        const recent = this.recentInteractions.get(key);
        
        // If interaction was processed within last 2 seconds, ignore it
        if (recent && Date.now() - recent < 2000) {
            return true;
        }
        
        return false;
    }

    async handleSlashCommand(interaction) {
        const command = this.client.commands.get(interaction.commandName);
        
        if (!command) {
            return await this.safeReply(interaction, {
                content: '❌ Command not found.',
                flags: 64
            });
        }

        // Check cooldowns
        if (this.isOnCooldown(interaction.user.id, interaction.commandName)) {
            const timeLeft = this.getCooldownTimeLeft(interaction.user.id, interaction.commandName);
            return await this.safeReply(interaction, {
                content: `⏱️ Please wait ${Math.ceil(timeLeft / 1000)} seconds before using this command again.`,
                flags: 64
            });
        }

        try {
            await command.execute(interaction);
            
            // Set cooldown if command has one
            if (command.cooldown) {
                this.setCooldown(interaction.user.id, interaction.commandName, command.cooldown);
            }
        } catch (error) {
            console.error(`Error executing command ${interaction.commandName}:`, error);
            await this.safeReply(interaction, {
                content: '❌ There was an error executing this command.',
                flags: 64
            });
        }
    }

    async handleButton(interaction) {
        const [action, ...params] = interaction.customId.split('-');
        
        try {
            switch (action) {
                case 'ticket':
                    const ticketHandler = require('./ticketHandler');
                    await ticketHandler.handleTicketButton(interaction, params);
                    break;
                case 'confirm':
                    const confirmHandler = require('./confirmHandler');
                    await confirmHandler.handleConfirm(interaction, params);
                    break;
                default:
                    await this.safeReply(interaction, {
                        content: '❌ Unknown button interaction.',
                        flags: 64
                    });
            }
        } catch (error) {
            console.error(`Error handling button ${interaction.customId}:`, error);
            await this.safeReply(interaction, {
                content: '❌ There was an error processing your button click.',
                flags: 64
            });
        }
    }

    async handleSelectMenu(interaction) {
        // Handle select menu interactions
        console.log('Select menu interaction:', interaction.customId);
    }

    async handleModal(interaction) {
        const [action, ...params] = interaction.customId.split('-');
        
        try {
            switch (action) {
                case 'ticket':
                    const ticketHandler = require('./ticketHandler');
                    await ticketHandler.handleTicketModal(interaction, params);
                    break;
                default:
                    await this.safeReply(interaction, {
                        content: '❌ Unknown modal interaction.',
                        flags: 64
                    });
            }
        } catch (error) {
            console.error(`Error handling modal ${interaction.customId}:`, error);
            await this.safeReply(interaction, {
                content: '❌ There was an error processing your modal submission.',
                flags: 64
            });
        }
    }

    async safeReply(interaction, options) {
        try {
            if (interaction.replied || interaction.deferred) {
                return await interaction.followUp(options);
            } else {
                return await interaction.reply(options);
            }
        } catch (error) {
            console.error('Error sending interaction response:', error);
            
            // Try to send as follow-up if reply failed
            try {
                if (!interaction.replied && !interaction.deferred) {
                    return await interaction.reply({
                        content: '❌ An error occurred.',
                        flags: 64
                    });
                }
            } catch (fallbackError) {
                console.error('Failed to send fallback response:', fallbackError);
            }
        }
    }

    async safeDefer(interaction, ephemeral = false) {
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.deferReply({ ephemeral });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deferring interaction:', error);
            return false;
        }
    }

    isOnCooldown(userId, commandName) {
        const key = `${userId}-${commandName}`;
        const cooldown = this.cooldowns.get(key);
        return cooldown && Date.now() < cooldown;
    }

    setCooldown(userId, commandName, duration) {
        const key = `${userId}-${commandName}`;
        this.cooldowns.set(key, Date.now() + duration);
    }

    getCooldownTimeLeft(userId, commandName) {
        const key = `${userId}-${commandName}`;
        const cooldown = this.cooldowns.get(key);
        return cooldown ? cooldown - Date.now() : 0;
    }

    cleanupRecentInteractions() {
        const now = Date.now();
        for (const [key, timestamp] of this.recentInteractions.entries()) {
            if (now - timestamp > 5000) { // Remove entries older than 5 seconds
                this.recentInteractions.delete(key);
            }
        }
    }
}

module.exports = new InteractionHandler();
