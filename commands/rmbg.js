const axios = require("axios");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

async function stylebg(sock, chatId, message, args) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedImage = quoted?.imageMessage;

    if (!quotedImage) {
        return await sock.sendMessage(
            chatId,
            { text: "⚠️ Reply to an image with a color style, e.g. `.stylebg red`" },
            { quoted: message }
        );
    }

    const style = args[0]?.toLowerCase() || "white"; // default color background

    try {
        // Download quoted image
        const stream = await downloadContentFromMessage(quotedImage, "image");
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        // Send to Remove.bg
        const response = await axios({
            method: "post",
            url: "https://api.remove.bg/v1.0/removebg",
            data: {
                image_file_b64: buffer.toString("base64"),
                bg_color: style,
            },
            headers: { "X-Api-Key": "yhGesAKXQTh9PgHVefztXRa4" }, // Replace locally with your key
            responseType: "arraybuffer",
        });

        // Send back styled image
        await sock.sendMessage(
            chatId,
            {
                image: Buffer.from(response.data, "binary"),
                fileName: `styled_${style}.png`,
                caption: `✅ Background changed to *${style}*`,
            },
            { quoted: message }
        );
    } catch (err) {
        console.error(err);
        await sock.sendMessage(
            chatId,
            { text: "❌ Failed to apply background style. Try another color." },
            { quoted: message }
        );
    }
}

module.exports = stylebgCommand;
