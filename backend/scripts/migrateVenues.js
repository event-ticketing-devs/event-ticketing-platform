// Migration script to convert old venue format to new venue format
// Run this script after updating the Event model

import mongoose from "mongoose";
import Event from "../src/models/Event.js";
import dotenv from "dotenv";

dotenv.config();

const migrateVenues = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://parth:parth123@event-ticketing-cluster.zqxidy9.mongodb.net/event-ticketing-platform"
    );
    console.log("Connected to MongoDB");

    // Find events with old venue format (string)
    const eventsToMigrate = await Event.find({
      $or: [{ venue: { $type: "string" } }, { city: { $exists: false } }],
    });

    console.log(`Found ${eventsToMigrate.length} events to migrate`);

    for (const event of eventsToMigrate) {
      try {
        let updateData = {};

        // If venue is still a string, convert it
        if (typeof event.venue === "string") {
          // Extract city from venue string (basic logic)
          const venueString = event.venue;
          const cityGuess = extractCityFromVenue(venueString);

          updateData.city = cityGuess || "Unknown City";
          updateData.venue = {
            name: venueString,
            address: venueString,
            coordinates: {
              lat: 28.6139, // Default to Delhi coordinates
              lng: 77.209,
            },
            placeId: null,
          };
        }

        // If city doesn't exist, add a default
        if (!event.city) {
          updateData.city = updateData.city || "Unknown City";
        }

        if (Object.keys(updateData).length > 0) {
          await Event.findByIdAndUpdate(event._id, updateData);
          console.log(`Migrated event: ${event.title}`);
        }
      } catch (err) {
        console.error(`Error migrating event ${event.title}:`, err.message);
      }
    }

    console.log("Migration completed");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
  }
};

// Basic function to extract city from venue string
const extractCityFromVenue = (venueString) => {
  const cityKeywords = [
    "Delhi",
    "Mumbai",
    "Bangalore",
    "Chennai",
    "Kolkata",
    "Hyderabad",
    "Pune",
    "Ahmedabad",
  ];

  for (const city of cityKeywords) {
    if (venueString.toLowerCase().includes(city.toLowerCase())) {
      return city;
    }
  }

  // Try to extract city from common patterns
  const patterns = [
    /,\s*([^,]+)$/, // Last part after comma
    /\bin\s+([^,\s]+)/i, // "in CityName"
    /\bat\s+([^,\s]+)/i, // "at CityName"
  ];

  for (const pattern of patterns) {
    const match = venueString.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
};

// Run the migration
migrateVenues();
