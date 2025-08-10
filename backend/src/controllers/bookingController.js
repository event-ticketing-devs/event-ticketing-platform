import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import transporter from "../utils/mailer.js";
import {
  generateTicketId,
  generateTicketQR,
} from "../utils/qrCodeGenerator.js";
import { processRefund, getRefundStatus } from "../utils/stripeRefund.js";
import { calculateRefundPolicy } from "../utils/refundPolicy.js";

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

    const existing = await Booking.findOne({
      eventId,
      userId,
      cancelledByUser: { $ne: true },
      cancelledByEvent: { $ne: true },
    });
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
              <li><strong>Venue:</strong> ${event.venue.name}</li>
              <li><strong>Address:</strong> ${event.venue.address}</li>
              <li><strong>City:</strong> ${event.city}</li>
              <li><strong>Seats Booked:</strong> ${booking.noOfSeats}</li>
            </ul>
            
            <!-- Venue Map Section -->
            <div style="margin: 20px 0; padding: 16px; background: #f8f9fa; border-radius: 8px; text-align: center;">
              <h3 style="color: #333; margin: 0 0 12px 0;">📍 Venue Location</h3>
              <img src="https://maps.googleapis.com/maps/api/staticmap?center=${
                event.venue.coordinates.lat
              },${
          event.venue.coordinates.lng
        }&zoom=15&size=400x200&markers=color:red%7C${
          event.venue.coordinates.lat
        },${event.venue.coordinates.lng}&key=${
          process.env.GOOGLE_MAPS_API_KEY
        }" 
                   alt="Venue Map" 
                   style="max-width: 100%; border-radius: 6px; border: 1px solid #ddd;" />
              <div style="margin-top: 10px;">
                <a href="https://www.google.com/maps/search/?api=1&query=${
                  event.venue.coordinates.lat
                },${event.venue.coordinates.lng}" 
                   style="background: #4285f4; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 14px;">
                  🗺️ Open in Google Maps
                </a>
              </div>
            </div>
            
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

    // Check if already cancelled
    if (booking.cancelledByUser || booking.cancelledByEvent) {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    const event = await Event.findById(booking.eventId);
    if (!event) {
      return res.status(404).json({ message: "Associated event not found" });
    }

    if (new Date(event.date) < new Date()) {
      return res
        .status(400)
        .json({ message: "Cannot cancel booking for past events" });
    }

    // Process refund if payment was made
    let refundResult = null;
    if (booking.paymentIntentId) {
      console.log(
        `Processing refund for booking ${booking._id}, payment: ${booking.paymentIntentId}`
      );

      // Calculate refund amount based on time until event
      const refundCalc = calculateRefundPolicy(
        new Date(event.date),
        booking.priceAtBooking,
        booking.noOfSeats
      );

      console.log(
        `Refund policy: ${refundCalc.policy}, Amount: ₹${refundCalc.refundAmount}, Days until event: ${refundCalc.daysDifference}`
      );

      if (refundCalc.refundAmount > 0) {
        refundResult = await processRefund(
          booking.paymentIntentId,
          refundCalc.refundAmount,
          "requested_by_customer"
        );

        if (refundResult.success) {
          // Update booking with refund information
          booking.refundStatus = "processed";
          booking.refundAmount = refundResult.amount;
          booking.refundId = refundResult.refundId;
        } else {
          // Mark refund as failed but still allow cancellation
          booking.refundStatus = "failed";
          console.error("Refund failed:", refundResult.error);
        }
      } else {
        // No refund applicable
        booking.refundStatus = "none";
        booking.refundAmount = 0;
        console.log("No refund applicable due to cancellation policy");
      }

      // Store the refund policy for reference
      booking.cancellationReason = `${
        req.body?.reason || "Cancelled by user"
      } - ${refundCalc.policy}`;
    } else {
      // No payment was made, just set basic cancellation reason
      booking.cancellationReason = req.body?.reason || "Cancelled by user";
    }

    // Mark booking as cancelled by user (don't delete, keep for history)
    booking.cancelledByUser = true;
    booking.cancellationDate = new Date();

    await booking.save();

    // Send cancellation confirmation email
    try {
      // Calculate email message based on refund policy
      const refundCalc = calculateRefundPolicy(
        new Date(event.date),
        booking.priceAtBooking,
        booking.noOfSeats
      );

      await transporter.sendMail({
        from: '"Event Ticketing" <tickets@eventify.com>',
        to: req.user.email,
        subject: `Booking Cancelled - ${event.title}`,
        text: `Your booking for ${
          event.title
        } has been cancelled successfully.\n\nRefund Policy: ${
          refundCalc.policy
        }${
          refundResult?.success
            ? `\nA refund of ₹${refundResult.amount} has been processed and will appear in your account within 5-10 business days.`
            : booking.refundAmount === 0
            ? `\nNo refund is applicable due to our cancellation policy.`
            : ""
        }`,
        html: `
          <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 24px;">
            <div style="max-width: 500px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 24px;">
              <h1 style="color: #e74c3c; text-align: center;">🚫 Booking Cancelled</h1>
              <hr style="margin: 16px 0;">
              <p style="font-size: 1.1em;">Your booking for <strong>${
                event.title
              }</strong> has been cancelled successfully.</p>
              
              <!-- Cancellation Policy Info -->
              <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 12px; margin: 16px 0;">
                <h4 style="margin: 0 0 8px 0; color: #1976d2;">Refund Policy</h4>
                <p style="margin: 0; font-size: 0.9em;">${refundCalc.policy}</p>
                <p style="margin: 4px 0 0 0; font-size: 0.8em; color: #666;">
                  • 7+ days: 100% refund | 1-7 days: 50% refund | <24 hours: No refund
                </p>
              </div>

              <div style="background: #f8f9fa; border-radius: 6px; padding: 16px; margin: 16px 0;">
                <p><strong>Ticket ID:</strong> ${booking.ticketId}</p>
                <p><strong>Seats Cancelled:</strong> ${booking.noOfSeats}</p>
                <p><strong>Original Amount:</strong> ₹${
                  refundCalc.fullAmount
                }</p>
                <p><strong>Cancellation Date:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Days Before Event:</strong> ${
                  refundCalc.daysUntilEvent
                } days</p>
                ${
                  refundResult?.success
                    ? `
                  <div style="background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 12px; border-radius: 4px; margin-top: 12px;">
                    <strong>✅ Refund Processed:</strong> ₹${refundResult.amount}<br>
                    <strong>Refund ID:</strong> ${refundResult.refundId}<br>
                    <small>The refund will appear in your account within 5-10 business days.</small>
                  </div>
                `
                    : booking.refundAmount === 0
                    ? `
                  <div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 12px; border-radius: 4px; margin-top: 12px;">
                    <strong>⚠️ No Refund:</strong> Cancelled within 24 hours of event<br>
                    <small>As per our cancellation policy, no refund is applicable.</small>
                  </div>
                `
                    : booking.refundStatus === "failed"
                    ? `
                  <div style="background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 12px; border-radius: 4px; margin-top: 12px;">
                    <strong>❌ Refund Failed:</strong> Please contact support<br>
                    <small>We'll help you process your refund manually.</small>
                  </div>
                `
                    : ""
                }
              </div>
              <ul style="list-style: none; padding: 0; font-size: 1.1em;">
                <li><strong>Event:</strong> ${event.title}</li>
                <li><strong>Original Date:</strong> ${new Date(
                  event.date
                ).toLocaleString()}</li>
                <li><strong>Venue:</strong> ${
                  event.venue?.name || event.venue
                }</li>
              </ul>
              <hr style="margin: 16px 0;">
              <p style="text-align: center; color: #888;">Thank you for using our platform. We hope to see you at future events!</p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.log("Failed to send cancellation email:", emailError.message);
    }

    // Calculate response data for refund policy
    const refundCalc = calculateRefundPolicy(
      new Date(event.date),
      booking.priceAtBooking,
      booking.noOfSeats
    );
    const fullAmount = booking.priceAtBooking * booking.noOfSeats;

    res.json({
      message: "Booking cancelled successfully",
      cancellation: {
        daysBeforeEvent: refundCalc.daysDifference,
        originalAmount: fullAmount,
        refundPolicy: refundCalc.policy,
      },
      refund: refundResult?.success
        ? {
            status: "processed",
            amount: refundResult.amount,
            refundId: refundResult.refundId,
            percentage: refundCalc.refundPercentage,
          }
        : booking.refundAmount === 0
        ? {
            status: "none",
            amount: 0,
            message: "No refund applicable due to cancellation timing",
            percentage: refundCalc.refundPercentage,
          }
        : booking.refundStatus === "failed"
        ? {
            status: "failed",
            message: "Refund processing failed. Please contact support.",
          }
        : null,
    });
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
      .select(
        "+ticketId +qrCode +verified +cancelledByUser +cancelledByEvent +cancellationDate +cancellationReason +refundStatus +refundAmount +refundId"
      );
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get cancelled bookings for logged-in user
// @route GET /api/bookings/user/cancelled
// @access Logged-in users
export const getUserCancelledBookings = async (req, res) => {
  try {
    const cancelledBookings = await Booking.find({
      userId: req.user._id,
      $or: [{ cancelledByUser: true }, { cancelledByEvent: true }],
    })
      .populate("eventId")
      .select(
        "+ticketId +cancelledByUser +cancelledByEvent +cancellationDate +cancellationReason +refundStatus +refundAmount +refundId"
      )
      .sort({ cancellationDate: -1 }); // Most recent cancellations first

    res.json(cancelledBookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get refund status for a booking
// @route GET /api/bookings/:id/refund-status
// @access Booking owner only
export const getRefundStatusEndpoint = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this booking" });
    }

    // If no refund ID, return current status from database
    if (!booking.refundId) {
      return res.json({
        status: booking.refundStatus,
        amount: booking.refundAmount,
        message:
          booking.refundStatus === "none"
            ? "No refund processed"
            : "Refund information unavailable",
      });
    }

    // Get live status from Stripe
    const stripeRefundStatus = await getRefundStatus(booking.refundId);

    if (stripeRefundStatus.success) {
      // Update local status if different
      if (booking.refundStatus !== stripeRefundStatus.status) {
        booking.refundStatus =
          stripeRefundStatus.status === "succeeded"
            ? "processed"
            : stripeRefundStatus.status;
        await booking.save();
      }

      res.json({
        status: stripeRefundStatus.status,
        amount: stripeRefundStatus.amount,
        refundId: booking.refundId,
        processedAt: booking.cancellationDate,
      });
    } else {
      res.json({
        status: booking.refundStatus,
        amount: booking.refundAmount,
        refundId: booking.refundId,
        error: "Unable to fetch current status from payment processor",
      });
    }
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
