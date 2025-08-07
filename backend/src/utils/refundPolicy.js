/**
 * Calculate refund policy based on cancellation timing
 * @param {Date} eventDate - The date of the event
 * @param {number} ticketPrice - Price per ticket
 * @param {number} numberOfSeats - Number of seats booked
 * @returns {object} - { refundPercentage, refundAmount, policy }
 */
export const calculateRefundPolicy = (
  eventDate,
  ticketPrice,
  numberOfSeats
) => {
  const now = new Date();
  const eventTime = new Date(eventDate);
  const timeDifference = eventTime.getTime() - now.getTime();
  const daysDifference = timeDifference / (1000 * 60 * 60 * 24);

  const totalAmount = ticketPrice * numberOfSeats;

  let refundPercentage;
  let policy;

  // Use small epsilon to handle floating point precision issues
  const epsilon = 0.001; // About 1.4 minutes

  if (daysDifference >= 7 - epsilon) {
    // 7 or more days before event: 100% refund
    refundPercentage = 100;
    policy = "Full refund (7+ days before event)";
  } else if (daysDifference >= 1 - epsilon) {
    // 1-7 days before event: 50% refund
    refundPercentage = 50;
    policy = "Partial refund (1-7 days before event)";
  } else {
    // Less than 24 hours before event: No refund
    refundPercentage = 0;
    policy = "No refund (less than 24 hours before event)";
  }

  const refundAmount = Math.round((totalAmount * refundPercentage) / 100);

  return {
    refundPercentage,
    refundAmount,
    policy,
    daysDifference: Math.round(daysDifference * 10) / 10, // Round to 1 decimal place
  };
};
