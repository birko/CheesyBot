import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { isAdmin } from '../utils/auth';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('List available commands'),
    async execute(interaction: ChatInputCommandInteraction) {
        const isUserAdmin = isAdmin(interaction);

        let helpText = '**Available Commands:**\n\n';

        helpText += '**User Commands:**\n';
        helpText += '`/list`: List available products and prices\n';
        helpText += '`/order <product> [amount]`: Order products (by name or index). Supports bulk.\n';
        helpText += '`/edit <product> [amount]`: Set exact order total (by name or index). Supports bulk.\n';
        helpText += '`/show`: Show your current orders and total\n';
        helpText += '`/help`: Show this help message\n';

        if (isUserAdmin) {
            helpText += '\n**Admin Commands:**\n';
            helpText += '`/orders [user]`: View orders (all or specific user)\n';
            helpText += '`/add <name> [price]`: Add products. Supports bulk.\n';
            helpText += '`/remove <name>`: Remove products (by name or index). Supports bulk.\n';
            helpText += '`/update <product> [new_price]`: Update prices (by name or index). Supports bulk.\n';
            helpText += '`/complete [product] [user] [amount]`: Complete orders. Supports bulk/all modes.\n';
            helpText += '`/status <user> <status>`: Update order status (New, Processing, Ready, Completed).\n';
        }

        await interaction.reply(helpText);
    },
};

