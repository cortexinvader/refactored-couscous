const { readFileSync } = require("node:fs");
const FormData = require("form-data");
const fetch = require("node-fetch");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

async function stylebg(sock, chatId, message, args) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedImage = quoted?.imageMessage;

    // Check if an image was quoted
    if (!quotedImage) {
        return await sock.sendMessage(
            chatId,
            { text: "⚠️ Please reply to an image with a color style, e.g. `.stylebg red`" },
            { quoted: message }
        );
    }

    // Validate image type
    if (!quotedImage.mimetype?.startsWith("image/")) {
        return await sock.sendMessage(
            chatId,
            { text: "⚠️ Quoted message is not a valid image (JPEG/PNG required)." },
            { quoted: message }
        );
    }

    const style = args[0]?.toLowerCase() || "white"; // Default color
    const validColors = ["red", "blue", "green", "white", "black"]; // Add more as needed
    if (!validColors.includes(style)) {
        return await sock.sendMessage(
            chatId,
            { text: `⚠️ Invalid color: ${style}. Try: ${validColors.join(", ")}` },
            { quoted: message }
        );
    }

    try {
        // Download quoted image
        let stream;
        try {
            stream = await downloadContentFromMessage(quotedImage, "image");
        } catch (downloadError) {
            console.error("Image Download Error:", downloadError);
            return await sock.sendMessage(
                chatId,
                { text: "❌ Failed to download the image. Ensure it’s a valid image." },
                { quoted: message }
            );
        }

        let buffer = Buffer.from([]);
        try {
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            if (buffer.length === 0) {
                throw new Error("Empty image buffer");
            }
        } catch (bufferError) {
            console.error("Buffer Processing Error:", bufferError);
            return await sock.sendMessage(
                chatId,
                { text: "❌ Error processing image data. The image may be corrupted." },
                { quoted: message }
            );
        }

        // Prepare FormData (per remove.bg documentation)
        const formData = new FormData();
        formData.append("size", "auto");
        formData.append("bg_color", style);
        formData.append("image_file", buffer, "input.jpg");

        // Send to Remove.bg
        let response;
        try {
            response = await fetch("https://api.remove.bg/v1.0/removebg", {
                method: "POST",
                headers: { "X-Api-Key": "yhGesAKXQTh9PgHVefztXRa4" },
                body: formData,
            });
        } catch (fetchError) {
            console.error("Network Error:", fetchError);
            return await sock.sendMessage(
                chatId,
                { text: "❌ Network error contacting remove.bg. Check your internet connection." },
                { quoted: message }
            );
        }

        // Check response status
        if (!response.ok) {
            let errorText;
            try {
                errorText = await response.text();
            } catch (textError) {
                errorText = "Unable to retrieve error details";
            }
            console.error("Remove.bg API Error:", errorText);

            let errorMessage = `❌ Remove.bg Error ${response.status}: ${errorText}`;
            if (response.status === 401) {
                errorMessage = "❌ Invalid API key for remove.bg. Contact the administrator.";
            } else if (response.status === 429) {
                errorMessage = "❌ Too many requests to remove.bg. Try again later.";
            } else if (response.status >= 500) {
                errorMessage = "❌ Remove.bg server error. Try again later.";
            }

            return await sock.sendMessage(chatId, { text: errorMessage }, { quoted: message });
        }

        // Get and validate response
        let resultBuffer;
        try {
            resultBuffer = Buffer.from(await response.arrayBuffer());
            if (resultBuffer.length === 0) {
                throw new Error("Empty response from remove.bg");
            }
        } catch (bufferError) {
            console.error("Response Buffer Error:", bufferError);
            return await sock.sendMessage(
                chatId,
                { text: "❌ Error processing response from remove.bg. The output image is invalid." },
                { quoted: message }
            );
        }

        // Send back styled image
        await sock.sendMessage(
            chatId,
            {
                image: resultBuffer,
                fileName: `styled_${style}.png`,
                caption: `✅ Background changed to *${style}*`,
            },
            { quoted: message }
        );
    } catch (err) {
        console.error("Unexpected Error:", err);
        return await sock.sendMessage(
            chatId,
            { text: "❌ An unexpected error occurred. Please try again." },
            { quoted: message }
        );
    }
}

module.exports = stylebg;
