import { ChatInputCommandInteraction, User, MessageFlags } from 'discord.js';
import orderService from '../services/orderService';

export async function resolveTargetUser(interaction: ChatInputCommandInteraction): Promise<User | null> {
    const userOption = interaction.options.getUser('user');
    const indexOption = interaction.options.getInteger('index');

    if (userOption) return userOption;

    if (indexOption) {
        const userId = orderService.getUserByIndex(indexOption);
        if (!userId) {
            await interaction.reply({
                content: interaction.t('commands.status.invalid_index', { index: indexOption }),
                flags: MessageFlags.Ephemeral
            });
            return null;
        }

        try {
            return await interaction.client.users.fetch(userId);
        } catch (error) {
            console.error(`Failed to fetch user ${userId}:`, error);
            await interaction.reply({
                content: interaction.t('common.unknown_error'),
                flags: MessageFlags.Ephemeral
            });
            return null;
        }
    }

    return null;
}
