import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { isAdmin } from '../utils/auth';
import { t } from '../utils/i18n';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show available commands'),
    async execute(interaction: ChatInputCommandInteraction) {
        let reply = t('commands.help.header') + '\n';
        reply += '`/list` - ' + t('commands.help.descriptions.list') + '\n';
        reply += '`/order <product> [amount]` - ' + t('commands.help.descriptions.order') + '\n';
        reply += '`/edit <product> [amount]` - ' + t('commands.help.descriptions.edit') + '\n';
        reply += '`/show` - ' + t('commands.help.descriptions.show') + '\n';

        if (isAdmin(interaction)) {
            reply += '\n' + t('commands.help.admin_header') + '\n';
            reply += '`/add <name> [price]` - ' + t('commands.help.descriptions.add') + '\n';
            reply += '`/remove <name>` - ' + t('commands.help.descriptions.remove') + '\n';
            reply += '`/update <product> [new_price]` - ' + t('commands.help.descriptions.update') + '\n';
            reply += '`/orders [user]` - ' + t('commands.help.descriptions.orders') + '\n';
            reply += '`/complete [product] [user] [amount]` - ' + t('commands.help.descriptions.complete') + '\n';
            reply += '`/status <user> <status>` - ' + t('commands.help.descriptions.status') + '\n';
        }

        await interaction.reply(reply);
    },
};
