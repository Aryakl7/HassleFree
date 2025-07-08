// FILE: app/api/amenities/checkin/route.js (Conceptual - ensure it exists)
import connectMongo from "@/lib/db";
import Booking from "@/models/booking";
import AttendanceLog from "@/models/attendance";
import { verify } from "jsonwebtoken"; // For guard/device auth if used
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { format } from "date-fns"; // For date checking

// --- TODO: Implement robust guard/device authentication ---
async function verifyGuardToken(req) {
    console.warn("Guard token verification not implemented in check-in API!");
    return { isValid: true, payload: { guardId: 'GUARD_DEVICE_001', /* ... */ } };
}

export async function POST(req) {
    console.log("--- HIT: POST /api/amenities/checkin ---");
    try {
        await connectMongo();

        // 1. Authenticate Guard/Device
        const authResult = await verifyGuardToken(req);
        if (!authResult.isValid) return NextResponse.json({ error: "Unauthorized device/guard" }, { status: 401 });
        const operatorId = authResult.payload.guardId; // Or adminId if admin uses this

        // 2. Get QR Data from Body
        const { qrDataString } = await req.json();
        if (!qrDataString) return NextResponse.json({ error: "Missing QR data" }, { status: 400 });

        // 3. Parse QR Data
        let qrData;
        try {
            qrData = JSON.parse(qrDataString);
            if (qrData.type !== "AMENITY_BOOKING" || !qrData.bookingId || !mongoose.Types.ObjectId.isValid(qrData.bookingId)) {
                throw new Error("Invalid QR code format or type");
            }
        } catch (parseError) { return NextResponse.json({ error: "Invalid or unreadable QR code" }, { status: 400 }); }

        const bookingId = qrData.bookingId;

        // 4. Find Booking and Validate
        const booking = await Booking.findById(bookingId).populate('userId', 'name').populate('amenityId', 'name status capacity');
        if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

        // Check Status (Must be 'confirmed' or 'approved')
        if (!['confirmed', 'approved'].includes(booking.status)) {
             return NextResponse.json({ error: `Booking status (${booking.status}) is not valid for check-in` }, { status: 400 });
        }
        // Check Amenity Status
        if (booking.amenityId?.status !== 'operational') {
             return NextResponse.json({ error: `Cannot check-in, amenity '${booking.amenityId?.name}' is not operational.` }, { status: 400 });
        }
        // Check Date/Time Window
        const now = new Date();
        const bookingDate = new Date(booking.bookingDate);
        if (format(now, 'yyyy-MM-dd') !== format(bookingDate, 'yyyy-MM-dd')) {
            return NextResponse.json({ error: "Booking is not for today" }, { status: 400 });
        }
        // TODO: Add more precise time window check (e.g., allow 15 mins before start time)

        // 5. Update Booking Status to Checked-in
        booking.status = 'checked-in';
        booking['timestamps.entry'] = now;
        await booking.save();

        // 6. Create Attendance Log
        try {
             await AttendanceLog.create({
                userId: booking.userId._id, personName: booking.userId.name,
                bookingId: booking._id, societyId: booking.societyId,
                timestamp: now, type: 'entry', source: 'amenity_checkin',
                location: booking.amenityId.name || 'Amenity',
                verificationMethod: 'qr_code', // Check-in via QR
                verifiedBy: operatorId, // Log who scanned/verified
                status: 'verified',
             });
        } catch (logError) { console.error("Failed to create check-in attendance log:", logError); }

        console.log(`Booking ${bookingId} checked-in via QR by ${operatorId}`);
        // 7. Return Success Response
        return NextResponse.json({
             message: "Check-in successful",
             bookingId: booking._id,
             userName: booking.userId.name,
             amenityName: booking.amenityId.name
            }, { status: 200 });

    } catch (err) {
        console.error("[Check-in API] Error:", err);
        return NextResponse.json({ error: "Check-in failed", detail: err.message }, { status: 500 });
    }
}