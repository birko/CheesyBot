import { SlashCommandBuilder, ChatInputCommandInteraction, User } from 'discord.js';
import { isAdmin } from '../utils/auth';
import config from '../config.json';
import orderService from '../services/orderService';
import { notifyAdmins } from '../utils/notify';
import { formatOrderItems } from '../utils/formatter';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('complete')
        .setDescription('Complete orders (Admin only)')
        .addStringOption(option =>
            option.setName('product')
                .setDescription('The product name or index (optional)')
                .setRequired(false))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user (optional)')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The amount to complete (optional)')
                .setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
        if (!isAdmin(interaction)) {
            await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            return;
        }

        const productInput = interaction.options.getString('product');
        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');

        // Scenario 1: No arguments -> Complete ALL orders
        if (!productInput && !targetUser && !amount) {
            const result = orderService.completeAllOrders();
            if (!result.success) {
                await interaction.reply({ content: result.error || 'Unknown error', ephemeral: true });
            } else {
                await interaction.reply(`Completed all orders for ${result.count} users.`);
                await notifyAdmins(interaction, `**Order Completed**: ${interaction.user} completed ALL orders.`);
            }
            return;
        }

        // Scenario 2: User only -> Complete ALL orders for that user
        if (targetUser && !productInput && !amount) {
            const result = orderService.completeUserOrders(targetUser.id);
            if (!result.success) {
                await interaction.reply({ content: result.error || 'Unknown error', ephemeral: true });
            } else {
                await interaction.reply(`Completed all orders for ${targetUser.username}.`);
                await notifyAdmins(interaction, `**Order Completed**: ${interaction.user} completed all orders for ${targetUser}.`);
            }
            return;
        }

        // Scenario 3: User + Product -> Complete ALL of that product for that user
        if (targetUser && productInput && !amount) {
            const result = orderService.completeProductOrders(targetUser.id, productInput);
            if (!result.success) {
                await interaction.reply({ content: result.error || 'Unknown error', ephemeral: true });
            } else {
                await interaction.reply(`Completed all ${result.name} orders for ${targetUser.username}.`);
                await notifyAdmins(interaction, `**Order Completed**: ${interaction.user} completed all ${result.name} for ${targetUser}.`);
            }
            return;
        }

        // Scenario 4: User + Product + Amount -> Complete specific amount (Original behavior)
        if (targetUser && productInput && amount) {
            if (amount <= 0) {
                await interaction.reply({ content: 'Amount must be greater than 0.', ephemeral: true });
                return;
            }

            const result = orderService.completeOrder(targetUser.id, productInput, amount);

            if (!result.success) {
                await interaction.reply({ content: result.error || 'Unknown error', ephemeral: true });
                return;
            }

            const userOrder = orderService.getUserOrders(targetUser.id);
            let remainingSummary = 'No remaining orders.\n';
            let remainingTotal = 0;

            if (userOrder && userOrder.items) {
                const formatted = formatOrderItems(userOrder.items);
                if (formatted.text) {
                    remainingSummary = formatted.text;
                    remainingTotal = formatted.total;
                }
            }

            const reply = `Completed ${amount} ${result.name} for ${targetUser.username}.\n` +
                `**Completed Value:** ${config.currency}${result.cost?.toFixed(2)}\n\n` +
                `**Remaining Orders:**\n${remainingSummary}` +
                `**Remaining Total:** ${config.currency}${remainingTotal.toFixed(2)}`;

            await interaction.reply(reply);
            await notifyAdmins(interaction, `**Order Completed**: ${interaction.user} completed ${amount} x ${result.name} for ${targetUser}.`);
            return;
        }

        // Invalid combinations
        await interaction.reply({ content: 'Invalid combination of arguments. Please check /help for usage.', ephemeral: true });
    },
};

