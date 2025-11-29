import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { isAdmin } from '../utils/auth';
import config from '../config.json';
import orderService from '../services/orderService';
import { formatOrder } from '../utils/formatter';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('orders')
        .setDescription('View all orders or orders for a specific user (Admin only)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to view orders for')
                .setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
        if (!isAdmin(interaction)) {
            await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            return;
        }

        const targetUser = interaction.options.getUser('user');
        const allOrders = orderService.getAllOrders();

        if (targetUser) {
            const userOrder = allOrders[targetUser.id];
            if (!userOrder || !userOrder.items || Object.keys(userOrder.items).length === 0) {
                await interaction.reply(`User ${targetUser.username} has no active orders.`);
                return;
            }

            const reply = formatOrder(userOrder, `Orders for ${targetUser.username}`);
            await interaction.reply(reply);
        } else {
            if (Object.keys(allOrders).length === 0) {
                await interaction.reply('No active orders found.');
                return;
            }

            let reply = '**All Orders:**\n';
            let globalTotal = 0;

            for (const [userId, userOrder] of Object.entries(allOrders)) {
                if (!userOrder.items) continue;

                let userTotal = 0;
                let userLine = `<@${userId}> [${userOrder.status}]: `;
                const products: string[] = [];

                for (const [product, batches] of Object.entries(userOrder.items)) {
                    let productTotal = 0;
                    let productQuantity = 0;

                    for (const batch of batches) {
                        productTotal += batch.price * batch.quantity;
                        productQuantity += batch.quantity;
                    }
                    userTotal += productTotal;
                    products.push(`${product} x${productQuantity}`);
                }

                globalTotal += userTotal;
                userLine += products.join(', ') + ` (**${config.currency}${userTotal.toFixed(2)}**)`;
                reply += userLine + '\n';
            }

            reply += `\n**Grand Total:** ${config.currency}${globalTotal.toFixed(2)}`;
            await interaction.reply(reply);
        }
    },
};

