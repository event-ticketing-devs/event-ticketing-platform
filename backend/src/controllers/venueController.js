import Venue from "../models/Venue.js";
import Space from "../models/Space.js";
import VenueRequest from "../models/VenueRequest.js";
import VenueQuote from "../models/VenueQuote.js";
import VenueInquiryChat from "../models/VenueInquiryChat.js";
import User from "../models/User.js";
import transporter from "../utils/mailer.js";
import { deleteVenueImage, deleteSpaceImage, deleteVenueDocument } from "../utils/cloudinary.js";

// @desc    Create a new venue
// @route   POST /api/venues
// @access  Private
export const createVenue = async (req, res) => {
  try {
    let {
      name,
      city,
      fullAddress,
      location,
      parking,
      primaryContact,
    } = req.body;

    // Parse JSON strings from FormData
    if (typeof location === 'string') {
      location = JSON.parse(location);
    }
    if (typeof parking === 'string') {
      parking = JSON.parse(parking);
    }
    if (typeof primaryContact === 'string') {
      primaryContact = JSON.parse(primaryContact);
    }

    // Validate required fields
    if (!name || !city || !fullAddress || !location?.coordinates?.lat || !location?.coordinates?.lng) {
      return res.status(400).json({ 
        message: "Name, city, address, and location coordinates are required" 
      });
    }

    if (!primaryContact?.name || !primaryContact?.phone || !primaryContact?.email) {
      return res.status(400).json({ 
        message: "Primary contact details (name, phone, email) are required" 
      });
    }

    // Handle parking structure
    let parkingData = { available: false, notes: '' };
    if (parking) {
      if (typeof parking.available === 'boolean') {
        parkingData = {
          available: parking.available,
          notes: parking.notes || ''
        };
      }
    }

    // Get photo URL from uploaded file
    const photo = req.file ? req.file.path : null;

    // Handle ownership document from uploaded files
    let ownershipDocument = null;
    let documentType = "";
    let documentUploadedAt = null;
    let documentVerificationStatus = "";

    if (req.files && req.files.ownershipDocument && req.files.ownershipDocument[0]) {
      const docFile = req.files.ownershipDocument[0];
      const fileExtension = docFile.originalname.split(".").pop().toLowerCase();
      
      ownershipDocument = {
        url: docFile.path,
        publicId: docFile.filename,
        fileName: docFile.originalname,
      };
      documentType = fileExtension;
      documentUploadedAt = new Date();
      documentVerificationStatus = "pending";
    }

    // Create venue with current user as owner
    const venue = await Venue.create({
      name,
      city,
      fullAddress,
      description: req.body.description || "",
      location,
      parking: parkingData,
      primaryContact,
      owner: req.user._id,
      photo,
      verificationStatus: "unverified",
      ownershipDocument,
      documentType,
      documentUploadedAt,
      documentVerificationStatus,
    });

    const populatedVenue = await Venue.findById(venue._id)
      .populate("owner", "name email");

    // Notify admins if document was uploaded
    if (ownershipDocument) {
      try {
        const admins = await User.find({ role: "admin" }).select("email name");
        if (admins.length > 0) {
          const adminEmails = admins.map(admin => admin.email);
          await transporter.sendMail({
            from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
            to: adminEmails,
            subject: "New Venue Registration - Document Verification Required",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">New Venue Registration</h2>
                
                <p>A new venue has been registered and requires document verification:</p>
                
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>Venue Name:</strong> ${name}</p>
                  <p style="margin: 5px 0;"><strong>City:</strong> ${city}</p>
                  <p style="margin: 5px 0;"><strong>Owner:</strong> ${req.user.name}</p>
                  <p style="margin: 5px 0;"><strong>Document Type:</strong> ${documentType.toUpperCase()}</p>
                </div>
                
                <p style="margin-top: 20px;">
                  <a href="${process.env.FRONTEND_URL}/admin/venues" 
                     style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Review Venue
                  </a>
                </p>
              </div>
            `,
          });
        }
      } catch (emailError) {
        console.error("Failed to send admin notification email:", emailError);
      }
    }

    res.status(201).json(populatedVenue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update venue
// @route   PATCH /api/venues/:id
// @access  Private (Venue owner only)
export const updateVenue = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    // Only owner can update venue
    if (venue.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: "Only venue owner can update venue details" 
      });
    }

    // Parse JSON strings from FormData
    if (typeof req.body.location === 'string') {
      req.body.location = JSON.parse(req.body.location);
    }
    if (typeof req.body.parking === 'string') {
      req.body.parking = JSON.parse(req.body.parking);
    }
    if (typeof req.body.primaryContact === 'string') {
      req.body.primaryContact = JSON.parse(req.body.primaryContact);
    }
    if (typeof req.body.teamMembers === 'string') {
      req.body.teamMembers = JSON.parse(req.body.teamMembers);
    }

    // Handle team members - convert emails to ObjectIds
    if (req.body.teamMembers !== undefined) {
      const teamMemberEmails = Array.isArray(req.body.teamMembers) ? req.body.teamMembers : [];
      const teamMemberIds = [];
      const notFoundEmails = [];
      
      for (const email of teamMemberEmails) {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
          teamMemberIds.push(user._id);
        } else {
          notFoundEmails.push(email);
        }
      }
      
      venue.teamMembers = teamMemberIds;
      
      // Store not found emails to return in response
      if (notFoundEmails.length > 0) {
        req.notFoundTeamMembers = notFoundEmails;
      }
    }

    // Fields that can be updated (excluding teamMembers, parking - handled below)
    const allowedUpdates = [
      "name",
      "city",
      "fullAddress",
      "description",
      "location",
      "primaryContact",
      "isListed",
    ];

    // Update only allowed fields
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        venue[field] = req.body[field];
      }
    });

    // Handle parking structure
    if (req.body.parking !== undefined) {
      let parkingData = { available: false, notes: '' };
      if (typeof req.body.parking.available === 'boolean') {
        parkingData = {
          available: req.body.parking.available,
          notes: req.body.parking.notes || ''
        };
      }
      venue.parking = parkingData;
    }

    // Handle photo update
    if (req.file) {
      // Delete old photo if exists
      if (venue.photo) {
        await deleteVenueImage(venue.photo);
      }
      venue.photo = req.file.path;
    }

    await venue.save();

    const updatedVenue = await Venue.findById(venue._id)
      .populate("owner", "name email")
      .populate("teamMembers", "name email");

    const response = { venue: updatedVenue };
    
    if (req.notFoundTeamMembers && req.notFoundTeamMembers.length > 0) {
      response.warning = `The following email(s) were not found and not added: ${req.notFoundTeamMembers.join(', ')}`;
      response.notFoundEmails = req.notFoundTeamMembers;
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all venues with filters
// @route   GET /api/venues
// @access  Public
export const getVenues = async (req, res) => {
  try {
    const { city, eventType, minPax, startDate, endDate } = req.query;

    // Build venue filter - only verified and listed venues
    const venueFilter = { 
      verificationStatus: "verified",
      isListed: true
    };
    if (city) {
      venueFilter.city = new RegExp(city, "i");
    }

    // Build space filter (without date restrictions initially)
    const spaceFilter = { isActive: true };
    if (eventType) {
      // Handle "other" to match all "other:*" variations
      if (eventType === "other") {
        spaceFilter.supportedEventTypes = { $regex: /^other/ };
      } else {
        spaceFilter.supportedEventTypes = { $in: [eventType] };
      }
    }
    if (minPax) {
      spaceFilter.maxPax = { $gte: parseInt(minPax) };
    }

    // Find venues that have matching active spaces
    const spaces = await Space.find(spaceFilter).distinct("venue");
    venueFilter._id = { $in: spaces };

    const venues = await Venue.find(venueFilter)
      .populate("owner", "name email")
      .select("-teamMembers")
      .lean();

    // Check availability for requested dates if provided
    if (startDate && endDate) {
      const requestStart = new Date(startDate);
      const requestEnd = new Date(endDate);

      // Get all spaces for these venues
      const allVenueSpaces = await Space.find({ 
        venue: { $in: venues.map(v => v._id) },
        isActive: true 
      }).lean();

      // Check each venue's availability
      venues.forEach(venue => {
        const venueSpaces = allVenueSpaces.filter(s => s.venue.toString() === venue._id.toString());
        
        // Check if any space is available for the requested dates
        const hasAvailableSpace = venueSpaces.some(space => {
          // Apply other filters (eventType, minPax)
          if (eventType) {
            // Handle "other" to match all "other:*" variations
            const matchesEventType = eventType === "other" 
              ? space.supportedEventTypes.some(t => t.startsWith("other"))
              : space.supportedEventTypes.includes(eventType);
            if (!matchesEventType) {
              return false;
            }
          }
          if (minPax && space.maxPax < parseInt(minPax)) {
            return false;
          }

          // Check if space has no blocking availability for the requested dates
          if (!space.availability || space.availability.length === 0) {
            return true; // No blocks, space is available
          }

          // Check for overlapping blocks
          const hasOverlap = space.availability.some(block => {
            const blockStart = new Date(block.start);
            const blockEnd = new Date(block.end);
            
            return (
              // Request starts within block
              (requestStart >= blockStart && requestStart < blockEnd) ||
              // Request ends within block
              (requestEnd > blockStart && requestEnd <= blockEnd) ||
              // Request completely contains block
              (requestStart <= blockStart && requestEnd >= blockEnd) ||
              // Block completely contains request
              (blockStart <= requestStart && blockEnd >= requestEnd)
            );
          });

          return !hasOverlap; // Available if no overlap
        });

        venue.isAvailableForDates = hasAvailableSpace;
      });
    } else {
      // If no dates provided, don't set availability flag
      venues.forEach(venue => {
        venue.isAvailableForDates = null;
      });
    }

    res.json(venues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get venue by ID with spaces
// @route   GET /api/venues/:id
// @access  Public
export const getVenueById = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id)
      .populate("owner", "name email")
      .populate("teamMembers", "name email")
      .lean();

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    // Get associated active spaces
    const spaces = await Space.find({ 
      venue: req.params.id, 
      isActive: true 
    }).lean();

    res.json({ ...venue, spaces });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get venue request by ID with quotes
// @route   GET /api/venue-requests/:id
// @access  Private
export const getVenueRequestById = async (req, res) => {
  try {
    const venueRequest = await VenueRequest.findById(req.params.id)
      .populate("organizer", "name email")
      .populate("venue", "name city fullAddress primaryContact")
      .populate("space", "name type maxPax areaSqFt")
      .lean();

    if (!venueRequest) {
      return res.status(404).json({ message: "Venue request not found" });
    }

    // Check if user is authorized to view this request
    const isOrganizer = venueRequest.organizer._id.toString() === req.user._id.toString();
    
    // Get venue to check if user is owner or team member
    const venue = await Venue.findById(venueRequest.venue._id);
    const isVenueOwner = venue && venue.owner.toString() === req.user._id.toString();
    const isVenueTeamMember = venue && venue.teamMembers.some(
      (member) => member.toString() === req.user._id.toString()
    );
    const isAdmin = req.user.role === "admin";

    if (!isOrganizer && !isVenueOwner && !isVenueTeamMember && !isAdmin) {
      return res.status(403).json({ 
        message: "Not authorized to view this request" 
      });
    }

    // Get associated quotes
    const quotes = await VenueQuote.find({ request: req.params.id })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ request: venueRequest, quotes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get organizer's venue enquiries
// @route   GET /api/venue-requests/my-enquiries
// @access  Private
export const getMyEnquiries = async (req, res) => {
  try {
    const enquiries = await VenueRequest.find({ organizer: req.user._id })
      .populate("venue", "name city")
      .populate("space", "name type")
      .sort({ createdAt: -1 })
      .lean();

    // Get quotes for each enquiry
    const enquiriesWithQuotes = await Promise.all(
      enquiries.map(async (enquiry) => {
        const quotes = await VenueQuote.find({ request: enquiry._id })
          .select("quotedAmount terms createdAt")
          .sort({ createdAt: -1 })
          .lean();
        return { ...enquiry, quotes };
      })
    );

    res.json(enquiriesWithQuotes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get venue partner's enquiries
// @route   GET /api/venue-requests/venue-enquiries
// @access  Private
export const getVenueEnquiries = async (req, res) => {
  try {
    // Find venues where user is owner or team member
    const venues = await Venue.find({
      $or: [
        { owner: req.user._id },
        { teamMembers: req.user._id }
      ]
    }).select("_id");

    const venueIds = venues.map(v => v._id);

    // Get all enquiries for these venues
    const enquiries = await VenueRequest.find({ venue: { $in: venueIds } })
      .populate("organizer", "name email")
      .populate("venue", "name city")
      .populate("space", "name type")
      .sort({ createdAt: -1 })
      .lean();

    res.json(enquiries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new space
// @route   POST /api/spaces
// @access  Private (Venue owner or team member)
export const createSpace = async (req, res) => {
  try {
    let {
      venue,
      name,
      type,
      indoorOutdoor,
      description,
      maxPax,
      areaSqFt,
      supportedEventTypes,
      bookingUnit,
      priceRange,
      amenities,
      policies,
    } = req.body;

    // Parse JSON strings from FormData
    if (typeof supportedEventTypes === 'string') {
      supportedEventTypes = JSON.parse(supportedEventTypes);
    }
    if (typeof amenities === 'string') {
      amenities = JSON.parse(amenities);
    }
    if (typeof policies === 'string') {
      policies = JSON.parse(policies);
    }
    if (typeof priceRange === 'string') {
      priceRange = JSON.parse(priceRange);
    }

    // Validate required fields
    if (!venue || !name || !type || !maxPax || !supportedEventTypes || !bookingUnit) {
      return res.status(400).json({ 
        message: "Venue, name, type, max capacity, supported event types, and booking unit are required" 
      });
    }

    // Validate price range
    if (!priceRange || !priceRange.min || !priceRange.max) {
      return res.status(400).json({ 
        message: "Price range (min and max) is required" 
      });
    }

    const minPrice = parseFloat(priceRange.min);
    const maxPrice = parseFloat(priceRange.max);

    if (isNaN(minPrice) || isNaN(maxPrice)) {
      return res.status(400).json({ 
        message: "Price range must be valid numbers" 
      });
    }

    if (minPrice < 0 || maxPrice < 0) {
      return res.status(400).json({ 
        message: "Price cannot be negative" 
      });
    }

    if (maxPrice < minPrice) {
      return res.status(400).json({ 
        message: "Maximum price must be greater than or equal to minimum price" 
      });
    }

    // Verify venue exists and user is owner or team member
    const venueDoc = await Venue.findById(venue);
    if (!venueDoc) {
      return res.status(404).json({ message: "Venue not found" });
    }

    const isOwner = venueDoc.owner.toString() === req.user._id.toString();
    const isTeamMember = venueDoc.teamMembers.some(
      (member) => member.toString() === req.user._id.toString()
    );

    if (!isOwner && !isTeamMember) {
      return res.status(403).json({ 
        message: "Only venue owner or team members can create spaces" 
      });
    }

    // Handle amenities structure (backward compatible)
    let amenitiesData = { standard: [], custom: [] };
    if (amenities) {
      if (amenities.standard || amenities.custom) {
        // New structure
        amenitiesData = {
          standard: amenities.standard || [],
          custom: (amenities.custom || []).map(item => item.trim()),
        };
      } else if (Array.isArray(amenities)) {
        // Old structure - treat as custom
        amenitiesData.custom = amenities.map(item => item.trim());
      }
    }

    // Handle policies structure
    let policiesData = {
      allowedItems: { standard: [], custom: [] },
      bannedItems: { standard: [], custom: [] },
      additionalPolicy: ""
    };
    if (policies) {
      policiesData = {
        allowedItems: {
          standard: policies.allowedItems?.standard || [],
          custom: (policies.allowedItems?.custom || []).map(item => item.trim()),
        },
        bannedItems: {
          standard: policies.bannedItems?.standard || [],
          custom: (policies.bannedItems?.custom || []).map(item => item.trim()),
        },
        additionalPolicy: policies.additionalPolicy || ""
      };
    }

    // Create space
    const space = await Space.create({
      venue,
      name,
      type,
      indoorOutdoor,
      description: description || "",
      maxPax,
      areaSqFt,
      supportedEventTypes,
      bookingUnit,
      priceRange: {
        min: minPrice,
        max: maxPrice,
      },
      amenities: amenitiesData,
      policies: policiesData,
      photos: req.files ? req.files.map(file => file.path) : [],
      availability: [],
      isActive: true,
    });

    const populatedSpace = await Space.findById(space._id)
      .populate("venue", "name city");

    res.status(201).json(populatedSpace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update space
// @route   PATCH /api/spaces/:id
// @access  Private (Venue owner or team member)
export const updateSpace = async (req, res) => {
  try {
    const space = await Space.findById(req.params.id).populate("venue");

    if (!space) {
      return res.status(404).json({ message: "Space not found" });
    }

    // Parse JSON strings from FormData
    if (typeof req.body.supportedEventTypes === 'string') {
      req.body.supportedEventTypes = JSON.parse(req.body.supportedEventTypes);
    }
    if (typeof req.body.amenities === 'string') {
      req.body.amenities = JSON.parse(req.body.amenities);
    }
    if (typeof req.body.policies === 'string') {
      req.body.policies = JSON.parse(req.body.policies);
    }

    // Verify user is venue owner or team member
    const isOwner = space.venue.owner.toString() === req.user._id.toString();
    const isTeamMember = space.venue.teamMembers.some(
      (member) => member.toString() === req.user._id.toString()
    );

    if (!isOwner && !isTeamMember) {
      return res.status(403).json({ 
        message: "Only venue owner or team members can update spaces" 
      });
    }

    // Fields that can be updated
    const allowedUpdates = [
      "name",
      "type",
      "indoorOutdoor",
      "description",
      "maxPax",
      "areaSqFt",
      "supportedEventTypes",
      "bookingUnit",
      "isActive",
    ];

    // Update only allowed fields
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        space[field] = req.body[field];
      }
    });

    // Handle price range update
    if (req.body.priceRange !== undefined) {
      const { min, max } = req.body.priceRange;
      
      if (min === undefined || max === undefined) {
        return res.status(400).json({ 
          message: "Both min and max price are required" 
        });
      }

      const minPrice = parseFloat(min);
      const maxPrice = parseFloat(max);

      if (isNaN(minPrice) || isNaN(maxPrice)) {
        return res.status(400).json({ 
          message: "Price range must be valid numbers" 
        });
      }

      if (minPrice < 0 || maxPrice < 0) {
        return res.status(400).json({ 
          message: "Price cannot be negative" 
        });
      }

      if (maxPrice < minPrice) {
        return res.status(400).json({ 
          message: "Maximum price must be greater than or equal to minimum price" 
        });
      }

      space.priceRange = {
        min: minPrice,
        max: maxPrice,
      };
    }

    // Handle amenities separately with structure conversion
    if (req.body.amenities !== undefined) {
      let amenitiesData = { standard: [], custom: [] };
      if (req.body.amenities.standard || req.body.amenities.custom) {
        // New structure
        amenitiesData = {
          standard: req.body.amenities.standard || [],
          custom: (req.body.amenities.custom || []).map(item => item.trim()),
        };
      } else if (Array.isArray(req.body.amenities)) {
        // Old structure - treat as custom
        amenitiesData.custom = req.body.amenities.map(item => item.trim());
      }
      space.amenities = amenitiesData;
    }

    // Handle policies separately with structure conversion
    if (req.body.policies !== undefined) {
      let policiesData = {
        allowedItems: { standard: [], custom: [] },
        bannedItems: { standard: [], custom: [] },
        additionalPolicy: ""
      };
      if (req.body.policies) {
        policiesData = {
          allowedItems: {
            standard: req.body.policies.allowedItems?.standard || [],
            custom: (req.body.policies.allowedItems?.custom || []).map(item => item.trim()),
          },
          bannedItems: {
            standard: req.body.policies.bannedItems?.standard || [],
            custom: (req.body.policies.bannedItems?.custom || []).map(item => item.trim()),
          },
          additionalPolicy: req.body.policies.additionalPolicy || ""
        };
      }
      space.policies = policiesData;
    }

    // Handle photos update
    if (req.files && req.files.length > 0) {
      // Delete old photos
      if (space.photos && space.photos.length > 0) {
        await Promise.all(space.photos.map(photo => deleteSpaceImage(photo)));
      }
      // Add new photos
      space.photos = req.files.map(file => file.path);
    }

    await space.save();

    const updatedSpace = await Space.findById(space._id)
      .populate("venue", "name city");

    res.json(updatedSpace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete/deactivate space
// @route   DELETE /api/spaces/:id
// @access  Private (Venue owner only)
export const deleteSpace = async (req, res) => {
  try {
    const space = await Space.findById(req.params.id).populate("venue");

    if (!space) {
      return res.status(404).json({ message: "Space not found" });
    }

    // Only owner can delete spaces
    const isOwner = space.venue.owner.toString() === req.user._id.toString();

    if (!isOwner) {
      return res.status(403).json({ 
        message: "Only venue owner can delete spaces" 
      });
    }

    // Delete photos from Cloudinary
    if (space.photos && space.photos.length > 0) {
      await Promise.all(space.photos.map(photo => deleteSpaceImage(photo)));
    }

    // Soft delete by setting isActive to false
    space.isActive = false;
    await space.save();

    res.json({ message: "Space deactivated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my venues (for venue partner)
// @route   GET /api/venues/my-venues
// @access  Private
export const getMyVenues = async (req, res) => {
  try {
    const venues = await Venue.find({
      $or: [
        { owner: req.user._id },
        { teamMembers: req.user._id }
      ]
    })
      .populate("owner", "name email")
      .populate("teamMembers", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.json(venues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my spaces (for venue partner)
// @route   GET /api/spaces/my-spaces
// @access  Private
export const getMySpaces = async (req, res) => {
  try {
    // Find venues owned by or where user is a team member
    const venues = await Venue.find({
      $or: [
        { owner: req.user._id },
        { teamMembers: req.user._id }
      ]
    }).select("_id");

    const venueIds = venues.map(v => v._id);

    const spaces = await Space.find({ 
      venue: { $in: venueIds }
    })
      .populate("venue", "name city")
      .sort({ createdAt: -1 })
      .lean();

    res.json(spaces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get public spaces with filters
// @route   GET /api/spaces/search
// @access  Public
export const getPublicSpaces = async (req, res) => {
  try {
    const { search, city, eventType, minPax, maxPax, spaceType, indoorOutdoor, startDate, endDate, parking, amenities, allowedItems, bannedItems, minBudget, maxBudget, venueId, sortBy, sortOrder, page, limit } = req.query;

    // Build space filter
    const spaceFilter = { isActive: true };
    
    // Filter by venue if venueId is provided
    if (venueId) {
      spaceFilter.venue = venueId;
    }
    
    if (eventType) {
      // Handle "other" to match all "other:*" variations
      if (eventType === "other") {
        spaceFilter.supportedEventTypes = { $regex: /^other/ };
      } else {
        spaceFilter.supportedEventTypes = { $in: [eventType] };
      }
    }
    
    // Filter by capacity (handle both min and max pax properly)
    if (minPax && maxPax) {
      spaceFilter.maxPax = { 
        $gte: parseInt(minPax),
        $lte: parseInt(maxPax)
      };
    } else if (minPax) {
      spaceFilter.maxPax = { $gte: parseInt(minPax) };
    } else if (maxPax) {
      spaceFilter.maxPax = { $lte: parseInt(maxPax) };
    }
    
    if (spaceType) {
      spaceFilter.type = spaceType;
    }
    if (indoorOutdoor) {
      spaceFilter.indoorOutdoor = indoorOutdoor;
    }

    // Filter by price range (budget overlap logic)
    // Show spaces where their price range overlaps with user's budget
    if (minBudget || maxBudget) {
      const min = minBudget ? parseFloat(minBudget) : 0;
      const max = maxBudget ? parseFloat(maxBudget) : Number.MAX_SAFE_INTEGER;
      
      // Overlap condition: space.max >= user.min AND space.min <= user.max
      spaceFilter.$and = [
        { 'priceRange.max': { $gte: min } },
        { 'priceRange.min': { $lte: max } }
      ];
    }

    // Filter by standard amenities (only search standard amenities)
    if (amenities) {
      const amenitiesArray = amenities.split(',').map(a => a.trim()).filter(Boolean);
      if (amenitiesArray.length > 0) {
        spaceFilter['amenities.standard'] = { $all: amenitiesArray };
      }
    }

    // Filter by allowed items (space must allow these items)
    if (allowedItems) {
      const allowedItemsArray = allowedItems.split(',').map(a => a.trim()).filter(Boolean);
      if (allowedItemsArray.length > 0) {
        spaceFilter['policies.allowedItems.standard'] = { $all: allowedItemsArray };
      }
    }

    // Filter by banned items (space must NOT ban these items)
    // Filter by banned items (Must NOT ban)
    if (bannedItems) {
      const bannedItemsArray = bannedItems
        .split(',')
        .map(i => i.trim())
        .filter(Boolean);

      if (bannedItemsArray.length > 0) {
        spaceFilter['policies.bannedItems.standard'] = {
          $nin: bannedItemsArray
        };
      }
    }

    // Build venue filter
    // Skip venue verification checks if fetching by specific venueId (for admin use)
    const venueFilter = venueId ? {} : { 
      verificationStatus: "verified",
      isListed: true
    };

    // Add city filter if provided
    if (city) {
      venueFilter.city = new RegExp(city, "i");
    }

    // Filter by parking
    if (parking === 'true') {
      venueFilter['parking.available'] = true;
    }

    // Get spaces
    let spaces = await Space.find(spaceFilter)
      .populate({
        path: "venue",
        match: Object.keys(venueFilter).length > 0 ? venueFilter : undefined,
        select: "name city fullAddress verificationStatus parking"
      })
      .lean();

    // Filter out spaces where venue didn't match (only if venue filter was applied)
    if (Object.keys(venueFilter).length > 0) {
      spaces = spaces.filter(space => space.venue);
    }

    // Apply text search filter for space name or venue name (after population)
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      spaces = spaces.filter(space => 
        searchRegex.test(space.name) || (space.venue && searchRegex.test(space.venue.name))
      );
    }

    // Check availability for requested dates if provided
    if (startDate && endDate) {
      const requestStart = new Date(startDate);
      const requestEnd = new Date(endDate);

      spaces = spaces.map(space => {
        // Check if space has overlapping blocks
        const hasOverlap = space.availability && space.availability.some(block => {
          const blockStart = new Date(block.start);
          const blockEnd = new Date(block.end);
          
          return (
            (requestStart >= blockStart && requestStart < blockEnd) ||
            (requestEnd > blockStart && requestEnd <= blockEnd) ||
            (requestStart <= blockStart && requestEnd >= blockEnd) ||
            (blockStart <= requestStart && blockEnd >= requestEnd)
          );
        });

        return {
          ...space,
          isAvailableForDates: !hasOverlap
        };
      });
    }

    // Apply sorting
    if (sortBy === 'venue') {
      const order = sortOrder === 'desc' ? -1 : 1;
      spaces.sort((a, b) => {
        const nameA = (a.venue?.name || '').toLowerCase();
        const nameB = (b.venue?.name || '').toLowerCase();
        if (nameA < nameB) return -1 * order;
        if (nameA > nameB) return 1 * order;
        return 0;
      });
    }

    // Apply pagination
    const totalCount = spaces.length;
    if (page && limit) {
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      spaces = spaces.slice(startIndex, endIndex);
      
      return res.json({
        spaces,
        total: totalCount,
        page: pageNum,
        totalPages: Math.ceil(totalCount / limitNum)
      });
    }

    res.json(spaces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get space by ID
// @route   GET /api/spaces/:id
// @access  Private
export const getSpaceById = async (req, res) => {
  try {
    const space = await Space.findById(req.params.id)
      .populate("venue", "name city fullAddress owner teamMembers");

    if (!space) {
      return res.status(404).json({ message: "Space not found" });
    }

    res.json(space);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get availability blocks for a space
// @route   GET /api/spaces/:id/blocks
// @access  Private (Venue owner or team member)
export const getSpaceBlocks = async (req, res) => {
  try {
    const space = await Space.findById(req.params.id).populate("venue");

    if (!space) {
      return res.status(404).json({ message: "Space not found" });
    }

    // Verify user has access
    const isOwner = space.venue.owner.toString() === req.user._id.toString();
    const isTeamMember = space.venue.teamMembers.some(
      (member) => member.toString() === req.user._id.toString()
    );

    if (!isOwner && !isTeamMember) {
      return res.status(403).json({ 
        message: "Not authorized to view availability blocks" 
      });
    }

    // Return availability blocks
    res.json(space.availability || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create venue request (enquiry)
// @route   POST /api/venue-requests
// @access  Private
export const createVenueRequest = async (req, res) => {
  try {
    const {
      venue,
      space,
      eventDateStart,
      eventDateEnd,
      expectedPax,
      eventType,
      eventName,
      budgetMin,
      budgetMax,
      notes,
    } = req.body;

    // Validate budgetMin <= budgetMax
    if (budgetMin > budgetMax) {
      return res.status(400).json({ 
        message: "Minimum budget cannot be greater than maximum budget" 
      });
    }

    // Validate space exists and is active
    const spaceDoc = await Space.findById(space).populate("venue");
    if (!spaceDoc) {
      return res.status(404).json({ message: "Space not found" });
    }
    if (!spaceDoc.isActive) {
      return res.status(400).json({ message: "This space is not available for booking" });
    }

    // Validate space supports the event type
    const matchesEventType = spaceDoc.supportedEventTypes.includes(eventType) ||
      (eventType.startsWith("other:") && spaceDoc.supportedEventTypes.some(t => t.startsWith("other:"))) ||
      (eventType === "other" && spaceDoc.supportedEventTypes.some(t => t.startsWith("other:")));
    
    if (!matchesEventType) {
      return res.status(400).json({ 
        message: `This space does not support ${eventType} events` 
      });
    }

    // Validate space has enough capacity
    if (spaceDoc.maxPax < expectedPax) {
      return res.status(400).json({ 
        message: `This space has a maximum capacity of ${spaceDoc.maxPax}, but you need ${expectedPax}` 
      });
    }

    // Create venue request
    const venueRequest = await VenueRequest.create({
      organizer: req.user._id,
      venue,
      space,
      eventDateStart,
      eventDateEnd,
      expectedPax,
      eventType,
      eventName,
      budgetMax,
      notes,
      status: "open",
    });

    // Create associated chat
    await VenueInquiryChat.create({
      request: venueRequest._id,
      messages: [],
    });

    // Notify venue owner
    const venueDoc = await Venue.findById(venue).populate("owner", "name email");
    if (venueDoc?.owner?.email) {
      try {
        await transporter.sendMail({
          from: '"Event Ticketing" <noreply@eventify.com>',
          to: venueDoc.owner.email,
          subject: `New Venue Enquiry for ${spaceDoc.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2d7ff9;">New Venue Enquiry</h2>
              
              <p>Hi ${venueDoc.owner.name},</p>
              
              <p>You have received a new enquiry for <strong>${spaceDoc.name}</strong> at ${venueDoc.name}.</p>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p><strong>Event Type:</strong> ${eventType}</p>
                <p><strong>Expected Attendees:</strong> ${expectedPax}</p>
                <p><strong>Event Dates:</strong> ${new Date(eventDateStart).toLocaleDateString('en-IN')} - ${new Date(eventDateEnd).toLocaleDateString('en-IN')}</p>
                <p><strong>Budget:</strong> ₹${budgetMax.toLocaleString()}</p>
                ${notes ? `<p><strong>Additional Notes:</strong> ${notes}</p>` : ''}
              </div>
              
              <p>Please log in to your dashboard to review and respond to this enquiry.</p>
              
              <p>Best regards,<br>Event Ticketing Team</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send notification email:", emailError);
      }
    }

    const populatedRequest = await VenueRequest.findById(venueRequest._id)
      .populate("venue", "name city")
      .populate("space", "name type");

    res.status(201).json(populatedRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create venue quote
// @route   POST /api/venue-quotes
// @access  Private (Venue owner or team member)
export const createVenueQuote = async (req, res) => {
  try {
    const { requestId, quotedAmount, terms } = req.body;

    // Get venue request
    const venueRequest = await VenueRequest.findById(requestId)
      .populate("venue")
      .populate("space", "name")
      .populate("organizer", "name email");

    if (!venueRequest) {
      return res.status(404).json({ message: "Venue request not found" });
    }

    // Check if request is still open
    if (venueRequest.status !== "open") {
      return res.status(400).json({ 
        message: `Cannot quote on a request with status: ${venueRequest.status}` 
      });
    }

    // Verify user is venue owner or team member
    const isOwner = venueRequest.venue.owner.toString() === req.user._id.toString();
    const isTeamMember = venueRequest.venue.teamMembers.some(
      (member) => member.toString() === req.user._id.toString()
    );

    if (!isOwner && !isTeamMember) {
      return res.status(403).json({ 
        message: "Only venue owner or team members can create quotes" 
      });
    }

    // Create quote
    const quote = await VenueQuote.create({
      request: requestId,
      venue: venueRequest.venue._id,
      space: venueRequest.space._id,
      quotedAmount,
      terms,
      createdBy: req.user._id,
    });

    // Update venue request status to 'quoted'
    venueRequest.status = "quoted";
    await venueRequest.save();

    // Add system message to chat
    const chat = await VenueInquiryChat.findOne({ request: requestId });
    if (chat) {
      chat.messages.push({
        sender: req.user._id,
        text: `Quote sent: ₹${quotedAmount.toLocaleString()}${terms ? ` - ${terms}` : ''}`,
        attachments: [],
      });
      await chat.save();
    }

    // Notify organizer
    if (venueRequest.organizer?.email) {
      try {
        await transporter.sendMail({
          from: '"Event Ticketing" <noreply@eventify.com>',
          to: venueRequest.organizer.email,
          subject: `Quote Received for ${venueRequest.space.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2d7ff9;">Quote Received</h2>
              
              <p>Hi ${venueRequest.organizer.name},</p>
              
              <p>You have received a quote for your enquiry at <strong>${venueRequest.space.name}</strong>.</p>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p><strong>Quoted Amount:</strong> ₹${quotedAmount.toLocaleString()}</p>
                ${terms ? `<p><strong>Terms:</strong> ${terms}</p>` : ''}
              </div>
              
              <p>Please log in to your dashboard to review the quote and continue the conversation.</p>
              
              <p>Best regards,<br>Event Ticketing Team</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send quote notification:", emailError);
      }
    }

    const populatedQuote = await VenueQuote.findById(quote._id)
      .populate("request")
      .populate("venue", "name")
      .populate("space", "name")
      .populate("createdBy", "name");

    res.status(201).json(populatedQuote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Decline venue request
// @route   POST /api/venue-requests/:id/decline
// @access  Private (Venue owner or team member)
export const declineVenueRequest = async (req, res) => {
  try {
    const { reason } = req.body || {};

    const venueRequest = await VenueRequest.findById(req.params.id)
      .populate("venue")
      .populate("organizer", "name email")
      .populate("space", "name");

    if (!venueRequest) {
      return res.status(404).json({ message: "Venue request not found" });
    }

    // Verify user is venue owner or team member
    const isOwner = venueRequest.venue.owner.toString() === req.user._id.toString();
    const isTeamMember = venueRequest.venue.teamMembers.some(
      (member) => member.toString() === req.user._id.toString()
    );

    if (!isOwner && !isTeamMember) {
      return res.status(403).json({ 
        message: "Only venue owner or team members can decline requests" 
      });
    }

    // Update status
    venueRequest.status = "declined";
    venueRequest.declineReason = reason;
    venueRequest.declinedAt = new Date();
    await venueRequest.save();

    // Add system message to chat
    const chat = await VenueInquiryChat.findOne({ request: req.params.id });
    if (chat) {
      chat.messages.push({
        sender: req.user._id,
        text: `Request declined${reason ? `: ${reason}` : ''}`,
        attachments: [],
      });
      await chat.save();
    }

    // Notify organizer
    if (venueRequest.organizer?.email) {
      try {
        await transporter.sendMail({
          from: '"Event Ticketing" <noreply@eventify.com>',
          to: venueRequest.organizer.email,
          subject: `Venue Request Declined - ${venueRequest.space.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #dc3545;">Request Declined</h2>
              
              <p>Hi ${venueRequest.organizer.name},</p>
              
              <p>Your enquiry for <strong>${venueRequest.space.name}</strong> has been declined.</p>
              
              ${reason ? `
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p><strong>Reason:</strong> ${reason}</p>
              </div>
              ` : ''}
              
              <p>You can explore other venues on our platform.</p>
              
              <p>Best regards,<br>Event Ticketing Team</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send decline notification:", emailError);
      }
    }

    res.json({ message: "Request declined successfully", venueRequest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark venue request as externally booked
// @route   POST /api/venue-requests/:id/mark-booked
// @access  Private (Venue owner only)
export const markVenueRequestAsBooked = async (req, res) => {
  try {
    const venueRequest = await VenueRequest.findById(req.params.id)
      .populate("venue")
      .populate("organizer", "name email")
      .populate("space", "name");

    if (!venueRequest) {
      return res.status(404).json({ message: "Venue request not found" });
    }

    // Verify user is venue owner (not team member - only owner can confirm bookings)
    const isOwner = venueRequest.venue.owner.toString() === req.user._id.toString();

    if (!isOwner) {
      return res.status(403).json({ 
        message: "Only venue owner can mark requests as booked" 
      });
    }

    // Use provided dates or fall back to original enquiry dates
    const { startDate, endDate } = req.body || {};
    const bookingStartDate = startDate ? new Date(startDate) : new Date(venueRequest.eventDateStart);
    const bookingEndDate = endDate ? new Date(endDate) : new Date(venueRequest.eventDateEnd);

    // Validate dates
    if (bookingEndDate < bookingStartDate) {
      return res.status(400).json({ message: "End date cannot be before start date" });
    }

    // Update status to externally_booked
    venueRequest.status = "externally_booked";
    venueRequest.bookedAt = new Date();
    venueRequest.bookedBy = req.user._id;
    await venueRequest.save();

    // Block the space availability for the booked dates
    const space = await Space.findById(venueRequest.space._id);
    if (space) {
      // Check if there's already a block for these exact dates
      const existingBlock = space.availability.find(block => {
        return block.start.getTime() === bookingStartDate.getTime() &&
               block.end.getTime() === bookingEndDate.getTime() &&
               block.status === "booked";
      });

      // Only add if no exact match exists
      if (!existingBlock) {
        space.availability.push({
          start: bookingStartDate,
          end: bookingEndDate,
          status: "booked",
          reason: `Booked for ${venueRequest.organizer.name} - ${venueRequest.eventType || 'Event'}`,
          requestId: venueRequest._id, // Link block to request
        });
        await space.save();
      }
    }

    // Add system message to chat
    const chat = await VenueInquiryChat.findOne({ request: req.params.id });
    if (chat) {
      chat.messages.push({
        sender: req.user._id,
        text: `Booking confirmed externally for this enquiry`,
        attachments: [],
      });
      await chat.save();
    }

    // Notify organizer
    if (venueRequest.organizer?.email) {
      try {
        await transporter.sendMail({
          from: '"Event Ticketing" <noreply@eventify.com>',
          to: venueRequest.organizer.email,
          subject: `Booking Confirmed - ${venueRequest.space.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #28a745;">Booking Confirmed!</h2>
              
              <p>Hi ${venueRequest.organizer.name},</p>
              
              <p>Great news! Your booking for <strong>${venueRequest.space.name}</strong> has been confirmed.</p>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p><strong>Event Dates:</strong> ${new Date(venueRequest.eventDateStart).toLocaleDateString('en-IN')} - ${new Date(venueRequest.eventDateEnd).toLocaleDateString('en-IN')}</p>
                <p><strong>Space:</strong> ${venueRequest.space.name}</p>
              </div>
              
              <p><strong>Important:</strong> This confirmation is based on your off-platform arrangements with the venue. Please ensure all payments and documentation are completed directly with the venue.</p>
              
              <p>Best regards,<br>Event Ticketing Team</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send booking confirmation:", emailError);
      }
    }

    res.json({ 
      message: "Request marked as externally booked successfully", 
      venueRequest 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Block space availability
// @route   POST /api/spaces/:id/availability/block
// @access  Private (Venue owner or team member)
export const blockSpaceAvailability = async (req, res) => {
  try {
    const { startDate, endDate, start, end, reason } = req.body;

    // Support both parameter names
    const startDateValue = startDate || start;
    const endDateValue = endDate || end;

    if (!startDateValue || !endDateValue) {
      return res.status(400).json({ 
        message: "Start and end dates are required" 
      });
    }

    const parsedStartDate = new Date(startDateValue);
    const parsedEndDate = new Date(endDateValue);

    if (parsedEndDate <= parsedStartDate) {
      return res.status(400).json({ 
        message: "End date must be after start date" 
      });
    }

    // Get space with venue details
    const space = await Space.findById(req.params.id).populate("venue");

    if (!space) {
      return res.status(404).json({ message: "Space not found" });
    }

    // Verify user is venue owner or team member
    const isOwner = space.venue.owner.toString() === req.user._id.toString();
    const isTeamMember = space.venue.teamMembers.some(
      (member) => member.toString() === req.user._id.toString()
    );

    if (!isOwner && !isTeamMember) {
      return res.status(403).json({ 
        message: "Only venue owner or team members can block availability" 
      });
    }

    // Check for overlapping blocks
    const hasOverlap = space.availability.some((block) => {
      return (
        (parsedStartDate >= block.start && parsedStartDate < block.end) ||
        (parsedEndDate > block.start && parsedEndDate <= block.end) ||
        (parsedStartDate <= block.start && parsedEndDate >= block.end)
      );
    });

    if (hasOverlap) {
      return res.status(400).json({ 
        message: "The selected dates overlap with an existing availability block" 
      });
    }

    // Add availability block
    space.availability.push({
      start: parsedStartDate,
      end: parsedEndDate,
      status: "blocked",
      reason: reason || "Unavailable",
    });

    await space.save();

    res.json({ 
      message: "Availability blocked successfully", 
      space 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unblock space availability
// @route   DELETE /api/spaces/:id/unblock/:blockId
// @access  Private (Venue owner or team member)
export const unblockSpaceAvailability = async (req, res) => {
  try {
    // Support both URL param and body
    const blockId = req.params.blockId || req.body.blockId;

    if (!blockId) {
      return res.status(400).json({ 
        message: "Block ID is required" 
      });
    }

    // Get space with venue details
    const space = await Space.findById(req.params.id).populate("venue");

    if (!space) {
      return res.status(404).json({ message: "Space not found" });
    }

    // Verify user is venue owner or team member
    const isOwner = space.venue.owner.toString() === req.user._id.toString();
    const isTeamMember = space.venue.teamMembers.some(
      (member) => member.toString() === req.user._id.toString()
    );

    if (!isOwner && !isTeamMember) {
      return res.status(403).json({ 
        message: "Only venue owner or team members can unblock availability" 
      });
    }

    // Find and remove the block
    const blockIndex = space.availability.findIndex(
      (block) => block._id.toString() === blockId
    );

    if (blockIndex === -1) {
      return res.status(404).json({ 
        message: "Availability block not found" 
      });
    }

    const removedBlock = space.availability[blockIndex];

    // Check if this block is linked to a booking request
    if (removedBlock.requestId) {
      // Find and update the related venue request back to 'quoted' status
      const relatedRequest = await VenueRequest.findById(removedBlock.requestId);
      if (relatedRequest && relatedRequest.status === "externally_booked") {
        relatedRequest.status = "quoted";
        relatedRequest.bookedAt = null;
        relatedRequest.bookedBy = null;
        await relatedRequest.save();

        // Add system message to chat
        const chat = await VenueInquiryChat.findOne({ request: removedBlock.requestId });
        if (chat) {
          chat.messages.push({
            sender: req.user._id,
            text: `Booking has been cancelled. This enquiry is now available again.`,
            attachments: [],
          });
          await chat.save();
        }
      }
    }

    // Remove the block
    space.availability.splice(blockIndex, 1);
    await space.save();

    res.json({ 
      message: "Availability unblocked successfully", 
      wasBooking: !!removedBlock.requestId,
      space 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== ADMIN ROUTES ====================

// @desc    Verify venue (admin only)
// @route   PATCH /api/admin/venues/:id/verify
// @access  Private (Admin only)
export const verifyVenue = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    if (venue.verificationStatus === "verified") {
      return res.status(400).json({ message: "Venue is already verified" });
    }

    venue.verificationStatus = "verified";
    await venue.save();

    // Notify venue owner
    const owner = await User.findById(venue.owner).select("name email");
    if (owner?.email) {
      try {
        await transporter.sendMail({
          from: '"Event Ticketing" <noreply@eventify.com>',
          to: owner.email,
          subject: `Venue Verified - ${venue.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #28a745;">Venue Verified!</h2>
              
              <p>Hi ${owner.name},</p>
              
              <p>Great news! Your venue <strong>${venue.name}</strong> has been verified by our admin team.</p>
              
              <p>Your venue is now visible to organizers on our platform and you can start receiving enquiries.</p>
              
              <p>Best regards,<br>Event Ticketing Team</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }
    }

    res.json({ 
      message: "Venue verified successfully", 
      venue 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Suspend venue (admin only)
// @route   PATCH /api/admin/venues/:id/suspend
// @access  Private (Admin only)
export const suspendVenue = async (req, res) => {
  try {
    const { reason } = req.body;

    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    if (venue.verificationStatus === "suspended") {
      return res.status(400).json({ message: "Venue is already suspended" });
    }

    venue.verificationStatus = "suspended";
    venue.suspendedAt = new Date();
    venue.suspendedBy = req.user._id;
    venue.suspensionReason = reason || "Policy violation";
    await venue.save();

    // Notify venue owner
    const owner = await User.findById(venue.owner).select("name email");
    if (owner?.email) {
      try {
        await transporter.sendMail({
          from: '"Event Ticketing" <noreply@eventify.com>',
          to: owner.email,
          subject: `Venue Suspended - ${venue.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #dc3545;">Venue Suspended</h2>
              
              <p>Hi ${owner.name},</p>
              
              <p>Your venue <strong>${venue.name}</strong> has been suspended.</p>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p><strong>Reason:</strong> ${reason || "Policy violation"}</p>
              </div>
              
              <p>Your venue is no longer visible on the platform. Please contact support if you have any questions.</p>
              
              <p>Best regards,<br>Event Ticketing Team</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send suspension email:", emailError);
      }
    }

    res.json({ 
      message: "Venue suspended successfully", 
      venue 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unsuspend venue (admin only)
// @route   PATCH /api/admin/venues/:id/unsuspend
// @access  Private (Admin only)
export const unsuspendVenue = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    if (venue.verificationStatus !== "suspended") {
      return res.status(400).json({ message: "Venue is not suspended" });
    }

    // Restore to verified status
    venue.verificationStatus = "verified";
    venue.suspendedAt = undefined;
    venue.suspendedBy = undefined;
    venue.suspensionReason = undefined;
    await venue.save();

    // Notify venue owner
    const owner = await User.findById(venue.owner).select("name email");
    if (owner?.email) {
      try {
        await transporter.sendMail({
          from: '"Event Ticketing" <noreply@eventify.com>',
          to: owner.email,
          subject: `Venue Reinstated - ${venue.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #10b981;">Venue Reinstated</h2>
              
              <p>Hi ${owner.name},</p>
              
              <p>Good news! Your venue <strong>${venue.name}</strong> has been reinstated and is now active on the platform.</p>
              
              <p>Your venue is now visible to users and accepting bookings again.</p>
              
              <p>Best regards,<br>Event Ticketing Team</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send reinstatement email:", emailError);
      }
    }

    res.json({ 
      message: "Venue unsuspended successfully", 
      venue 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get venue activity (admin only)
// @route   GET /api/admin/venues/:id/activity
// @access  Private (Admin only)
export const getVenueActivity = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id)
      .populate("owner", "name email phone isBanned")
      .populate("teamMembers", "name email");

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    // Get all spaces for this venue
    const spaces = await Space.find({ venue: venue._id });
    const spaceIds = spaces.map(s => s._id);

    // Get all venue requests (enquiries)
    const venueRequests = await VenueRequest.find({ venue: venue._id })
      .populate("organizer", "name email")
      .populate("space", "name type")
      .sort({ createdAt: -1 });

    // Get all quotes
    const quotes = await VenueQuote.find({ venue: venue._id })
      .populate("request")
      .populate("space", "name")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    // Separate requests by status
    const openRequests = venueRequests.filter(r => r.status === "open");
    const quotedRequests = venueRequests.filter(r => r.status === "quoted");
    const declinedRequests = venueRequests.filter(r => r.status === "declined");
    const externallyBookedRequests = venueRequests.filter(r => r.status === "externally_booked");
    const closedRequests = venueRequests.filter(r => r.status === "closed");

    // Get availability blocks (these are calendar-only, may not have associated requests)
    const availabilityBlocks = [];
    spaces.forEach(space => {
      if (space.availability && space.availability.length > 0) {
        space.availability.forEach(block => {
          availabilityBlocks.push({
            _id: block._id,
            spaceId: space._id,
            spaceName: space.name,
            start: block.start,
            end: block.end,
            status: block.status,
            reason: block.reason,
          });
        });
      }
    });

    // Calculate statistics
    const statistics = {
      totalRequests: venueRequests.length,
      openRequests: openRequests.length,
      quotedRequests: quotedRequests.length,
      declinedRequests: declinedRequests.length,
      externallyBookedRequests: externallyBookedRequests.length,
      closedRequests: closedRequests.length,
      totalQuotes: quotes.length,
      totalSpaces: spaces.length,
      activeSpaces: spaces.filter(s => s.isActive).length,
      totalAvailabilityBlocks: availabilityBlocks.length,
    };

    res.json({
      venue: {
        _id: venue._id,
        name: venue.name,
        city: venue.city,
        fullAddress: venue.fullAddress,
        verificationStatus: venue.verificationStatus,
        suspendedAt: venue.suspendedAt,
        suspensionReason: venue.suspensionReason,
        primaryContact: venue.primaryContact,
        owner: venue.owner,
        teamMembers: venue.teamMembers,
        createdAt: venue.createdAt,
        updatedAt: venue.updatedAt,
      },
      statistics,
      spaces,
      requests: venueRequests, // Return all requests as flat array
      quotes,
      totalRevenue: externallyBookedRequests.reduce((sum, req) => {
        const quote = quotes.find(q => q.request.toString() === req._id.toString());
        return sum + (quote?.totalAmount || 0);
      }, 0),
      availabilityBlocks,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all venues (admin only)
// @route   GET /api/admin/venues
// @access  Private (Admin only)
export const getAllVenuesAdmin = async (req, res) => {
  try {
    const { status, city, search } = req.query;

    const filter = {};
    
    if (status) {
      filter.verificationStatus = status;
    }
    
    if (city) {
      filter.city = new RegExp(city, "i");
    }
    
    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { fullAddress: new RegExp(search, "i") }
      ];
    }

    const venues = await Venue.find(filter)
      .populate("owner", "name email isBanned")
      .select("+primaryContact")
      .sort({ createdAt: -1 })
      .lean();

    // Get request counts for each venue
    const venuesWithStats = await Promise.all(
      venues.map(async (venue) => {
        const requestCount = await VenueRequest.countDocuments({ venue: venue._id });
        const externallyBookedCount = await VenueRequest.countDocuments({ 
          venue: venue._id, 
          status: "externally_booked" 
        });
        const spaceCount = await Space.countDocuments({ venue: venue._id });
        
        return {
          ...venue,
          statistics: {
            totalRequests: requestCount,
            externallyBooked: externallyBookedCount,
            totalSpaces: spaceCount,
          }
        };
      })
    );

    res.json(venuesWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get venue stats for admin dashboard
// @route   GET /api/admin/venues/stats
// @access  Private (Admin only)
export const getVenueStats = async (req, res) => {
  try {
    const totalVenues = await Venue.countDocuments();
    const verifiedVenues = await Venue.countDocuments({ verificationStatus: "verified" });
    const unverifiedVenues = await Venue.countDocuments({ verificationStatus: "unverified" });
    const suspendedVenues = await Venue.countDocuments({ verificationStatus: "suspended" });
    const totalSpaces = await Space.countDocuments();
    const flaggedVenues = await Venue.countDocuments({ reportCount: { $gt: 0 } });

    res.json({
      totalVenues,
      verifiedVenues,
      unverifiedVenues,
      suspendedVenues,
      totalSpaces,
      flaggedVenues,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get chat messages for a venue request
// @route   GET /api/venue-requests/:requestId/messages
// @access  Private (organizer or venue owner/team)
export const getChatMessages = async (req, res) => {
  try {
    const { requestId } = req.params;

    const venueRequest = await VenueRequest.findById(requestId).populate("venue");
    if (!venueRequest) {
      return res.status(404).json({ message: "Venue request not found" });
    }

    // Authorization check
    const venue = await Venue.findById(venueRequest.venue);
    const isOrganizer = venueRequest.organizer.toString() === req.user._id.toString();
    const isVenueOwner = venue.owner.toString() === req.user._id.toString();
    const isTeamMember = venue.teamMembers.some(
      (member) => member.toString() === req.user._id.toString()
    );
    const isAdmin = req.user.role === "admin";

    if (!isOrganizer && !isVenueOwner && !isTeamMember && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to view this chat" });
    }

    let chat = await VenueInquiryChat.findOne({ request: requestId })
      .populate("messages.sender", "name email");

    if (!chat) {
      // Create chat if it doesn't exist
      chat = await VenueInquiryChat.create({ request: requestId });
      return res.json([]);
    }

    // Transform messages to match expected frontend format
    const messages = chat.messages.map(msg => ({
      _id: msg._id,
      message: msg.text,
      sender: msg.sender,
      createdAt: msg.createdAt
    }));

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send a chat message for a venue request
// @route   POST /api/venue-requests/:requestId/messages
// @access  Private (organizer or venue owner/team)
export const sendChatMessage = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const venueRequest = await VenueRequest.findById(requestId).populate("venue organizer");
    if (!venueRequest) {
      return res.status(404).json({ message: "Venue request not found" });
    }

    // Authorization check
    const venue = await Venue.findById(venueRequest.venue);
    const isOrganizer = venueRequest.organizer._id.toString() === req.user._id.toString();
    const isVenueOwner = venue.owner.toString() === req.user._id.toString();
    const isTeamMember = venue.teamMembers.some(
      (member) => member.toString() === req.user._id.toString()
    );

    if (!isOrganizer && !isVenueOwner && !isTeamMember) {
      return res.status(403).json({ message: "Not authorized to send messages in this chat" });
    }

    // Find or create chat
    let chat = await VenueInquiryChat.findOne({ request: requestId });
    if (!chat) {
      chat = await VenueInquiryChat.create({ request: requestId });
    }

    // Add message to chat
    const newMessage = {
      sender: req.user._id,
      text: message.trim(),
      createdAt: new Date()
    };

    chat.messages.push(newMessage);
    await chat.save();

    // Populate sender info for the new message
    await chat.populate("messages.sender", "name email");
    const addedMessage = chat.messages[chat.messages.length - 1];

    // Transform to match expected frontend format
    const responseMessage = {
      _id: addedMessage._id,
      message: addedMessage.text,
      sender: addedMessage.sender,
      createdAt: addedMessage.createdAt
    };

    // Send email notification to the other party
    const recipient = isOrganizer ? venue.primaryContact.email : venueRequest.organizer.email;
    const recipientName = isOrganizer ? venue.primaryContact.name : venueRequest.organizer.name;
    const senderType = isOrganizer ? "Organizer" : "Venue Partner";

    const mailOptions = {
      from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
      to: recipient,
      subject: `New Message in Venue Inquiry Chat`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Chat Message</h2>
          <p>Hi ${recipientName},</p>
          <p>You have received a new message in your venue inquiry chat:</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>${req.user.name} (${senderType}):</strong></p>
            <p style="margin: 10px 0 0 0;">${message}</p>
          </div>
          
          <p><strong>Venue:</strong> ${venue.name}</p>
          <p><strong>Event:</strong> ${venueRequest.eventName}</p>
          
          <p style="margin-top: 20px;">
            <a href="${process.env.FRONTEND_URL}/venue-partner/enquiries/${requestId}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Chat
            </a>
          </p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            This is an automated notification. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (emailErr) {
      console.error("Error sending chat notification email:", emailErr);
      // Continue anyway - email failure shouldn't block chat message
    }

    res.status(201).json(responseMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update venue ownership document
// @route   PATCH /api/venues/:id/document
// @access  Private (Venue owner only)
export const updateVenueDocument = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    // Only owner can update document
    if (venue.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: "Only venue owner can update ownership document" 
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No document file uploaded" });
    }

    // Delete old document if exists
    if (venue.ownershipDocument?.url) {
      const resourceType = venue.documentType === "pdf" || 
                          venue.documentType === "doc" || 
                          venue.documentType === "docx" ? "raw" : "image";
      await deleteVenueDocument(venue.ownershipDocument.url, resourceType);
    }

    // Get file extension
    const fileExtension = req.file.originalname.split(".").pop().toLowerCase();

    // Update venue with new document
    venue.ownershipDocument = {
      url: req.file.path,
      publicId: req.file.filename,
      fileName: req.file.originalname,
    };
    venue.documentType = fileExtension;
    venue.documentUploadedAt = new Date();
    venue.documentVerificationStatus = "pending";
    venue.verificationNotes = ""; // Clear previous notes
    venue.documentVerifiedAt = null;
    venue.documentVerifiedBy = null;

    await venue.save();

    // Notify admins
    try {
      const admins = await User.find({ role: "admin" }).select("email name");
      if (admins.length > 0) {
        const adminEmails = admins.map(admin => admin.email);
        await transporter.sendMail({
          from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
          to: adminEmails,
          subject: "Venue Ownership Document Updated",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb;">Document Update Notification</h2>
              
              <p>A venue owner has uploaded a new ownership document:</p>
              
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Venue Name:</strong> ${venue.name}</p>
                <p style="margin: 5px 0;"><strong>City:</strong> ${venue.city}</p>
                <p style="margin: 5px 0;"><strong>Owner:</strong> ${req.user.name}</p>
                <p style="margin: 5px 0;"><strong>Document Type:</strong> ${fileExtension.toUpperCase()}</p>
              </div>
              
              <p style="margin-top: 20px;">
                <a href="${process.env.FRONTEND_URL}/admin/venues" 
                   style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Review Document
                </a>
              </p>
            </div>
          `,
        });
      }
    } catch (emailError) {
      console.error("Failed to send admin notification email:", emailError);
    }

    res.json({ 
      message: "Document uploaded successfully. Awaiting admin verification.",
      venue: await Venue.findById(venue._id).populate("owner", "name email")
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get venue document (Admin only)
// @route   GET /api/venues/:id/document
// @access  Private (Admin only)
export const getVenueDocument = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id)
      .populate("owner", "name email")
      .populate("documentVerifiedBy", "name");

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    if (!venue.ownershipDocument?.url) {
      return res.status(404).json({ message: "No ownership document found for this venue" });
    }

    res.json({
      document: venue.ownershipDocument,
      documentType: venue.documentType,
      documentUploadedAt: venue.documentUploadedAt,
      documentVerificationStatus: venue.documentVerificationStatus,
      verificationNotes: venue.verificationNotes,
      documentVerifiedAt: venue.documentVerifiedAt,
      documentVerifiedBy: venue.documentVerifiedBy,
      venue: {
        _id: venue._id,
        name: venue.name,
        city: venue.city,
        owner: venue.owner,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify venue document (Admin only)
// @route   PATCH /api/venues/:id/verify-document
// @access  Private (Admin only)
export const verifyVenueDocument = async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!status || !["verified", "rejected"].includes(status)) {
      return res.status(400).json({ 
        message: "Status is required and must be 'verified' or 'rejected'" 
      });
    }

    const venue = await Venue.findById(req.params.id).populate("owner", "name email");

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    if (!venue.ownershipDocument?.url) {
      return res.status(404).json({ 
        message: "No ownership document found for this venue" 
      });
    }

    // Update document verification status
    venue.documentVerificationStatus = status;
    venue.verificationNotes = notes || "";
    venue.documentVerifiedAt = new Date();
    venue.documentVerifiedBy = req.user._id;

    await venue.save();

    // Send email notification to venue owner
    if (venue.owner?.email) {
      const statusText = status === "verified" ? "Verified" : "Rejected";
      const statusColor = status === "verified" ? "#28a745" : "#dc3545";

      try {
        await transporter.sendMail({
          from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
          to: venue.owner.email,
          subject: `Venue Ownership Document ${statusText} - ${venue.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: ${statusColor};">Document ${statusText}</h2>
              
              <p>Hi ${venue.owner.name},</p>
              
              <p>Your ownership document for <strong>${venue.name}</strong> has been ${status === "verified" ? "verified" : "rejected"}.</p>
              
              ${notes ? `
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Admin Notes:</strong></p>
                  <p style="margin: 10px 0 0 0;">${notes}</p>
                </div>
              ` : ""}
              
              ${status === "rejected" ? `
                <p>Please upload a new document addressing the concerns mentioned above.</p>
                <p style="margin-top: 20px;">
                  <a href="${process.env.FRONTEND_URL}/venue-partner/venues/${venue._id}/edit" 
                     style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Upload New Document
                  </a>
                </p>
              ` : `
                <p>Your venue is now eligible for verification and will appear in search results once fully verified.</p>
              `}
              
              <p style="margin-top: 30px;">Best regards,<br>Event Ticketing Team</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }
    }

    const populatedVenue = await Venue.findById(venue._id)
      .populate("owner", "name email")
      .populate("documentVerifiedBy", "name");

    res.json({ 
      message: `Document ${status} successfully`,
      venue: populatedVenue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
