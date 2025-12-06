import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { isAdmin } from './auth';

type ExecuteFunction = (interaction: ChatInputCommandInteraction) => Promise<void>;

export function adminCommand(execute: ExecuteFunction): ExecuteFunction {
    return async (interaction: ChatInputCommandInteraction) => {
        if (!isAdmin(interaction)) {
            await interaction.reply({
                content: interaction.t('common.permission_denied'),
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        await execute(interaction);
    };
}
