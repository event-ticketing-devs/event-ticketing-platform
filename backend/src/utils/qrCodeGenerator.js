import QRCode from "qrcode";
import crypto from "crypto";

/**
 * Generate a unique ticket identifier
 * @returns {string} Unique ticket ID
 */
export function generateTicketId() {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Generate QR code as base64 data URL
 * @param {string} ticketId - The unique ticket identifier
 * @param {string} eventId - The event ID
 * @returns {Promise<string>} Base64 data URL of the QR code
 */
export async function generateTicketQR(ticketId, eventId) {
  try {
    // Create verification data object
    const verificationData = {
      ticketId,
      eventId,
      timestamp: Date.now(),
    };

    // Convert to JSON string for QR code
    const qrData = JSON.stringify(verificationData);

    // Generate QR code as base64 data URL
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: "M",
      type: "image/png",
      quality: 0.92,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      width: 200,
    });

    return qrCodeDataURL;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
}

/**
 * Parse QR code data to extract ticket information
 * @param {string} qrData - The scanned QR code data
 * @returns {Object} Parsed ticket data
 */
export function parseQRData(qrData) {
  try {
    const parsed = JSON.parse(qrData);

    if (!parsed.ticketId || !parsed.eventId) {
      throw new Error("Invalid QR code format");
    }

    return {
      ticketId: parsed.ticketId,
      eventId: parsed.eventId,
      timestamp: parsed.timestamp,
    };
  } catch (error) {
    throw new Error("Invalid QR code data");
  }
}
