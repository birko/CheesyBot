const { SlashCommandBuilder } = require('discord.js');
const { notifyAdmins } = require('../utils/notify');
const orderService = require('../services/orderService');
const productService = require('../services/productService');
const { parseBulkInput } = require('../utils/parser');

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
    async execute(interaction) {
        const productInput = interaction.options.getString('product');
        const amountInput = interaction.options.getInteger('amount');
        const userId = interaction.user.id;

        // Single Order Mode
        if (amountInput !== null) {
            if (amountInput <= 0) {
                await interaction.reply({ content: 'Amount must be greater than 0.', ephemeral: true });
                return;
            }

            const result = orderService.addOrder(userId, productInput, amountInput);
            if (!result.success) {
                await interaction.reply({ content: result.error, ephemeral: true });
            } else {
                await interaction.reply(`Ordered ${result.amount} x ${result.name}.`);
                await notifyAdmins(interaction, `**New Order**: ${interaction.user} ordered ${result.amount} x ${result.name}.`);
            }
            return;
        }

        // Bulk Order Mode
        const { success, failed } = parseBulkInput(productInput, productService.getAllProducts(), 'integer');
        const ordered = [];
        const parsingFailed = [...failed];

        for (const item of success) {
            if (item.value <= 0) {
                parsingFailed.push(`${item.name} (Amount must be > 0)`);
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
        if (ordered.length > 0) reply += `**Ordered:**\n${ordered.join('\n')}\n`;
        if (parsingFailed.length > 0) reply += `**Failed:**\n${parsingFailed.join('\n')}\n`;
        if (reply === '') reply = 'No products ordered. Check format (Product:Amount, Product2:Amount2).';

        await interaction.reply(reply);

        if (ordered.length > 0) {
            await notifyAdmins(interaction, `**Bulk Order**: ${interaction.user} ordered:\n${ordered.join('\n')}`);
        }
    },
};
