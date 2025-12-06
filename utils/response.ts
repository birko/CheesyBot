import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';

interface SendBulkResponseOptions {
    interaction: ChatInputCommandInteraction;
    added: string[];
    failed: string[];
    headerKey: string;
    failedHeaderKey: string;
    emptyKey: string;
}

export async function sendBulkResponse({
    interaction,
    added,
    failed,
    headerKey,
    failedHeaderKey,
    emptyKey
}: SendBulkResponseOptions): Promise<void> {
    let reply = '';

    if (added.length > 0) {
        reply += interaction.t(headerKey) + '\n' + added.join('\n') + '\n';
    }

    if (failed.length > 0) {
        reply += interaction.t(failedHeaderKey) + '\n' + failed.join('\n') + '\n';
    }

    if (reply === '') {
        reply = interaction.t(emptyKey);
    }

    await interaction.reply({ content: reply, flags: MessageFlags.Ephemeral });
}
