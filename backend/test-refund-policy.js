import { calculateRefundPolicy } from "./src/utils/refundPolicy.js";

// Test the time-based refund policy calculation
const testRefundPolicy = () => {
  console.log("Testing Time-based Refund Policy...\n");

  const testCases = [
    {
      description: "10 days before event (should be 100%)",
      eventDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      ticketPrice: 1000,
      seats: 2,
      expected: { percentage: 100, amount: 2000 },
    },
    {
      description: "5 days before event (should be 50%)",
      eventDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      ticketPrice: 1000,
      seats: 2,
      expected: { percentage: 50, amount: 1000 },
    },
    {
      description: "12 hours before event (should be 0%)",
      eventDate: new Date(Date.now() + 12 * 60 * 60 * 1000),
      ticketPrice: 1000,
      seats: 2,
      expected: { percentage: 0, amount: 0 },
    },
    {
      description: "Exactly 7 days before (should be 100%)",
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ticketPrice: 500,
      seats: 1,
      expected: { percentage: 100, amount: 500 },
    },
    {
      description: "Exactly 1 day before (should be 50%)",
      eventDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      ticketPrice: 800,
      seats: 3,
      expected: { percentage: 50, amount: 1200 },
    },
  ];

  testCases.forEach((testCase, index) => {
    const result = calculateRefundPolicy(
      testCase.eventDate,
      testCase.ticketPrice,
      testCase.seats
    );

    console.log(`Test ${index + 1}: ${testCase.description}`);
    console.log(`Event Date: ${testCase.eventDate.toLocaleString()}`);
    console.log(`Current Time: ${new Date().toLocaleString()}`);
    console.log(`Days Difference: ${result.daysDifference}`);
    console.log(`Total Amount: ₹${testCase.ticketPrice * testCase.seats}`);
    console.log(
      `Expected: ${testCase.expected.percentage}% (₹${testCase.expected.amount})`
    );
    console.log(
      `Actual: ${result.refundPercentage}% (₹${result.refundAmount})`
    );
    console.log(`Policy: ${result.policy}`);

    const passed =
      result.refundPercentage === testCase.expected.percentage &&
      result.refundAmount === testCase.expected.amount;

    console.log(`Status: ${passed ? "✅ PASSED" : "❌ FAILED"}\n`);
  });
};

// Run tests
testRefundPolicy();
