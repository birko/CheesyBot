const { SlashCommandBuilder } = require('discord.js');
const { isAdmin } = require('../utils/auth');
const config = require('../config.json');
const productService = require('../services/productService');
const { parseBulkInput } = require('../utils/parser');

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
    async execute(interaction) {
        if (!isAdmin(interaction)) {
            await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            return;
        }

        const productInput = interaction.options.getString('product');
        const priceInput = interaction.options.getNumber('new_price');

        // Single Update Mode
        if (priceInput !== null) {
            const result = productService.updatePrice(productInput, priceInput);
            if (!result.success) {
                await interaction.reply({ content: result.error, ephemeral: true });
            } else {
                await interaction.reply(`Updated price of "${result.name}" from ${config.currency}${result.oldPrice} to ${config.currency}${result.newPrice}.`);
            }
            return;
        }

        // Bulk Update Mode
        const { success, failed } = parseBulkInput(productInput, productService.getAllProducts(), 'number');
        const updated = [];
        const parsingFailed = [...failed];

        for (const item of success) {
            const result = productService.updatePrice(item.name, item.value);
            if (result.success) {
                updated.push(`${result.name}: ${config.currency}${result.oldPrice} -> ${config.currency}${result.newPrice}`);
            } else {
                parsingFailed.push(`${item.name} (${result.error})`);
            }
        }

        let reply = '';
        if (updated.length > 0) reply += `**Updated Prices:**\n${updated.join('\n')}\n`;
        if (parsingFailed.length > 0) reply += `**Failed:**\n${parsingFailed.join('\n')}\n`;
        if (reply === '') reply = 'No prices updated. Check format (Product:Price, Product2:Price2).';

        await interaction.reply(reply);
    },
};
