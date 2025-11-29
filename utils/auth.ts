import { ChatInputCommandInteraction, GuildMember, Role } from 'discord.js';
const config = require('../config.json');

export function isAdmin(interaction: ChatInputCommandInteraction): boolean {
    if (!interaction.member || !(interaction.member instanceof GuildMember)) {
        // Should not happen in guild commands, but safe check
        return false;
    }

    if (!interaction.guild) {
        return false;
    }

    // Check if user has the role by name
    const adminRole = interaction.guild.roles.cache.find((role: Role) => role.name === config.adminRole);

    if (!adminRole) {
        console.warn(`Admin role "${config.adminRole}" not found in guild.`);
        return false;
    }

    return interaction.member.roles.cache.has(adminRole.id);
}

