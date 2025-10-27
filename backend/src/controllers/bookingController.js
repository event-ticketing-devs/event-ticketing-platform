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
    const {
      eventId,
      noOfSeats,
      ticketItems,
      totalAmount,
      totalQuantity,
      hasTicketCategories,
      paymentIntentId,
    } = req.body;
    const userId = req.user._id;

    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required" });
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

    let bookingData = {
      eventId,
      userId,
      paymentIntentId,
      verified: false,
    };

    // Handle ticket categories vs legacy booking
    if (hasTicketCategories && event.hasTicketCategories) {
      // Validate ticket items
      if (
        !ticketItems ||
        !Array.isArray(ticketItems) ||
        ticketItems.length === 0
      ) {
        return res
          .status(400)
          .json({
            message: "Ticket items are required for categorized events",
          });
      }

      if (
        !Number.isInteger(totalQuantity) ||
        totalQuantity <= 0 ||
        totalQuantity > 10
      ) {
        return res
          .status(400)
          .json({ message: "Total quantity must be between 1 and 10" });
      }

      // Validate ticket items against event categories
      const validCategories = event.ticketCategories;
      for (const item of ticketItems) {
        if (
          !item.categoryName ||
          !Number.isInteger(item.quantity) ||
          item.quantity <= 0
        ) {
          return res
            .status(400)
            .json({ message: "Invalid ticket item format" });
        }

        const category = validCategories.find(
          (cat) => cat.name === item.categoryName
        );
        if (!category) {
          return res
            .status(400)
            .json({ message: `Invalid ticket category: ${item.categoryName}` });
        }

        if (item.pricePerTicket !== category.price) {
          return res
            .status(400)
            .json({
              message: `Price mismatch for category: ${item.categoryName}`,
            });
        }
      }

      // Check seat availability for each category
      const categoryBookings = await Booking.aggregate([
        {
          $match: {
            eventId: event._id,
            cancelledByUser: { $ne: true },
            cancelledByEvent: { $ne: true },
            hasTicketCategories: true,
          },
        },
        { $unwind: "$ticketItems" },
        {
          $group: {
            _id: "$ticketItems.categoryName",
            totalBooked: { $sum: "$ticketItems.quantity" },
          },
        },
      ]);

      for (const item of ticketItems) {
        const category = event.ticketCategories.find(
          (cat) => cat.name === item.categoryName
        );
        const booked = categoryBookings.find(
          (booking) => booking._id === item.categoryName
        );
        const bookedCount = booked ? booked.totalBooked : 0;

        if (bookedCount + item.quantity > category.totalSeats) {
          return res.status(400).json({
            message: `Not enough seats available for ${
              item.categoryName
            }. Available: ${category.totalSeats - bookedCount}, Requested: ${
              item.quantity
            }`,
          });
        }
      }

      // Calculate total amount
      const calculatedTotal = ticketItems.reduce(
        (sum, item) => sum + item.pricePerTicket * item.quantity,
        0
      );
      if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
        return res
          .status(400)
          .json({ message: "Total amount calculation mismatch" });
      }

      bookingData = {
        ...bookingData,
        ticketItems,
        totalAmount,
        totalQuantity,
        hasTicketCategories: true,
      };
    } else {
      // Legacy booking validation
      if (noOfSeats == null) {
        return res.status(400).json({ message: "Seat count is required" });
      }
      if (!Number.isInteger(noOfSeats) || noOfSeats <= 0 || noOfSeats > 10) {
        return res
          .status(400)
          .json({ message: "Seat count must be between 1 and 10" });
      }

      // Check total seat availability
      const totalBooked = await Booking.aggregate([
        {
          $match: {
            eventId: event._id,
            cancelledByUser: { $ne: true },
            cancelledByEvent: { $ne: true },
          },
        },
        {
          $group: {
            _id: null,
            legacySeats: {
              $sum: {
                $cond: [
                  { $eq: ["$hasTicketCategories", true] },
                  0,
                  "$noOfSeats",
                ],
              },
            },
            categorySeats: {
              $sum: {
                $cond: [
                  { $eq: ["$hasTicketCategories", true] },
                  "$totalQuantity",
                  0,
                ],
              },
            },
          },
        },
      ]);

      const bookedSeats = totalBooked[0]
        ? totalBooked[0].legacySeats + totalBooked[0].categorySeats
        : 0;
      const totalSeats = event.hasTicketCategories
        ? event.ticketCategories.reduce((sum, cat) => sum + cat.totalSeats, 0)
        : event.totalSeats;

      if (bookedSeats + noOfSeats > totalSeats) {
        return res.status(400).json({ message: "Not enough seats available" });
      }

      const calculatedTotal = event.price * noOfSeats;
      if (totalAmount && Math.abs(calculatedTotal - totalAmount) > 0.01) {
        return res
          .status(400)
          .json({ message: "Total amount calculation mismatch" });
      }

      bookingData = {
        ...bookingData,
        noOfSeats,
        priceAtBooking: event.price,
        hasTicketCategories: false,
      };
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
    const seatsText = hasTicketCategories
      ? ticketItems
          .map((item) => `${item.quantity}x ${item.categoryName}`)
          .join(", ")
      : `${noOfSeats} seat${noOfSeats > 1 ? "s" : ""}`;

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
              <li><strong>Venue:</strong> ${
                event.venue.name || event.venue
              }</li>
              ${
                event.venue.address
                  ? `<li><strong>Address:</strong> ${event.venue.address}</li>`
                  : ""
              }
              ${
                event.city
                  ? `<li><strong>City:</strong> ${event.city}</li>`
                  : ""
              }
              <li><strong>Tickets:</strong> ${seatsText}</li>
            </ul>
            
            ${
              event.venue.coordinates
                ? `
            <!-- Venue Map Section -->
            <div style="margin: 20px 0; padding: 16px; background: #f8f9fa; border-radius: 8px; text-align: center;">
              <h3 style="color: #333; margin: 0 0 12px 0;">📍 Venue Location</h3>
              <img src="https://maps.googleapis.com/maps/api/staticmap?center=${event.venue.coordinates.lat},${event.venue.coordinates.lng}&zoom=15&size=400x200&markers=color:red%7C${event.venue.coordinates.lat},${event.venue.coordinates.lng}&key=${process.env.GOOGLE_MAPS_API_KEY}" 
                   alt="Venue Map" 
                   style="max-width: 100%; border-radius: 6px; border: 1px solid #ddd;" />
              <div style="margin-top: 10px;">
                <a href="https://www.google.com/maps/search/?api=1&query=${event.venue.coordinates.lat},${event.venue.coordinates.lng}" 
                   style="background: #4285f4; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 14px;">
                  🗺️ Open in Google Maps
                </a>
              </div>
            </div>
            `
                : ""
            }
            
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

      // Calculate refund amount based on time until event and booking type
      let originalAmount, seatCount;

      if (booking.hasTicketCategories) {
        originalAmount = booking.totalAmount;
        seatCount = booking.totalQuantity;
      } else {
        originalAmount = booking.priceAtBooking * booking.noOfSeats;
        seatCount = booking.noOfSeats;
      }

      const refundCalc = calculateRefundPolicy(
        new Date(event.date),
        originalAmount / seatCount, // price per seat/ticket
        seatCount,
        event.useDefaultRefundPolicy ? null : event.customRefundPolicy
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
      let originalAmount, seatCount;

      if (booking.hasTicketCategories) {
        originalAmount = booking.totalAmount;
        seatCount = booking.totalQuantity;
      } else {
        originalAmount = booking.priceAtBooking * booking.noOfSeats;
        seatCount = booking.noOfSeats;
      }

      const refundCalc = calculateRefundPolicy(
        new Date(event.date),
        originalAmount / seatCount, // price per seat/ticket
        seatCount
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
                <p><strong>Tickets Cancelled:</strong> ${
                  booking.hasTicketCategories && booking.ticketItems
                    ? booking.ticketItems
                        .map((item) => `${item.quantity}x ${item.categoryName}`)
                        .join(", ") + ` (Total: ${booking.totalQuantity})`
                    : `${booking.noOfSeats} seat${
                        booking.noOfSeats !== 1 ? "s" : ""
                      }`
                }</p>
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
    let originalAmount, seatCount;

    if (booking.hasTicketCategories) {
      originalAmount = booking.totalAmount;
      seatCount = booking.totalQuantity;
    } else {
      originalAmount = booking.priceAtBooking * booking.noOfSeats;
      seatCount = booking.noOfSeats;
    }

    const refundCalc = calculateRefundPolicy(
      new Date(event.date),
      originalAmount / seatCount, // price per seat/ticket
      seatCount
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
    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { userId: req.user._id };
    
    // Status filter
    if (req.query.status) {
      switch (req.query.status) {
        case 'active':
          filter.cancelledByUser = { $ne: true };
          filter.cancelledByEvent = { $ne: true };
          break;
        case 'cancelled':
          filter.$or = [
            { cancelledByUser: true },
            { cancelledByEvent: true }
          ];
          break;
        case 'verified':
          filter.verified = true;
          break;
        case 'unverified':
          filter.verified = { $ne: true };
          break;
      }
    }

    // Date range filters
    if (req.query.dateFrom || req.query.dateTo) {
      filter.createdAt = {};
      if (req.query.dateFrom) {
        filter.createdAt.$gte = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        const dateTo = new Date(req.query.dateTo);
        dateTo.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = dateTo;
      }
    }

    // Build sort object
    const sort = {};
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    switch (sortBy) {
      case 'createdAt':
        sort.createdAt = sortOrder;
        break;
      case 'totalAmount':
        sort.totalAmount = sortOrder;
        break;
      case 'eventDate':
        // We'll sort by event date after population
        sort.createdAt = sortOrder; // Fallback for now
        break;
      default:
        sort.createdAt = -1; // Default sort by newest first
    }

    // Get total count for pagination
    const totalBookings = await Booking.countDocuments(filter);
    const totalPages = Math.ceil(totalBookings / limit);

    // Fetch bookings with pagination
    let bookings = await Booking.find(filter)
      .populate("eventId")
      .select(
        "+ticketId +qrCode +verified +cancelledByUser +cancelledByEvent +cancellationDate +cancellationReason +refundStatus +refundAmount +refundId"
      )
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Sort by event date if requested (after population)
    if (sortBy === 'eventDate') {
      bookings = bookings.sort((a, b) => {
        const dateA = new Date(a.eventId?.date || 0);
        const dateB = new Date(b.eventId?.date || 0);
        return sortOrder === 1 ? dateA - dateB : dateB - dateA;
      });
    }

    // Return paginated response
    res.json({
      bookings,
      pagination: {
        currentPage: page,
        totalPages,
        totalBookings,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      },
      filters: {
        status: req.query.status || null,
        dateFrom: req.query.dateFrom || null,
        dateTo: req.query.dateTo || null
      },
      sorting: {
        sortBy,
        sortOrder: req.query.sortOrder || 'desc'
      }
    });
  } catch (error) {
    console.error('Error in getUserBookings:', error);
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

    const isOwner = event.organizerId.toString() === req.user._id.toString();
    const isCoOrganizer = event.coOrganizers?.some(
      coOrgId => coOrgId.toString() === req.user._id.toString()
    );
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isCoOrganizer && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized to view these bookings" });
    }

    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { eventId: event._id };
    
    // Status filter
    if (req.query.status) {
      switch (req.query.status) {
        case 'active':
          filter.cancelledByUser = { $ne: true };
          filter.cancelledByEvent = { $ne: true };
          break;
        case 'cancelled':
          filter.$or = [
            { cancelledByUser: true },
            { cancelledByEvent: true }
          ];
          break;
        case 'verified':
          filter.verified = true;
          break;
        case 'unverified':
          filter.verified = { $ne: true };
          break;
      }
    }

    // Payment status filter
    if (req.query.paymentStatus) {
      filter.paymentStatus = req.query.paymentStatus;
    }

    // Date range filters
    if (req.query.dateFrom || req.query.dateTo) {
      filter.createdAt = {};
      if (req.query.dateFrom) {
        filter.createdAt.$gte = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        const dateTo = new Date(req.query.dateTo);
        dateTo.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = dateTo;
      }
    }

    // Build sort object
    const sort = {};
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    switch (sortBy) {
      case 'createdAt':
        sort.createdAt = sortOrder;
        break;
      case 'totalAmount':
        sort.totalAmount = sortOrder;
        break;
      case 'userName':
        // We'll sort by user name after population
        sort.createdAt = sortOrder; // Fallback for now
        break;
      default:
        sort.createdAt = -1; // Default sort by newest first
    }

    // Get total count for pagination
    const totalBookings = await Booking.countDocuments(filter);
    const totalPages = Math.ceil(totalBookings / limit);

    // Fetch bookings with pagination
    let bookings = await Booking.find(filter)
      .populate("userId", "name email")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Sort by user name if requested (after population)
    if (sortBy === 'userName') {
      bookings = bookings.sort((a, b) => {
        const nameA = a.userId?.name || '';
        const nameB = b.userId?.name || '';
        return sortOrder === 1 ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
    }

    // Return paginated response
    res.json({
      bookings,
      pagination: {
        currentPage: page,
        totalPages,
        totalBookings,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      },
      filters: {
        status: req.query.status || null,
        paymentStatus: req.query.paymentStatus || null,
        dateFrom: req.query.dateFrom || null,
        dateTo: req.query.dateTo || null
      },
      sorting: {
        sortBy,
        sortOrder: req.query.sortOrder || 'desc'
      }
    });
  } catch (error) {
    console.error('Error in getBookingsByEvent:', error);
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

    // Verify user is authorized to verify tickets for this event
    const event = await Event.findById(booking.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const isOwner = event.organizerId.toString() === req.user._id.toString();
    const isCoOrganizer = event.coOrganizers?.some(
      coOrgId => coOrgId.toString() === req.user._id.toString()
    );
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isCoOrganizer && !isAdmin) {
      return res.status(403).json({ 
        message: "Not authorized to verify tickets for this event" 
      });
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
        ticketItems: booking.ticketItems,
        totalQuantity: booking.totalQuantity,
        hasTicketCategories: booking.hasTicketCategories,
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
    const booking = await Booking.findById(req.params.id).populate("eventId");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this ticket" });
    }

    // Build response based on booking type
    const response = {
      ticketId: booking.ticketId,
      qrCode: booking.qrCode,
      verified: booking.verified,
      hasTicketCategories: booking.hasTicketCategories || false,
      event: booking.eventId
        ? {
            title: booking.eventId.title,
            date: booking.eventId.date,
            location: booking.eventId.venue?.name || booking.eventId.venue,
          }
        : null,
    };

    if (booking.hasTicketCategories && booking.ticketItems) {
      response.ticketItems = booking.ticketItems;
      response.totalQuantity = booking.totalQuantity;
    } else {
      response.seats = booking.noOfSeats;
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
