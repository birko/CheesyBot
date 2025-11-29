import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { isAdmin } from '../utils/auth';
import orderService from '../services/orderService';
import { notifyAdmins } from '../utils/notify';

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
    async execute(interaction: ChatInputCommandInteraction) {
        if (!isAdmin(interaction)) {
            await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            return;
        }

        const targetUser = interaction.options.getUser('user', true);
        const newStatus = interaction.options.getString('status', true);

        const result = orderService.updateStatus(targetUser.id, newStatus);

        if (!result.success) {
            await interaction.reply({ content: result.error || 'Unknown error', ephemeral: true });
            return;
        }

        await interaction.reply(`Updated status for ${targetUser.username} to **${result.status}**.`);
        await notifyAdmins(interaction, `**Status Update**: ${interaction.user} set status for ${targetUser} to **${result.status}**.`);
    },
};

