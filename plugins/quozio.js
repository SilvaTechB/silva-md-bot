import fetch from "node-fetch"

let handler = async (m, {
    conn,
    usedPrefix,
    args,
    command
}) => {
    let text
    if (args.length >= 1) {
        text = args.slice(0).join(" ")
    } else if (m.quoted && m.quoted.text) {
        text = m.quoted.text
    } else throw "Input quotes or text replies that you want to make quotes!"

    let quote = await createQuote(m.name, text)
    await conn.sendFile(m.chat, quote, '', maker + "\n*Request by:* " + m.name + "\n*Creative:* " + text, m)

}
handler.tags = ["maker"]
handler.command = handler.help = ["quozio", "qmkr"]

export default handler

async function createQuote(author, message) {
    const host = "https://quozio.com/";
    let path = "";

    // Submit quote
    path = "api/v1/quotes";
    const body = JSON.stringify({
        author: author,
        quote: message,
    });

    const quote = await fetch(host + path, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body,
    }).then((val) => val.json());

    console.debug("Created quote at: " + quote["url"], "quote");
    const quoteId = quote["quoteId"];

    // Choose a random template
    path = "api/v1/templates";
    const templates = await fetch(host + path).then((val) => val.json()).then((
        val,
    ) => val["data"]);

    const index = Math.floor(Math.random() * templates.length);
    console.debug("Chose template from: " + templates[index]["url"], "quote");
    const templateId = templates[index]["templateId"];

    // Apply the template to the quote
    path = `api/v1/quotes/${quoteId}/imageUrls?templateId=${templateId}`;
    const imageUrl = await fetch(host + path).then((val) => val.json()).then((
        val,
    ) => val["medium"]);
    console.debug("Created quote image at: " + imageUrl, "quote");

    // Return generated image
    return imageUrl;
}