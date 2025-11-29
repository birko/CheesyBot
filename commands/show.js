const { SlashCommandBuilder } = require('discord.js');
const orderService = require('../services/orderService');
const { formatOrder } = require('../utils/formatter');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('show')
        .setDescription('Show your current orders'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const userOrder = orderService.getUserOrders(userId);

        if (!userOrder || !userOrder.items || Object.keys(userOrder.items).length === 0) {
            await interaction.reply('You have no active orders.');
            return;
        }

        const reply = formatOrder(userOrder, 'Your Orders');
        await interaction.reply(reply);
    },
};
