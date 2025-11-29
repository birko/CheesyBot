const config = require('../config.json');

function isAdmin(interaction) {
    if (!interaction.member) {
        // Should not happen in guild commands, but safe check
        return false;
    }

    // Check if user has the role by name
    const adminRole = interaction.guild.roles.cache.find(role => role.name === config.adminRole);

    if (!adminRole) {
        console.warn(`Admin role "${config.adminRole}" not found in guild.`);
        return false;
    }

    return interaction.member.roles.cache.has(adminRole.id);
}

module.exports = { isAdmin };
