const { SlashCommandBuilder } = require('discord.js');
const config = require('../config.json');
const productService = require('../services/productService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list')
        .setDescription('List all available products'),
    async execute(interaction) {
        const products = productService.getAllProducts();

        if (Object.keys(products).length === 0) {
            await interaction.reply('No products available.');
            return;
        }

        let reply = '**Available Products:**\n';
        let index = 1;
        for (const [name, price] of Object.entries(products)) {
            reply += `${index}. **${name}** - ${config.currency}${price}\n`;
            index++;
        }

        await interaction.reply(reply);
    },
};
