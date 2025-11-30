import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { notifyAdmins } from '../utils/notify';
import orderService from '../services/orderService';
import productService from '../services/productService';
import { parseBulkInput } from '../utils/parser';
import { t } from '../utils/i18n';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('edit')
        .setDescription('Edit the amount of a product in your order')
        .addStringOption(option =>
            option.setName('product')
                .setDescription('Product name OR list "Product1:Amount1, Product2:Amount2"')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The new amount (optional for bulk edit)')
                .setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
        const productInput = interaction.options.getString('product', true);
        const amountInput = interaction.options.getInteger('amount');
        const userId = interaction.user.id;

        // Single Edit Mode
        if (amountInput !== null) {
            if (amountInput < 0) {
                await interaction.reply({ content: interaction.t('commands.edit.amount_positive'), ephemeral: true });
                return;
            }

            const result = orderService.editOrder(userId, productInput, amountInput);
            if (!result.success) {
                await interaction.reply({ content: result.error || interaction.t('common.unknown_error'), ephemeral: true });
            } else {
                await interaction.reply(interaction.t('commands.edit.edited_single', { name: result.name, amount: result.amount }));
                if (result.diff !== 0) {
                    await notifyAdmins(interaction, t('commands.edit.admin_notification_single', { user: interaction.user, name: result.name, amount: result.amount }));
                }
            }
            return;
        }

        // Bulk Edit Mode
        const { success, failed } = parseBulkInput(productInput, productService.getAllProducts(), 'integer');
        const edited: string[] = [];
        const parsingFailed: string[] = [...failed];

        for (const item of success) {
            if (item.value === null || item.value < 0) {
                parsingFailed.push(`${item.name} (${interaction.t('commands.edit.amount_positive')})`);
                continue;
            }
            const result = orderService.editOrder(userId, item.name, item.value);
            if (result.success) {
                edited.push(`${result.name}: ${result.amount}`);
            } else {
                parsingFailed.push(`${item.name} (${result.error})`);
            }
        }

        let reply = '';
        if (edited.length > 0) reply += interaction.t('commands.edit.edited_bulk_header') + '\n' + edited.join('\n') + '\n';
        if (parsingFailed.length > 0) reply += interaction.t('commands.edit.failed_bulk_header') + '\n' + parsingFailed.join('\n') + '\n';
        if (reply === '') reply = interaction.t('commands.edit.no_products_edited');

        await interaction.reply(reply);

        if (edited.length > 0) {
            await notifyAdmins(interaction, t('commands.edit.admin_notification_bulk', { user: interaction.user, updates: edited.join('\n') }));
        }
    },
};
