import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { isAdmin } from '../utils/auth';
import orderService from '../services/orderService';
import { notifyAdmins } from '../utils/notify';
import { formatUser } from '../utils/formatter';
import { t } from '../utils/i18n';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Update order status (Admin only)')
        .addStringOption(option =>
            option.setName('status')
                .setDescription('The new status')
                .setRequired(true)
                .addChoices(
                    { name: 'New', value: 'New' },
                    { name: 'Processing', value: 'Processing' },
                    { name: 'Ready', value: 'Ready' },
                    { name: 'Completed', value: 'Completed' }
                ))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to update status for')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('index')
                .setDescription('The order index (from /orders)')
                .setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
        if (!isAdmin(interaction)) {
            await interaction.reply({ content: interaction.t('common.permission_denied'), flags: MessageFlags.Ephemeral });
            return;
        }

        let targetUser = interaction.options.getUser('user');
        const index = interaction.options.getInteger('index');
        const newStatus = interaction.options.getString('status', true);

        if (!targetUser && !index) {
            await interaction.reply({ content: interaction.t('commands.status.missing_target'), flags: MessageFlags.Ephemeral });
            return;
        }

        if (index) {
            const userId = orderService.getUserByIndex(index);
            if (!userId) {
                await interaction.reply({ content: interaction.t('commands.status.invalid_index', { index }), flags: MessageFlags.Ephemeral });
                return;
            }
            // Fetch user object if possible, or just use ID for service and fetch for display
            try {
                targetUser = await interaction.client.users.fetch(userId);
            } catch (error) {
                // Fallback if user cannot be fetched (e.g. left guild), though service needs ID.
                // We need a User object for notifications/display.
                // If fetch fails, we might have a problem displaying the name.
                // Let's assume fetch works for active orders.
                console.error(`Failed to fetch user ${userId}:`, error);
                await interaction.reply({ content: interaction.t('common.unknown_error'), flags: MessageFlags.Ephemeral });
                return;
            }
        }

        if (!targetUser) {
            // Should not happen due to check above
            return;
        }

        const result = orderService.updateStatus(targetUser.id, newStatus);

        if (!result.success) {
            await interaction.reply({ content: result.error || interaction.t('common.unknown_error'), flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.reply({ content: interaction.t('commands.status.updated', { target: targetUser.username, status: result.status }), flags: MessageFlags.Ephemeral });
        // Try to get member for display name
        let member = null;
        try {
            member = await interaction.guild?.members.fetch(targetUser.id);
        } catch (e) { /* Ignore */ }

        await notifyAdmins(interaction, t('commands.status.admin_notification', { user: formatUser(interaction.user, interaction.member), target: formatUser(targetUser, member), status: result.status }));
    },
};


