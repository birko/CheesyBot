const { SlashCommandBuilder } = require('discord.js');
const { isAdmin } = require('../utils/auth');
const orderService = require('../services/orderService');
const { notifyAdmins } = require('../utils/notify');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Update order status (Admin only)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to update status for')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('status')
                .setDescription('The new status')
                .setRequired(true)
                .addChoices(
                    { name: 'New', value: 'New' },
                    { name: 'Processing', value: 'Processing' },
                    { name: 'Ready', value: 'Ready' },
                    { name: 'Completed', value: 'Completed' }
                )),
    async execute(interaction) {
        if (!isAdmin(interaction)) {
            await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            return;
        }

        const targetUser = interaction.options.getUser('user');
        const newStatus = interaction.options.getString('status');

        const result = orderService.updateStatus(targetUser.id, newStatus);

        if (!result.success) {
            await interaction.reply({ content: result.error, ephemeral: true });
            return;
        }

        await interaction.reply(`Updated status for ${targetUser.username} to **${result.status}**.`);
        await notifyAdmins(interaction, `**Status Update**: ${interaction.user} set status for ${targetUser} to **${result.status}**.`);
    },
};
