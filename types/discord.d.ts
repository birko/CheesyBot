import { Collection, CacheType } from 'discord.js';

declare module 'discord.js' {
    interface Client {
        commands: Collection<string, any>;
    }

    interface ChatInputCommandInteraction {
        t: (key: string, options?: any) => string;
    }
}
