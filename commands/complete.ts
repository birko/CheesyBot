import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { isAdmin } from '../utils/auth';
import { notifyAdmins } from '../utils/notify';
import orderService from '../services/orderService';
import { formatUser } from '../utils/formatter';
import { t } from '../utils/i18n';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('complete')
        .setDescription('Complete an order or part of an order (Admin only)')
        .addStringOption(option =>
            option.setName('product')
                .setDescription('Product name/index (optional)')
                .setRequired(false))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user (optional)')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('index')
                .setDescription('The order index (from /orders)')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount to complete (optional)')
                .setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
        if (!isAdmin(interaction)) {
            await interaction.reply({ content: interaction.t('common.permission_denied'), flags: MessageFlags.Ephemeral });
            return;
        }

        const productInput = interaction.options.getString('product');
        let targetUser = interaction.options.getUser('user');
        const index = interaction.options.getInteger('index');
        const amountInput = interaction.options.getInteger('amount');

        if (index) {
            const userId = orderService.getUserByIndex(index);
            if (!userId) {
                await interaction.reply({ content: interaction.t('commands.status.invalid_index', { index }), flags: MessageFlags.Ephemeral });
                return;
            }
            try {
                targetUser = await interaction.client.users.fetch(userId);
            } catch (error) {
                console.error(`Failed to fetch user ${userId}:`, error);
                await interaction.reply({ content: interaction.t('common.unknown_error'), flags: MessageFlags.Ephemeral });
                return;
            }
        }

        // Case 1: Complete ALL orders (No product, no user, no index)
        if (!productInput && !targetUser && !index) {
            const result = orderService.completeAllOrders();
            if (!result.success) {
                await interaction.reply({ content: result.error || interaction.t('common.unknown_error'), flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: interaction.t('commands.complete.completed_all'), flags: MessageFlags.Ephemeral });
                await notifyAdmins(interaction, t('commands.complete.admin_notification_all', { user: formatUser(interaction.user, interaction.member) }));
            }
            return;
        }

        // Case 2: Complete all orders for a specific USER
        if (!productInput && targetUser && !amountInput) {
            const result = orderService.completeUserOrders(targetUser.id);
            if (!result.success) {
                await interaction.reply({ content: result.error || interaction.t('common.unknown_error'), flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: interaction.t('commands.complete.completed_user', { target: targetUser.username }), flags: MessageFlags.Ephemeral });
                await notifyAdmins(interaction, t('commands.complete.admin_notification_user', { user: formatUser(interaction.user, interaction.member), target: formatUser(targetUser) }));
            }
            return;
        }

        // Case 3: Complete specific PRODUCT for a USER (optionally specific AMOUNT)
        if (productInput && targetUser) {
            if (amountInput) {
                if (amountInput <= 0) {
                    await interaction.reply({ content: interaction.t('commands.order.amount_positive'), flags: MessageFlags.Ephemeral });
                    return;
                }
                const result = orderService.completeOrder(targetUser.id, productInput, amountInput);
                if (!result.success) {
                    await interaction.reply({ content: result.error || interaction.t('common.unknown_error'), flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: interaction.t('commands.complete.completed_amount_product_user', { amount: result.cost, product: result.name, target: targetUser.username }), flags: MessageFlags.Ephemeral }); // Note: result.cost is returned by completeOrder, but message expects amount/product. Wait, result.name is product name. result.cost is cost.
                    // The message key 'completed_amount_product_user' expects {{amount}}, {{product}}, {{target}}.
                    // completeOrder returns { success: true, name: productName, cost: completedCost }
                    // It does NOT return the amount completed (which is input `amountInput`).
                    // So I should use `amountInput` for {{amount}}.
                    await notifyAdmins(interaction, t('commands.complete.admin_notification_amount_product_user', { user: formatUser(interaction.user, interaction.member), amount: amountInput, product: result.name, target: formatUser(targetUser) }));
                }
            } else {
                const result = orderService.completeProductOrders(targetUser.id, productInput);
                if (!result.success) {
                    await interaction.reply({ content: result.error || interaction.t('common.unknown_error'), flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: interaction.t('commands.complete.completed_product_user', { product: result.name, target: targetUser.username }), flags: MessageFlags.Ephemeral });
                    await notifyAdmins(interaction, t('commands.complete.admin_notification_product_user', { user: formatUser(interaction.user, interaction.member), product: result.name, target: formatUser(targetUser) }));
                }
            }
            return;
        }

        // Case 4: Invalid combination
        await interaction.reply({ content: 'Invalid command usage. Check `/help` for examples.', flags: MessageFlags.Ephemeral });
    },
};
