import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { adminCommand } from '../utils/guards';
import { sendBulkResponse } from '../utils/response';
import config from '../config.json';
import productService from '../services/productService';
import { parseBulkInput } from '../utils/parser';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add')
        .setDescription('Add a new product or multiple products (Admin only)')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Product name/index OR list "Name:Price, Name2:Price2"')
                .setRequired(true))
        .addNumberOption(option =>
            option.setName('price')
                .setDescription('The price of the product (optional for bulk add)')
                .setRequired(false)),
    execute: adminCommand(async (interaction: ChatInputCommandInteraction) => {
        const nameInput = interaction.options.getString('name', true);
        const priceInput = interaction.options.getNumber('price');

        // Single Add Mode
        if (priceInput !== null) {
            const result = productService.addProduct(nameInput, priceInput);
            if (!result.success) {
                await interaction.reply({ content: result.error || interaction.t('common.unknown_error'), flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: interaction.t('commands.add.added_single', { name: result.name, currency: config.currency, price: result.price }), flags: MessageFlags.Ephemeral });
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

        await sendBulkResponse({
            interaction,
            added,
            failed: parsingFailed,
            headerKey: 'commands.add.added_bulk_header',
            failedHeaderKey: 'commands.add.failed_bulk_header',
            emptyKey: 'commands.add.no_products_added'
        });
    }),
};
