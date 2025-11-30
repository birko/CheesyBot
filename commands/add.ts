import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { isAdmin } from '../utils/auth';
import config from '../config.json';
import productService from '../services/productService';
import { parseBulkInput } from '../utils/parser';
import { t } from '../utils/i18n';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add')
        .setDescription('Add a new product or multiple products (Admin only)')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Product name OR list "Name:Price, Name2:Price2"')
                .setRequired(true))
        .addNumberOption(option =>
            option.setName('price')
                .setDescription('The price of the product (optional for bulk add)')
                .setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
        if (!isAdmin(interaction)) {
            await interaction.reply({ content: interaction.t('common.permission_denied'), ephemeral: true });
            return;
        }

        const nameInput = interaction.options.getString('name', true);
        const priceInput = interaction.options.getNumber('price');

        // Single Add Mode
        if (priceInput !== null) {
            const result = productService.addProduct(nameInput, priceInput);
            if (!result.success) {
                await interaction.reply({ content: result.error || interaction.t('common.unknown_error'), ephemeral: true });
            } else {
                await interaction.reply(interaction.t('commands.add.added_single', { name: result.name, currency: config.currency, price: result.price }));
            }
            return;
        }

        // Bulk Add Mode
        const { success, failed } = parseBulkInput(nameInput, productService.getAllProducts(), 'number');
        const added: string[] = [];
        const parsingFailed: string[] = [...failed];

        for (const item of success) {
            if (item.value === null) {
                parsingFailed.push(`${item.name} (No price provided)`);
                continue;
            }
            const result = productService.addProduct(item.name, item.value);
            if (result.success) {
                added.push(`${result.name}: ${config.currency}${result.price}`);
            } else {
                parsingFailed.push(`${item.name} (${result.error})`);
            }
        }

        let reply = '';
        if (added.length > 0) reply += interaction.t('commands.add.added_bulk_header') + '\n' + added.join('\n') + '\n';
        if (parsingFailed.length > 0) reply += interaction.t('commands.add.failed_bulk_header') + '\n' + parsingFailed.join('\n') + '\n';
        if (reply === '') reply = interaction.t('commands.add.no_products_added');

        await interaction.reply(reply);
    },
};
