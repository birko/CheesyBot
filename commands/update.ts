import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { isAdmin } from '../utils/auth';
import config from '../config.json';
import productService from '../services/productService';
import { parseBulkInput } from '../utils/parser';
import { t } from '../utils/i18n';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('update')
        .setDescription('Update the price of a product or multiple products (Admin only)')
        .addStringOption(option =>
            option.setName('product')
                .setDescription('Product name OR list "Product1:Price1, Product2:Price2"')
                .setRequired(true))
        .addNumberOption(option =>
            option.setName('new_price')
                .setDescription('The new price (optional for bulk update)')
                .setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
        if (!isAdmin(interaction)) {
            await interaction.reply({ content: interaction.t('common.permission_denied'), ephemeral: true });
            return;
        }

        const productInput = interaction.options.getString('product', true);
        const priceInput = interaction.options.getNumber('new_price');

        // Single Update Mode
        if (priceInput !== null) {
            const result = productService.updatePrice(productInput, priceInput);
            if (!result.success) {
                await interaction.reply({ content: result.error || interaction.t('common.unknown_error'), ephemeral: true });
            } else {
                await interaction.reply(interaction.t('commands.update.updated_single', { name: result.name, currency: config.currency, oldPrice: result.oldPrice, newPrice: result.newPrice }));
            }
            return;
        }

        // Bulk Update Mode
        const { success, failed } = parseBulkInput(productInput, productService.getAllProducts(), 'number');
        const updated: string[] = [];
        const parsingFailed: string[] = [...failed];

        for (const item of success) {
            if (item.value === null) {
                parsingFailed.push(`${item.name} (No price provided)`);
                continue;
            }
            const result = productService.updatePrice(item.name, item.value);
            if (result.success) {
                updated.push(`${result.name}: ${config.currency}${result.oldPrice} -> ${config.currency}${result.newPrice}`);
            } else {
                parsingFailed.push(`${item.name} (${result.error})`);
            }
        }

        let reply = '';
        if (updated.length > 0) reply += interaction.t('commands.update.updated_bulk_header') + '\n' + updated.join('\n') + '\n';
        if (parsingFailed.length > 0) reply += interaction.t('commands.update.failed_bulk_header') + '\n' + parsingFailed.join('\n') + '\n';
        if (reply === '') reply = interaction.t('commands.update.no_prices_updated');

        await interaction.reply(reply);
    },
};


