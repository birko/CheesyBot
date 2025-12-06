import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { setUserLanguage } from '../utils/storage';
import { t } from '../utils/i18n';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('language')
        .setDescription('Set your preferred language')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('Language code (en, de, sk, cs)')
                .setRequired(true)
                .addChoices(
                    { name: 'English', value: 'en' },
                    { name: 'Deutsch', value: 'de' },
                    { name: 'Slovenčina', value: 'sk' },
                    { name: 'Čeština', value: 'cs' }
                )),
    async execute(interaction: ChatInputCommandInteraction) {
        const language = interaction.options.getString('code', true);
        setUserLanguage(interaction.user.id, language);

        // Reply in the new language
        // We can't use the injected interaction.t yet because it was initialized before the change
        // So we manually fetch the fixed translator for the new language
        const i18next = require('../utils/i18n').default;
        const localT = i18next.getFixedT(language);

        await interaction.reply({ content: localT('common.language_set', { language }), flags: MessageFlags.Ephemeral });
    },
};
