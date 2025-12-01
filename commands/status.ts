import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { isAdmin } from '../utils/auth';
import orderService from '../services/orderService';
import { notifyAdmins } from '../utils/notify';
import { formatUser } from '../utils/formatter';
import { t } from '../utils/i18n';

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
            await interaction.reply({ content: interaction.t('common.permission_denied'), ephemeral: true });
            return;
        }

        const targetUser = interaction.options.getUser('user', true);
        const newStatus = interaction.options.getString('status', true);

        const result = orderService.updateStatus(targetUser.id, newStatus);

        if (!result.success) {
            await interaction.reply({ content: result.error || interaction.t('common.unknown_error'), ephemeral: true });
            return;
        }

        await interaction.reply({ content: interaction.t('commands.status.updated', { target: targetUser.username, status: result.status }), ephemeral: true });
        await notifyAdmins(interaction, t('commands.status.admin_notification', { user: formatUser(interaction.user, interaction.member), target: formatUser(targetUser), status: result.status }));
    },
};


