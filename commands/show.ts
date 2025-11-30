import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import orderService from '../services/orderService';
import { formatOrder } from '../utils/formatter';


module.exports = {
    data: new SlashCommandBuilder()
        .setName('show')
        .setDescription('Show your current orders'),
    async execute(interaction: ChatInputCommandInteraction) {
        const userId = interaction.user.id;
        const userOrder = orderService.getUserOrders(userId);

        if (!userOrder || !userOrder.items || Object.keys(userOrder.items).length === 0) {
            await interaction.reply(interaction.t('commands.show.no_active_orders'));
            return;
        }

        const reply = formatOrder(userOrder, interaction.t('commands.show.header'), interaction.t);
        await interaction.reply(reply);
    },
};


