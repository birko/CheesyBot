import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { isAdmin } from '../utils/auth';
import { t } from '../utils/i18n';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show available commands'),
    async execute(interaction: ChatInputCommandInteraction) {
        let reply = t('commands.help.header') + '\n';
        reply += '`/list` - List available products\n';
        reply += '`/order <product> [amount]` - Order products\n';
        reply += '`/edit <product> [amount]` - Edit your order\n';
        reply += '`/show` - Show your current orders\n';

        if (isAdmin(interaction)) {
            reply += '\n' + t('commands.help.admin_header') + '\n';
            reply += '`/add <name> [price]` - Add products\n';
            reply += '`/remove <name>` - Remove products\n';
            reply += '`/update <product> [new_price]` - Update product price\n';
            reply += '`/orders [user]` - View orders\n';
            reply += '`/complete [product] [user] [amount]` - Complete orders\n';
            reply += '`/status <user> <status>` - Update order status\n';
        }

        await interaction.reply(reply);
    },
};
