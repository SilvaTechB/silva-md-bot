
import { exec } from 'child_process';

let handler = async (m, { conn, text, args, usedPrefix, command }) => {

    // Default command

    let commandToRun = args.join(' ') ||  'ls'; // Default to 'ls' if no command is provided

    try {

        // React with "wait" emoji to indicate processing

        await m.react('⌛');

        // Execute the command

        exec(commandToRun, async (error, stdout, stderr) => {

            if (error) {

                // React with "done" emoji to indicate completion

                await m.react('✅');

                return m.reply(`❌ Error: ${error.message}`);

            }

            if (stderr) {

                // React with "done" emoji to indicate completion

                await m.react('✅');

                return m.reply(`❌ Error: ${stderr}`);

            }

            // React with "done" emoji to indicate completion

            await m.react('✅');

            // Send the command output to the user

            return m.reply(`🔍 Command Output:\n\`\`\`${stdout}\`\`\``);

        });

    } catch (err) {

        await m.react('❌');

        return m.reply(`Something went wrong: ${err.message}`);

    }

};

// Metadata for the handler

handler.help = ['linux', 'exec'];

handler.tags = ['tools'];

handler.command = ['linux'];  // The trigger command is 'linux'

export default handler;
