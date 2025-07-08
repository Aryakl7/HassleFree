import connectMongo from "@/lib/db";
import Booking from "@/models/booking"; // Adjust path
import Amenity from "@/models/amenity"; // Adjust path
import { verify } from "jsonwebtoken";
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// --- POST Handler (Create a new booking) ---
export async function POST(req) {
    console.log("--- HIT: POST /api/bookings ---");
    try {
        await connectMongo();

        // 1. Verify USER Token & Get User/Society ID
        const token = req.headers.get("authorization")?.split(" ")[1];
        if (!token) return NextResponse.json({ error: "Unauthorized: No token" }, { status: 401 });

        let userPayload;
        try {
            userPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_USER);
            if (!userPayload?.id || !userPayload?.societyId) throw new Error("Invalid payload");
        } catch (err) { return NextResponse.json({ error: `Unauthorized: ${err.message}` }, { status: 401 }); }

        const userId = userPayload.id;
        const societyId = userPayload.societyId;

        // 2. Get Booking Data from Body
        const { amenityId, bookingDate, startTime, endTime, numberOfPeople, purpose } = await req.json();

        // 3. Validation
        if (!amenityId || !bookingDate || !startTime || !endTime || !numberOfPeople || !societyId) {
             return NextResponse.json({ error: "Missing required booking fields" }, { status: 400 });
        }
        if (!mongoose.Types.ObjectId.isValid(amenityId) || !mongoose.Types.ObjectId.isValid(societyId)) {
             return NextResponse.json({ error: "Invalid Amenity or Society ID format" }, { status: 400 });
        }
        // TODO: Add more validation (date format, time format, numberOfPeople > 0)

        // 4. Check Amenity Availability & Rules (CRUCIAL)
        const amenity = await Amenity.findById(amenityId);
        if (!amenity) return NextResponse.json({ error: "Amenity not found" }, { status: 404 });
        if (amenity.societyId?.toString() !== societyId) return NextResponse.json({ error: "Amenity does not belong to your society" }, { status: 403 });
        if (amenity.status !== 'operational') return NextResponse.json({ error: `Amenity is currently ${amenity.status}` }, { status: 400 });
        if (numberOfPeople > amenity.capacity) return NextResponse.json({ error: `Booking exceeds capacity (${amenity.capacity})` }, { status: 400 });

        // *** TODO: Implement Time Conflict Check ***
        // Convert bookingDate, startTime, endTime into full Date objects for comparison
        // Query existing bookings for the same amenityId and date
        // Check if the requested time slot [startTime, endTime] overlaps with any existing CONFIRMED booking
        // Example check (pseudo-code):
        // const dateStr = format(new Date(bookingDate), 'yyyy-MM-dd');
        // const startDateTime = new Date(`${dateStr}T${startTime}:00`);
        // const endDateTime = new Date(`${dateStr}T${endTime}:00`);
        // const conflictingBookings = await Booking.find({
        //     amenityId: amenityId,
        //     bookingDate: { $gte: startOfDay(startDateTime), $lt: endOfDay(startDateTime) }, // Filter by day
        //     status: 'confirmed', // Only check against confirmed bookings
        //     $or: [ // Overlap conditions
        //         { startTime: { $lt: endTime }, endTime: { $gt: startTime } } // Mongoose times might need Date objects or careful string comparison
        //     ]
        // });
        // if (conflictingBookings.length > 0) {
        //     return NextResponse.json({ error: "Requested time slot is unavailable" }, { status: 409 }); // Conflict
        // }
        console.warn("!!! Time conflict check not implemented in /api/bookings !!!"); // REMOVE THIS WARNING AFTER IMPLEMENTING

        // 5. Determine Payment (if applicable)
        let paymentStatus = 'not_required';
        let paymentAmount = 0;
        if (amenity.pricing?.isChargeable) {
            // TODO: Calculate cost based on duration and rate
            paymentStatus = 'pending';
            // paymentAmount = calculateCost(startTime, endTime, amenity.pricing.hourlyRate);
            console.warn("!!! Payment calculation not implemented in /api/bookings !!!");
        }


        // 6. Create Booking Document
        const newBooking = new Booking({
            amenityId,
            userId,
            societyId, // Store societyId on booking
            bookingDate: new Date(bookingDate), // Store as Date
            startTime, // Store as HH:mm string (or convert to Date if preferred for query)
            endTime,
            numberOfPeople,
            purpose: purpose || '', // Optional
            status: 'pending', // Or 'confirmed' if no payment/admin approval needed
            payment: {
                amount: paymentAmount,
                status: paymentStatus,
            },
            // guests: [], // Add if needed
            // equipment: [], // Add if needed
        });

        await newBooking.save();
        console.log(`User ${userId} created booking ${newBooking._id}`);

        // 7. Return Success Response (include booking details)
        return NextResponse.json(
            { message: "Booking created successfully", booking: newBooking },
            { status: 201 }
        );

    } catch (err) {
        console.error("[User Create Booking API] Error:", err);
        if (err.name === 'ValidationError') return NextResponse.json({ error: `Validation Failed: ${err.message}` }, { status: 400 });
        return NextResponse.json({ error: "Failed to create booking", detail: err.message }, { status: 500 });
    }
}

// TODO: Add GET handler for users to fetch their own bookings (/api/bookings?userId=...)
// export async function GET(req) { ... }