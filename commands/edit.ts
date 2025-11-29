import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { notifyAdmins } from '../utils/notify';
import orderService from '../services/orderService';
import productService from '../services/productService';
import { parseBulkInput } from '../utils/parser';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('edit')
        .setDescription('Set the total quantity of a product in your order')
        .addStringOption(option =>
            option.setName('product')
                .setDescription('Product name OR list "Product1:Amount1, Product2:Amount2"')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The new total amount (optional for bulk edit)')
                .setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
        const productInput = interaction.options.getString('product', true);
        const amountInput = interaction.options.getInteger('amount');
        const userId = interaction.user.id;

        // Single Edit Mode
        if (amountInput !== null) {
            const result = orderService.editOrder(userId, productInput, amountInput);
            if (!result.success) {
                await interaction.reply({ content: result.error || 'Unknown error', ephemeral: true });
                return;
            }

            let msg = '';
            if (result.action === 'unchanged') msg = `Order for ${result.name} is already ${result.quantity}.`;
            else if (result.action === 'increased') msg = `Increased ${result.name} order by ${result.diff} to total ${result.quantity}.`;
            else msg = `Decreased ${result.name} order by ${Math.abs(result.diff || 0)} to total ${result.quantity}.`;

            await interaction.reply(msg);

            if (result.action !== 'unchanged') {
                await notifyAdmins(interaction, `**Order Updated**: <@${userId}> set ${result.name} to ${result.quantity} (${result.action}).`);
            }
            return;
        }

        // Bulk Edit Mode
        const { success, failed } = parseBulkInput(productInput, productService.getAllProducts(), 'integer');
        const updates: string[] = [];
        const parsingFailed: string[] = [...failed];

        for (const item of success) {
            if (item.value === null) {
                parsingFailed.push(`${item.name} (No amount provided)`);
                continue;
            }
            const result = orderService.editOrder(userId, item.name, item.value);
            if (result.success) {
                if (result.action !== 'unchanged') {
                    updates.push(`${result.name}: ${result.quantity} (${result.action})`);
                }
            } else {
                parsingFailed.push(`${item.name} (${result.error})`);
            }
        }

        let reply = '';
        if (updates.length > 0) reply += `**Updated Orders:**\n${updates.join('\n')}\n`;
        if (parsingFailed.length > 0) reply += `**Failed:**\n${parsingFailed.join('\n')}\n`;
        if (reply === '') reply = 'No orders changed.';

        await interaction.reply(reply);

        if (updates.length > 0) {
            await notifyAdmins(interaction, `**Bulk Order Update**: <@${userId}> updated:\n${updates.join('\n')}`);
        }
    },
};

