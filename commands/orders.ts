import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { adminCommand } from '../utils/guards';
import config from '../config.json';
import orderService from '../services/orderService';
import { formatOrder } from '../utils/formatter';
import { t } from '../utils/i18n';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('orders')
        .setDescription('View all orders or orders for a specific user (Admin only)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to view orders for')
                .setRequired(false)),
    execute: adminCommand(async (interaction: ChatInputCommandInteraction) => {

        const targetUser = interaction.options.getUser('user');
        const allOrders = orderService.getAllOrders();

        if (targetUser) {
            const userOrder = allOrders[targetUser.id];
            if (!userOrder || !userOrder.items || Object.keys(userOrder.items).length === 0) {
                await interaction.reply({ content: interaction.t('commands.orders.no_active_user', { username: targetUser.username }), flags: MessageFlags.Ephemeral });
                return;
            }

            const reply = formatOrder(userOrder, interaction.t('commands.orders.header_user', { username: targetUser.username }), interaction.t);
            await interaction.reply({ content: reply, flags: MessageFlags.Ephemeral });
        } else {
            const sortedOrders = orderService.getSortedOrders();

            if (sortedOrders.length === 0) {
                await interaction.reply({ content: interaction.t('commands.orders.no_active_global'), flags: MessageFlags.Ephemeral });
                return;
            }

            let reply = interaction.t('commands.orders.header_global') + '\n';
            let globalTotal = 0;
            let index = 1;

            for (const [userId, userOrder] of sortedOrders) {
                if (!userOrder.items) continue;

                let userTotal = 0;
                let userLine = `**${index}.** <@${userId}> [${userOrder.status}]: `;
                const products: string[] = [];

                for (const [product, batches] of Object.entries(userOrder.items)) {
                    let productTotal = 0;
                    let productQuantity = 0;

                    // @ts-ignore
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
                index++;
            }

            reply += '\n' + interaction.t('commands.orders.grand_total', { currency: config.currency, total: globalTotal.toFixed(2) });
            await interaction.reply({ content: reply, flags: MessageFlags.Ephemeral });
        }
    }),
};


