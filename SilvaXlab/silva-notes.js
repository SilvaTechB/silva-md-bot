let notesModule = {};  // To track users who are interacting with the notes module

let notesStorage = {}; // In-memory object to store user notes

let handler = async (m, { conn, text, usedPrefix, command }) => {

  try {

    // Ensure 'm.chat' is valid (the chat ID)

    if (!m.chat) {

      console.error('Invalid chat ID (m.chat is undefined)');

      return m.reply('❌ Something went wrong. Please try again later.');

    }

    // Check if the message is related to the notes commands

    let isNotesCommand = command === "notes" || (m.text.toLowerCase().includes("notes") && m.isPublic);

    if (isNotesCommand && !notesModule[m.sender]) {

      notesModule[m.sender] = true;

      let txt = `╭───── *『 SILVA NOTES 』* ───◆

┃ You Can Store Notes For Later Use

┃ *---------------------------------------*

┃  ┌┤  *✯---- ADD NEW NOTE ----⦿*

┃  │✭ *Cmd :* ${usedPrefix + command} add 'Your Text'

┃  │✭ *Usage :* Save for Later Use

┃  ╰───────────────────◆

┃

┃  ┌┤  *✯---- GET ALL NOTES ----⦿*

┃  │✭ *Cmd :* ${usedPrefix + command} all

┃  │✭ *Usage :* Get All Saved Notes

┃  ╰───────────────────◆

┃

┃  ┌┤  *✯---- DELETE A NOTE ----⦿*

┃  │✭ *Cmd :* ${usedPrefix + command} del 'note id'

┃  │✭ *Usage :* Delete Single Note

┃  ╰───────────────────◆

┃

┃  ┌┤  *✯---- DELETE ALL ----⦿*

┃  │✭ *Cmd :* ${usedPrefix + command} delall

┃  │✭ *Usage :* Delete All Notes

┃  ╰───────────────────◆

╰━━━━━━━━━━━━━━━━━━━──⊷`;

      // If no text is provided, show the instructions

      if (!text) return await m.reply(txt);

      // Action handling based on user input

      let action = text.split(' ')[0].trim().toLowerCase();

      // ADD NEW NOTE

      if (action === "add" || action === "new") {

        let noteText = text.replace("add", "").replace("new", "").trim();

        if (!noteText) return m.reply("*Please provide some text to save as a note.*");

        

        if (!notesStorage[m.sender]) {

          notesStorage[m.sender] = [];

        }

        

        const noteId = notesStorage[m.sender].length + 1;

        notesStorage[m.sender].push({ id: noteId, text: noteText });

        return m.reply(`Note added successfully! ID: ${noteId}`);

        

      // GET ALL NOTES

      } else if (action === "all") {

        if (!notesStorage[m.sender] || notesStorage[m.sender].length === 0) {

          return m.reply('You have no saved notes.');

        }

        

        let notesList = notesStorage[m.sender].map(note => `${note.id}. ${note.text}`).join('\n');

        return m.reply(`Your saved notes:\n${notesList}`);

      // DELETE A SINGLE NOTE

      } else if (action === "del") {

        let noteId = parseInt(text.split(' ')[1]);

        if (isNaN(noteId) || !notesStorage[m.sender] || !notesStorage[m.sender].find(note => note.id === noteId)) {

          return m.reply("*Please provide a valid note ID to delete.* Example: `.del 1`");

        }

        // Delete note

        notesStorage[m.sender] = notesStorage[m.sender].filter(note => note.id !== noteId);

        return m.reply(`Note ID ${noteId} deleted successfully.`);

      // DELETE ALL NOTES

      } else if (action === "delall") {

        if (!notesStorage[m.sender] || notesStorage[m.sender].length === 0) {

          return m.reply('You have no saved notes to delete.');

        }

        // Delete all notes for the user

        notesStorage[m.sender] = [];

        return m.reply('All your notes have been deleted successfully.');

      } else {

        return await m.reply(`*Invalid action provided, please follow* \n\n${txt}`);

      }

    }

  } catch (error) {

    console.error('Error in notes module:', error);

    m.reply('❌ Something went wrong with the notes command. Please try again later.');

  } finally {

    // Reset the user's interaction state after the operation

    delete notesModule[m.sender];

  }

};

// Define the sleep function for delay between actions (if needed)

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Define the module's metadata

handler.help = ['notes'];  // This command shows up as 'notes'

handler.tags = ['utility'];    // This command belongs to the "utility" category

handler.command = ['notes'];  // This regex matches the "notes" command

// Export the handler module

export default handler;
