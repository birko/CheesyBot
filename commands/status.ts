import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { adminCommand } from '../utils/guards';
import { resolveTargetUser } from '../utils/orderHelpers';
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
    execute: adminCommand(async (interaction: ChatInputCommandInteraction) => {
        const newStatus = interaction.options.getString('status', true);
        const index = interaction.options.getInteger('index');

        let targetUser = await resolveTargetUser(interaction);

        if (!targetUser) {
            // resolveTargetUser handles index errors. 
            // If explicit index was given and failed, we return.
            if (index) return;

            // If no user/index provided at all:
            await interaction.reply({ content: interaction.t('commands.status.missing_target'), flags: MessageFlags.Ephemeral });
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
        await notifyAdmins(interaction, t('commands.status.admin_notification', { user: formatUser(interaction.user, interaction.member), target: formatUser(targetUser, member), status: result.status }));
    }),
};


