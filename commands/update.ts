import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { adminCommand } from '../utils/guards';
import { sendBulkResponse } from '../utils/response';
import config from '../config.json';
import productService from '../services/productService';
import { parseComplexBulkInput } from '../utils/parser';
import { t } from '../utils/i18n';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('update')
        .setDescription('Update the price or name of a product (Admin only)')
        .addStringOption(option =>
            option.setName('product')
                .setDescription('Product name/index OR list "Product1:Price1, Product2:Price2"')
                .setRequired(true))
        .addNumberOption(option =>
            option.setName('new_price')
                .setDescription('The new price (optional for bulk update)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('new_name')
                .setDescription('The new name (optional, single update only)')
                .setRequired(false)),
    execute: adminCommand(async (interaction: ChatInputCommandInteraction) => {
        const productInput = interaction.options.getString('product', true);
        const priceInput = interaction.options.getNumber('new_price');

        // Single Update Mode
        const newNameInput = interaction.options.getString('new_name');

        // Bulk Update Mode (also handles Single mode via this logic now)
        const { success, failed } = parseComplexBulkInput(productInput, productService.getAllProducts());
        const updated: string[] = [];
        const parsingFailed: string[] = [...failed];

        // Ensure we don't mix "Rename" arg with multiple products
        if (newNameInput && success.length > 1) {
            await interaction.reply({ content: interaction.t('commands.update.rename_multiple_error'), flags: MessageFlags.Ephemeral });
            return;
        }

        for (const item of success) {
            const updates: { newName?: string, newPrice?: number } = {};

            // Priority: Item specific > Command Arg
            if (item.newName) updates.newName = item.newName;
            else if (newNameInput) updates.newName = newNameInput;

            if (item.newPrice !== undefined) updates.newPrice = item.newPrice;
            else if (priceInput !== null) updates.newPrice = priceInput;

            // If no updates for this item, skip
            if (!updates.newName && updates.newPrice === undefined) {
                // Optionally warn? For now just skip.
                // Actually better to track as failed if no update possible?
                // Let's assume user might list items without changes erronously.
                parsingFailed.push(`${item.name} (No changes provided)`);
                continue;
            }

            const result = productService.updateProduct(item.name, updates);
            if (result.success) {
                let changeStr = item.name;
                if (result.oldName !== result.newName) {
                    changeStr += ` -> ${result.newName}`;
                }
                if (result.oldPrice !== result.newPrice) {
                    changeStr += ` (${config.currency}${result.oldPrice} -> ${config.currency}${result.newPrice})`;
                }
                updated.push(changeStr);
            } else {
                parsingFailed.push(`${item.name} (${result.error})`);
            }
        }

        await sendBulkResponse({
            interaction,
            added: updated, // We use "added" list for successes here
            failed: parsingFailed,
            headerKey: 'commands.update.updated_bulk_header',
            failedHeaderKey: 'commands.update.failed_bulk_header',
            emptyKey: 'commands.update.no_prices_updated'
            // Note: empty key text might be slightly inaccurate ("no prices updated") if only names changed, 
            // but acceptable for now or can add new key.
        });
    }),
};


