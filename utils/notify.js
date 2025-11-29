const config = require('../config.json');

async function notifyAdmins(interaction, message) {
    let guild = interaction.guild;

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
    const adminRole = guild.roles.cache.find(role => role.name === config.adminRole);
    const mention = adminRole ? `<@&${adminRole.id}>` : '@here';

    // Find the notification channel
    const channelName = config.notificationChannel || 'orders';
    const channel = guild.channels.cache.find(c => c.name === channelName && c.isTextBased());

    if (channel) {
        try {
            // Add context about where the order came from if cross-guild
            let prefix = '';
            if (guild.id !== interaction.guildId) {
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

module.exports = { notifyAdmins };
