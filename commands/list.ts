import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import config from '../config.json';
import productService from '../services/productService';


module.exports = {
    data: new SlashCommandBuilder()
        .setName('list')
        .setDescription('List all available products'),
    async execute(interaction: ChatInputCommandInteraction) {
        const products = productService.getAllProducts();

        if (Object.keys(products).length === 0) {
            await interaction.reply(interaction.t('commands.list.no_products'));
            return;
        }

        let reply = interaction.t('commands.list.header') + '\n';
        let index = 1;
        for (const [name, price] of Object.entries(products)) {
            reply += interaction.t('commands.list.item_format', { index, name, currency: config.currency, price }) + '\n';
            index++;
        }

        await interaction.reply(reply);
    },
};


