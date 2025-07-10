const crypto = require("crypto");

function generateTicketCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

module.exports = generateTicketCode;
