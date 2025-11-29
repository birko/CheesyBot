import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { notifyAdmins } from '../utils/notify';
import orderService from '../services/orderService';
import productService from '../services/productService';
import { parseBulkInput } from '../utils/parser';
import config from '../config.json';
import { t } from '../utils/i18n';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('order')
        .setDescription('Order a product or multiple products')
        .addStringOption(option =>
            option.setName('product')
                .setDescription('Product name OR list "Product1:Amount1, Product2:Amount2"')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The amount to order (optional for bulk order)')
                .setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
        const productInput = interaction.options.getString('product', true);
        const amountInput = interaction.options.getInteger('amount');
        const userId = interaction.user.id;

        // Single Order Mode
        if (amountInput !== null) {
            if (amountInput <= 0) {
                await interaction.reply({ content: t('commands.order.amount_positive'), ephemeral: true });
                return;
            }

            const result = orderService.addOrder(userId, productInput, amountInput);
            if (!result.success) {
                await interaction.reply({ content: result.error || t('common.unknown_error'), ephemeral: true });
            } else {
                await interaction.reply(t('commands.order.ordered_single', { amount: result.amount, name: result.name }));
                await notifyAdmins(interaction, t('commands.order.admin_notification_single', { user: interaction.user, amount: result.amount, name: result.name }));
            }
            return;
        }

        // Bulk Order Mode
        const { success, failed } = parseBulkInput(productInput, productService.getAllProducts(), 'integer');
        const ordered: string[] = [];
        const parsingFailed: string[] = [...failed];

        for (const item of success) {
            if (item.value === null || item.value <= 0) {
                parsingFailed.push(`${item.name} (${t('commands.order.amount_positive')})`);
                continue;
            }
            const result = orderService.addOrder(userId, item.name, item.value);
            if (result.success) {
                ordered.push(`${result.amount} x ${result.name}`);
            } else {
                parsingFailed.push(`${item.name} (${result.error})`);
            }
        }

        let reply = '';
        if (ordered.length > 0) reply += t('commands.order.ordered_bulk_header') + '\n' + ordered.join('\n') + '\n';
        if (parsingFailed.length > 0) reply += t('commands.order.failed_bulk_header') + '\n' + parsingFailed.join('\n') + '\n';
        if (reply === '') reply = t('commands.order.no_products_ordered');

        await interaction.reply(reply);

        if (ordered.length > 0) {
            await notifyAdmins(interaction, t('commands.order.admin_notification_bulk', { user: interaction.user, orders: ordered.join('\n') }));
        }
    },
};


