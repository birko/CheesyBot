import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { isAdmin } from '../utils/auth';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show available commands'),
    async execute(interaction: ChatInputCommandInteraction) {
        let reply = interaction.t('commands.help.header') + '\n';
        reply += `\`/list\` - ${interaction.t('commands.help.descriptions.list')}\n`;
        reply += `\`/order <product> [amount]\` - ${interaction.t('commands.help.descriptions.order')}\n`;
        reply += `\`/edit <product> [amount]\` - ${interaction.t('commands.help.descriptions.edit')}\n`;
        reply += `\`/show\` - ${interaction.t('commands.help.descriptions.show')}\n`;
        reply += `\`/language <code>\` - ${interaction.t('commands.help.descriptions.language')}\n`;

        if (isAdmin(interaction)) {
            reply += '\n' + interaction.t('commands.help.admin_header') + '\n';
            reply += `\`/add <name> [price]\` - ${interaction.t('commands.help.descriptions.add')}\n`;
            reply += `\`/remove <name>\` - ${interaction.t('commands.help.descriptions.remove')}\n`;
            reply += `\`/update <product> [new_price]\` - ${interaction.t('commands.help.descriptions.update')}\n`;
            reply += `\`/orders [user]\` - ${interaction.t('commands.help.descriptions.orders')}\n`;
            reply += `\`/complete [product] [user] [amount]\` - ${interaction.t('commands.help.descriptions.complete')}\n`;
            reply += `\`/status <user> <status>\` - ${interaction.t('commands.help.descriptions.status')}\n`;
        }

        reply += '\n' + interaction.t('commands.help.bulk_example');

        await interaction.reply({ content: reply, ephemeral: true });
    },
};
