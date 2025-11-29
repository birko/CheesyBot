import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import orderService from '../services/orderService';
import { formatOrder } from '../utils/formatter';
import { t } from '../utils/i18n';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('show')
        .setDescription('Show your current orders'),
    async execute(interaction: ChatInputCommandInteraction) {
        const userId = interaction.user.id;
        const userOrder = orderService.getUserOrders(userId);

        if (!userOrder || !userOrder.items || Object.keys(userOrder.items).length === 0) {
            await interaction.reply(t('commands.show.no_active_orders'));
            return;
        }

        const reply = formatOrder(userOrder, t('commands.show.header'));
        await interaction.reply(reply);
    },
};


