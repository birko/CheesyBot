import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const commands: any[] = [];
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        } else {
            console.log(`[WARNING] The command at ${path.join(commandsPath, file)} is missing a required "data" or "execute" property.`);
        }
    }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN as string);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const guildIds = process.env.GUILD_IDS ? process.env.GUILD_IDS.split(',').map(id => id.trim()) : [];

        if (guildIds.length > 0) {
            console.log(`Deploying to guilds: ${guildIds.join(', ')}`);
            for (const guildId of guildIds) {
                try {
                    const data = await rest.put(
                        Routes.applicationGuildCommands(process.env.CLIENT_ID as string, guildId),
                        { body: commands },
                    ) as any[];
                    console.log(`Successfully reloaded ${data.length} application (/) commands for guild ${guildId}.`);
                } catch (error) {
                    console.error(`Failed to deploy to guild ${guildId}:`, error);
                }
            }

            // Clear global commands to prevent duplicates/conflicts
            try {
                console.log('Clearing global commands...');
                await rest.put(
                    Routes.applicationCommands(process.env.CLIENT_ID as string),
                    { body: [] },
                );
                console.log('Successfully cleared global application (/) commands.');
            } catch (error) {
                console.error('Failed to clear global commands:', error);
            }
        } else {
            console.log('No GUILD_IDS found in .env, deploying globally.');
            const data = await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID as string),
                { body: commands },
            ) as any[];
            console.log(`Successfully reloaded ${data.length} application (/) commands globally.`);
        }

    } catch (error) {
        console.error(error);
    }
})();

