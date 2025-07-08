// FILE: app/api/admin/bookings/route.js
import connectMongo from "@/lib/db";
import Booking from "@/models/booking";
import { verify } from "jsonwebtoken";
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { startOfDay, endOfDay, parseISO } from 'date-fns'; // For date filtering

// --- Helper: Verify Admin Token --- (Ensure this exists or import)
async function verifyAdminToken(req) { /* ... */ }

export async function GET(req) {
    console.log("--- HIT: GET /api/admin/bookings ---");
    try {
        await connectMongo();

        // 1. Verify Admin Token & Get Society ID
        const authResult = await verifyAdminToken(req);
        if (!authResult.isValid) return NextResponse.json({ message: authResult.error }, { status: authResult.status });
        const adminSocietyId = authResult.payload.societyId; // Assumes societyId is in token
        if (!adminSocietyId) return NextResponse.json({ message: "Admin society context missing" }, { status: 500 });

        // 2. Get Filters from Query Params (Optional)
        const url = new URL(req.url);
        const statusFilter = url.searchParams.get("status"); // e.g., 'confirmed', 'checked-in'
        const dateFilter = url.searchParams.get("date"); // e.g., '2024-10-27'

        // 3. Build Query
        const query = { societyId: adminSocietyId };
        if (statusFilter && statusFilter !== 'all') {
            // Validate status?
            query.status = statusFilter;
        }
        if (dateFilter) {
            try {
                const day = parseISO(dateFilter); // Parse YYYY-MM-DD string
                query.bookingDate = { $gte: startOfDay(day), $lt: endOfDay(day) };
            } catch (e) { console.warn("Invalid date filter format:", dateFilter); }
        } else {
            // Default: Maybe show only today's or upcoming bookings?
             query.bookingDate = { $gte: startOfDay(new Date()) }; // Example: Show from today onwards
        }
        console.log("[Admin Bookings API] Query:", query);

        // 4. Fetch Bookings & Populate
        const bookings = await Booking.find(query)
            .sort({ bookingDate: 1, startTime: 1 }) // Sort by date and time
            .populate('userId', 'name houseNo flatNo')
            .populate('amenityId', 'name location');

        return NextResponse.json({ bookings: bookings || [] }, { status: 200 });

    } catch (error) {
        console.error("API Error fetching admin bookings:", error);
        return NextResponse.json({ message: "Server error fetching bookings", error: error.message }, { status: 500 });
    }
}

// Note: POST/PUT/DELETE for bookings might be needed for admin overrides/cancellations
// They would likely go in a dynamic route like /api/admin/bookings/[id]/route.js