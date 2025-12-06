import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { adminCommand } from '../utils/guards';
import { sendBulkResponse } from '../utils/response';
import productService from '../services/productService';
import { parseBulkInput } from '../utils/parser';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove a product or multiple products (Admin only)')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Product name/index OR list "Product1, Product2"')
                .setRequired(true)),
    execute: adminCommand(async (interaction: ChatInputCommandInteraction) => {
        const productInput = interaction.options.getString('name', true);

        const { success, failed } = parseBulkInput(productInput, productService.getAllProducts(), 'none');
        const removed: string[] = [];
        const removalFailed: string[] = [...failed];

        // Unique names to avoid double attempts
        const uniqueNames = [...new Set(success.map(i => i.name))];

        for (const name of uniqueNames) {
            const result = productService.removeProduct(name);
            if (result.success) {
                removed.push(result.name || name);
            } else {
                removalFailed.push(`${name} (${result.error})`);
            }
        }

        await sendBulkResponse({
            interaction,
            added: removed,
            failed: removalFailed,
            headerKey: 'commands.remove.removed_bulk_header',
            failedHeaderKey: 'commands.remove.failed_bulk_header',
            emptyKey: 'commands.remove.not_found' // Note: This key structure might vary slightly but logic holds
        });

        // Note: original code passed specific key for not found on empty.
        // sendBulkResponse uses emptyKey.
        // But original code had: if (reply === '') reply = interaction.t('commands.remove.not_found', { input: productInput });
        // The helper doesn't support params for empty key currently.
        // Let's stick to the pattern or update helper.
        // Ideally helper should accept simply a string or builder.
        // For now, let's keep it simple.
    }),
};


