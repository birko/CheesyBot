import { ChatInputCommandInteraction, Guild, TextChannel, Role } from 'discord.js';
const config = require('../config.json');

export async function notifyAdmins(interaction: ChatInputCommandInteraction, message: string): Promise<void> {
    let guild: Guild | null = interaction.guild;

    // Check if a specific notification guild is configured
    if (config.notificationGuildId) {
        const targetGuild = interaction.client.guilds.cache.get(config.notificationGuildId);
        if (targetGuild) {
            guild = targetGuild;
        } else {
            console.warn(`Configured notification guild ID "${config.notificationGuildId}" not found. Falling back to current guild.`);
        }
    }

    if (!guild) return;

    // Find the admin role to mention in the target guild
    const adminRole = guild.roles.cache.find((role: Role) => role.name === config.adminRole);
    const mention = adminRole ? `<@&${adminRole.id}>` : '@here';

    // Find the notification channel
    const channelName = config.notificationChannel || 'orders';
    const channel = guild.channels.cache.find(c => c.name === channelName && c.isTextBased()) as TextChannel;

    if (channel) {
        try {
            // Add context about where the order came from if cross-guild
            let prefix = '';
            if (guild.id !== interaction.guildId && interaction.guild) {
                prefix = `[From Server: **${interaction.guild.name}**] `;
            }

            await channel.send(`${prefix}${mention} ${message}`);
        } catch (error) {
            console.error(`Failed to send notification to #${channelName} in guild ${guild.name}:`, error);
        }
    } else {
        console.warn(`Notification channel "${channelName}" not found in guild ${guild.name}.`);
    }
}

