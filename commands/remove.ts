import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { isAdmin } from '../utils/auth';
import productService from '../services/productService';
import { parseBulkInput } from '../utils/parser';
import { t } from '../utils/i18n';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove a product or multiple products (Admin only)')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Product name/index OR list "Product1, Product2"')
                .setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
        if (!isAdmin(interaction)) {
            await interaction.reply({ content: interaction.t('common.permission_denied'), flags: MessageFlags.Ephemeral });
            return;
        }

        const productInput = interaction.options.getString('name', true);

        // Try single removal first (to handle names with commas if we supported them, but mainly for simplicity)
        // Actually, let's just use the parser for everything to be consistent.
        // But parser splits by comma. If a user types "Apple", parser returns ["Apple"].

        const { success, failed } = parseBulkInput(productInput, productService.getAllProducts(), 'none');

        // We need to resolve names first to avoid index shifting issues (handled by Service? No, Service handles one by one)
        // Wait, if we use indices, removing one shifts the others.
        // The Parser resolves names immediately using the current state.
        // So `success` contains resolved names.
        // If we have [Apple, Banana] (from indices 1, 2), we can safely remove them by name.
        // The parser logic I wrote calls `resolveProduct`.

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

        let reply = '';
        if (removed.length > 0) reply += interaction.t('commands.remove.removed_bulk_header') + ' ' + removed.join(', ') + '\n';
        if (removalFailed.length > 0) reply += interaction.t('commands.remove.failed_bulk_header') + ' ' + removalFailed.join(', ') + '\n';
        if (reply === '') reply = interaction.t('commands.remove.not_found', { input: productInput });

        await interaction.reply({ content: reply, flags: MessageFlags.Ephemeral });
    },
};


