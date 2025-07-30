import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import transporter from "../utils/mailer.js";
import {
  generateTicketId,
  generateTicketQR,
} from "../utils/qrCodeGenerator.js";

// @desc Create a new booking
// @route POST /api/bookings
// @access Logged-in users
export const createBooking = async (req, res) => {
  try {
    const { eventId, noOfSeats, paymentIntentId } = req.body;
    const userId = req.user._id;

    if (!eventId || noOfSeats == null) {
      return res
        .status(400)
        .json({ message: "Event ID and seat count are required" });
    }
    if (!Number.isInteger(noOfSeats) || noOfSeats <= 0 || noOfSeats > 10) {
      return res
        .status(400)
        .json({ message: "Seat count must be between 1 and 10" });
    }

    // Validate eventId exists
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Validate userId exists (should always exist if authenticated, but for completeness)
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (event.cancelled) {
      return res.status(400).json({ message: "Cannot book a cancelled event" });
    }

    if (new Date(event.date) < new Date()) {
      return res.status(400).json({ message: "Cannot book past events" });
    }

    const existing = await Booking.findOne({ eventId, userId });
    if (existing)
      return res.status(400).json({ message: "You already booked this event" });

    const totalBooked = await Booking.aggregate([
      { $match: { eventId: event._id } },
      { $group: { _id: null, total: { $sum: "$noOfSeats" } } },
    ]);
    const bookedSeats = totalBooked[0]?.total || 0;

    if (bookedSeats + noOfSeats > event.totalSeats) {
      return res.status(400).json({ message: "Not enough seats available" });
    }

    let ticketId;
    let idExists = true;
    while (idExists) {
      ticketId = generateTicketId();
      idExists = await Booking.exists({ ticketId });
    }

    const qrCode = await generateTicketQR(ticketId, eventId);

    const booking = await Booking.create({
      eventId,
      userId,
      noOfSeats,
      priceAtBooking: event.price,
      ticketId,
      qrCode,
      verified: false,
      paymentIntentId,
    });

    try {
      await transporter.sendMail({
        from: '"Event Ticketing" <tickets@eventify.com>',
        to: req.user.email,
        subject: `Your Ticket for ${event.title}`,
        text: `Thank you for booking!\n\nYour ticket ID: ${booking.ticketId}\nEvent: ${event.title}\nDate: ${event.date}\nVenue: ${event.venue}\n\nPlease present the QR code at the event entrance.`,
        html: `
        <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 24px;">
          <div style="max-width: 500px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 24px;">
            <h1 style="color: #2d7ff9; text-align: center;">🎟️ Your Event Ticket</h1>
            <hr style="margin: 16px 0;">
            <p style="font-size: 1.1em;">Thank you for booking <strong>${
              event.title
            }</strong>!</p>
            <div style="background: #f0f4ff; border-radius: 6px; padding: 16px; margin: 16px 0; text-align: center;">
              <p style="font-size: 1.2em; margin: 0 0 16px 0;">
                <strong>Ticket ID:</strong>
                <span style="font-size: 1.2em; color: #2d7ff9; letter-spacing: 1px;">${
                  booking.ticketId
                }</span>
              </p>
              <div style="margin: 16px 0;">
                <img src="${
                  booking.qrCode
                }" alt="Ticket QR Code" style="max-width: 200px; border: 2px solid #e0e0e0; border-radius: 8px;" />
              </div>
              <p style="font-size: 0.9em; color: #666; margin: 8px 0 0 0;">Scan this QR code at the event entrance</p>
            </div>
            <ul style="list-style: none; padding: 0; font-size: 1.1em;">
              <li><strong>Event:</strong> ${event.title}</li>
              <li><strong>Date:</strong> ${new Date(
                event.date
              ).toLocaleString()}</li>
              <li><strong>Venue:</strong> ${event.venue}</li>
              <li><strong>Seats Booked:</strong> ${booking.noOfSeats}</li>
            </ul>
            <hr style="margin: 16px 0;">
            <p style="text-align: center; color: #888;">Please present the QR code at the event entrance.</p>
          </div>
        </div>
      `,
      });
    } catch (emailError) {
      console.log("Failed to send ticket email:", emailError.message);
    }

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Cancel a booking
// @route DELETE /api/bookings/:id
// @access Booking owner only
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this booking" });
    }

    const event = await Event.findById(booking.eventId);
    if (event && new Date(event.date) < new Date()) {
      return res
        .status(400)
        .json({ message: "Cannot cancel booking for past events" });
    }

    await booking.deleteOne();
    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get bookings for logged-in user
// @route GET /api/bookings/user
// @access Logged-in users
export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate("eventId")
      .select("+ticketId +qrCode +verified");
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get bookings for a specific event
// @route GET /api/bookings/event/:eventId
// @access Organizer or Admin
export const getBookingsByEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (
      event.organizerId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view these bookings" });
    }

    const bookings = await Booking.find({ eventId: event._id }).populate(
      "userId",
      "name email"
    );
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Organizer verifies ticket QR code
// @route POST /api/bookings/verify
// @access Organizer
export const verifyBookingCode = async (req, res) => {
  try {
    const { qrData, eventId } = req.body;

    if (!qrData) {
      return res.status(400).json({ message: "QR code data is required" });
    }

    let ticketInfo;
    try {
      // Parse QR code data
      const { parseQRData } = await import("../utils/qrCodeGenerator.js");
      ticketInfo = parseQRData(qrData);
      console.log("Parsed QR ticket info:", ticketInfo);
      console.log("Frontend provided eventId:", eventId);
    } catch (error) {
      console.log("QR parsing error:", error.message);
      return res.status(400).json({ message: "Invalid QR code format" });
    }

    const booking = await Booking.findOne({ ticketId: ticketInfo.ticketId });
    if (!booking) {
      console.log("No booking found for ticketId:", ticketInfo.ticketId);
      return res
        .status(404)
        .json({ message: "Invalid ticket or booking cancelled" });
    }

    console.log("Found booking:");
    console.log("- Booking eventId:", booking.eventId.toString());
    console.log("- QR code eventId:", ticketInfo.eventId);
    console.log("- Frontend eventId:", eventId);
    console.log(
      "- Types:",
      typeof booking.eventId.toString(),
      typeof ticketInfo.eventId,
      typeof eventId
    );

    // Check if booking belongs to the selected event
    if (eventId && booking.eventId.toString() !== eventId) {
      console.log("❌ Event ID mismatch - booking vs frontend");
      return res
        .status(400)
        .json({ message: "Ticket does not belong to this event" });
    }

    // Also check if QR data event matches the booking event
    if (booking.eventId.toString() !== ticketInfo.eventId) {
      console.log("❌ Event ID mismatch - booking vs QR code");
      return res.status(400).json({ message: "Ticket event mismatch" });
    }

    if (booking.verified) {
      return res.status(400).json({ message: "Ticket already verified" });
    }

    booking.verified = true;
    await booking.save();

    res.json({
      message: "Ticket verified successfully",
      booking: {
        _id: booking._id,
        ticketId: booking.ticketId,
        noOfSeats: booking.noOfSeats,
        verified: booking.verified,
        eventId: booking.eventId,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get ticket QR code by booking ID
// @route GET /api/bookings/:id/qr
// @access Booking owner only
export const getTicketQR = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this ticket" });
    }

    res.json({
      ticketId: booking.ticketId,
      qrCode: booking.qrCode,
      verified: booking.verified,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
