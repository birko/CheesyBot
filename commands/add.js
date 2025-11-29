const { SlashCommandBuilder } = require('discord.js');
const { isAdmin } = require('../utils/auth');
const config = require('../config.json');
const productService = require('../services/productService');
const { parseBulkInput } = require('../utils/parser');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add')
        .setDescription('Add a product or multiple products (Admin only)')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Product name OR list "Name:Price, Name2:Price2"')
                .setRequired(true))
        .addNumberOption(option =>
            option.setName('price')
                .setDescription('The unit price (optional for bulk add)')
                .setRequired(false)),
    async execute(interaction) {
        if (!isAdmin(interaction)) {
            await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            return;
        }

        const nameInput = interaction.options.getString('name');
        const priceInput = interaction.options.getNumber('price');

        // Single Product Mode
        if (priceInput !== null) {
            const result = productService.addProduct(nameInput, priceInput);
            if (!result.success) {
                await interaction.reply({ content: result.error, ephemeral: true });
            } else {
                await interaction.reply(`Product "${result.name}" added with price ${config.currency}${result.price}.`);
            }
            return;
        }

        // Bulk Mode
        const { success, failed } = parseBulkInput(nameInput, productService.getAllProducts(), 'number');
        const added = [];
        const parsingFailed = [...failed];

        for (const item of success) {
            const result = productService.addProduct(item.name, item.value);
            if (result.success) {
                added.push(`${result.name} (${config.currency}${result.price})`);
            } else {
                parsingFailed.push(`${item.name} (${result.error})`);
            }
        }

        let reply = '';
        if (added.length > 0) reply += `**Added ${added.length} products:**\n${added.join('\n')}\n`;
        if (parsingFailed.length > 0) reply += `**Failed to add:**\n${parsingFailed.join('\n')}\n`;
        if (reply === '') reply = 'No products were added. Check your format (Name:Price, Name2:Price2).';

        await interaction.reply(reply);
    },
};
