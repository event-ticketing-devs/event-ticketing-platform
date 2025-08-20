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
    const { eventId, noOfSeats, ticketItems, paymentIntentId } = req.body;
    const userId = req.user._id;

    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    // Validate eventId exists
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Validate userId exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (event.cancelled) {
      return res.status(400).json({ message: "Cannot book a cancelled event" });
    }

    if (new Date(event.date) < new Date()) {
      return res.status(400).json({ message: "Cannot book past events" });
    }

    // Check for existing booking
    const existing = await Booking.findOne({
      eventId,
      userId,
      cancelledByUser: { $ne: true },
      cancelledByEvent: { $ne: true },
    });
    if (existing) {
      return res.status(400).json({ message: "You already booked this event" });
    }

    let bookingData = {
      eventId,
      userId,
      ticketId: "",
      qrCode: "",
      verified: false,
      paymentIntentId,
    };

    if (event.hasTicketCategories) {
      // Handle ticket categories
      if (
        !ticketItems ||
        !Array.isArray(ticketItems) ||
        ticketItems.length === 0
      ) {
        return res
          .status(400)
          .json({ message: "Ticket items are required for this event" });
      }

      // Validate ticket items
      let totalAmount = 0;
      let totalQuantity = 0;
      const validatedTicketItems = [];

      for (const item of ticketItems) {
        if (!item.categoryName || !item.quantity || item.quantity <= 0) {
          return res.status(400).json({
            message:
              "Each ticket item must have a valid category name and quantity",
          });
        }

        // Find the ticket category in the event
        const ticketCategory = event.ticketCategories.find(
          (cat) => cat.name === item.categoryName
        );

        if (!ticketCategory) {
          return res.status(400).json({
            message: `Ticket category "${item.categoryName}" not found`,
          });
        }

        const quantity = Number(item.quantity);
        if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 10) {
          return res.status(400).json({
            message: `Quantity for "${item.categoryName}" must be between 1 and 10`,
          });
        }

        // Check availability for this category
        const bookings = await Booking.find({ eventId });
        let bookedInCategory = 0;

        bookings.forEach((booking) => {
          if (booking.hasTicketCategories && booking.ticketItems) {
            const categoryBooking = booking.ticketItems.find(
              (bookingItem) => bookingItem.categoryName === item.categoryName
            );
            if (categoryBooking) {
              bookedInCategory += categoryBooking.quantity;
            }
          }
        });

        if (bookedInCategory + quantity > ticketCategory.totalSeats) {
          return res.status(400).json({
            message: `Not enough seats available for "${
              item.categoryName
            }". Available: ${ticketCategory.totalSeats - bookedInCategory}`,
          });
        }

        const subtotal = ticketCategory.price * quantity;
        validatedTicketItems.push({
          categoryName: item.categoryName,
          quantity,
          pricePerTicket: ticketCategory.price,
          subtotal,
        });

        totalAmount += subtotal;
        totalQuantity += quantity;
      }

      bookingData.hasTicketCategories = true;
      bookingData.ticketItems = validatedTicketItems;
      bookingData.totalAmount = totalAmount;
      bookingData.totalQuantity = totalQuantity;
    } else {
      // Handle legacy pricing
      if (noOfSeats == null) {
        return res.status(400).json({ message: "Number of seats is required" });
      }

      if (!Number.isInteger(noOfSeats) || noOfSeats <= 0 || noOfSeats > 10) {
        return res
          .status(400)
          .json({ message: "Seat count must be between 1 and 10" });
      }

      // Check availability
      const totalBooked = await Booking.aggregate([
        { $match: { eventId: event._id } },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $cond: {
                  if: { $eq: ["$hasTicketCategories", true] },
                  then: "$totalQuantity",
                  else: "$noOfSeats",
                },
              },
            },
          },
        },
      ]);
      const bookedSeats = totalBooked[0]?.total || 0;

      if (bookedSeats + noOfSeats > event.totalSeats) {
        return res.status(400).json({ message: "Not enough seats available" });
      }

      bookingData.hasTicketCategories = false;
      bookingData.noOfSeats = noOfSeats;
      bookingData.priceAtBooking = event.price;
      bookingData.totalAmount = event.price * noOfSeats;
      bookingData.totalQuantity = noOfSeats;
    }

    // Generate unique ticket ID
    let ticketId;
    let idExists = true;
    while (idExists) {
      ticketId = generateTicketId();
      idExists = await Booking.exists({ ticketId });
    }

    const qrCode = await generateTicketQR(ticketId, eventId);
    bookingData.ticketId = ticketId;
    bookingData.qrCode = qrCode;

    const booking = await Booking.create(bookingData);

    // Send confirmation email
    const ticketDetails = event.hasTicketCategories
      ? bookingData.ticketItems
          .map(
            (item) =>
              `${item.quantity}x ${item.categoryName} - $${item.pricePerTicket} each`
          )
          .join("\n")
      : `${noOfSeats} ticket(s) - $${event.price} each`;

    try {
      await transporter.sendMail({
        from: '"Event Ticketing" <tickets@eventify.com>',
        to: req.user.email,
        subject: `Your Ticket for ${event.title}`,
        text: `Thank you for booking!\n\nYour ticket ID: ${
          booking.ticketId
        }\nEvent: ${event.title}\nDate: ${event.date}\nVenue: ${
          event.venue?.name || event.venue
        }\n\nTicket Details:\n${ticketDetails}\n\nTotal: $${
          bookingData.totalAmount
        }\n\nPlease present the QR code at the event entrance.`,
        html: `
        <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 24px;">
          <div style="max-width: 500px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 24px;">
            <h1 style="color: #2d7ff9; text-align: center;">🎟️ Your Event Ticket</h1>
            <hr style="margin: 16px 0;">
            <p style="font-size: 1.1em;">Thank you for booking <strong>${
              event.title
            }</strong>!</p>
            <div style="background: #f0f4ff; border-radius: 6px; padding: 16px; margin: 16px 0; text-align: center;">
              <p style="margin: 0; font-size: 1.2em; font-weight: bold;">Ticket ID: ${
                booking.ticketId
              }</p>
            </div>
            <div style="background: #f8f9fa; border-radius: 6px; padding: 16px; margin: 16px 0;">
              <h3 style="margin-top: 0;">Event Details:</h3>
              <p><strong>Event:</strong> ${event.title}</p>
              <p><strong>Date:</strong> ${new Date(
                event.date
              ).toLocaleDateString()}</p>
              <p><strong>Venue:</strong> ${event.venue?.name || event.venue}</p>
              <h3>Ticket Details:</h3>
              <pre style="white-space: pre-line; font-family: inherit;">${ticketDetails}</pre>
              <p><strong>Total Amount:</strong> $${bookingData.totalAmount}</p>
            </div>
            <p style="text-align: center; color: #666;">Please present the QR code at the event entrance.</p>
          </div>
        </div>
        `,
      });
    } catch (emailError) {
      console.warn("Failed to send email:", emailError);
    }

    res.status(201).json({
      message: "Booking created successfully",
      booking: {
        _id: booking._id,
        ticketId: booking.ticketId,
        eventId: booking.eventId,
        totalAmount:
          booking.totalAmount ||
          booking.priceAtBooking * (booking.noOfSeats || 1),
        totalQuantity: booking.totalQuantity || booking.noOfSeats,
        hasTicketCategories: booking.hasTicketCategories,
        ticketItems: booking.ticketItems,
        createdAt: booking.createdAt,
      },
    });
  } catch (error) {
    console.error("Booking creation error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Export existing functions (placeholder - you'll need to copy them from the original file)
export const getUserBookings = async (req, res) => {
  // Copy from original file
  res.status(501).json({ message: "Not implemented yet" });
};

export const cancelBooking = async (req, res) => {
  // Copy from original file
  res.status(501).json({ message: "Not implemented yet" });
};

export const verifyTicket = async (req, res) => {
  // Copy from original file
  res.status(501).json({ message: "Not implemented yet" });
};
