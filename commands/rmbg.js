const fs = require("node:fs");
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

  const style = args[0]?.toLowerCase() || "red";

  try {
    // Download quoted image
    let stream;
    try {
      stream = await downloadContentFromMessage(quotedImage, "image");
    } catch (downloadError) {
      console.error("Image Download Error:", downloadError);
      return await sock.sendMessage(
        chatId,
        { text: "❌ Failed to download the image. Ensure the quoted message contains a valid image." },
        { quoted: message }
      );
    }

    let buffer = Buffer.from([]);
    try {
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      if (buffer.length === 0) {
        throw new Error("Empty image buffer");
      }
    } catch (bufferError) {
      console.error("Buffer Processing Error:", bufferError);
      return await sock.sendMessage(
        chatId,
        { text: "❌ Error processing the image data. The image may be corrupted or invalid." },
        { quoted: message }
      );
    }

    // Prepare the form
    const formData = new FormData();
    formData.append("size", "auto");
    formData.append("bg_color", style);
    formData.append("image_file", buffer, "input.jpg");

    // Send to remove.bg
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
        { text: "❌ Network error while contacting remove.bg. Please check your internet connection and try again." },
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
      
      // Customize error messages based on status code
      let errorMessage = "❌ Failed to apply background style.";
      if (response.status === 401) {
        errorMessage = "❌ Invalid API key for remove.bg. Please contact the administrator.";
      } else if (response.status === 429) {
        errorMessage = "❌ Too many requests to remove.bg. Please try again later.";
      } else if (response.status >= 500) {
        errorMessage = "❌ Remove.bg server error. Please try again later.";
      } else {
        errorMessage = `❌ Remove.bg Error ${response.status}: ${errorText}`;
      }

      return await sock.sendMessage(chatId, { text: errorMessage }, { quoted: message });
    }

    // Get image as ArrayBuffer and send it back
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
        { text: "❌ Error processing the response from remove.bg. The output image is invalid." },
        { quoted: message }
      );
    }

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
    // Catch any unexpected errors
    console.error("Unexpected Error:", err);
    await sock.sendMessage(
      chatId,
      { text: "❌ An unexpected error occurred while processing the image. Please try again." },
      { quoted: message }
    );
  }
}

module.exports = { stylebg };
