import connectMongo from "@/lib/db";
import Booking from "@/models/booking";
import AttendanceLog from "@/models/attendance"; // If logging check-outs
import { verify } from "jsonwebtoken"; // For guard/device auth
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// TODO: Implement proper guard/device authentication
async function verifyGuardToken(req) {
    console.warn("Guard token verification not implemented in check-out API!");
    return { isValid: true, payload: { guardId: 'GUARD_002' } };
}

export async function POST(req) { // Or PUT, depending on preference
    console.log("--- HIT: POST /api/amenities/checkout ---");
    try {
        await connectMongo();

        // 1. Authenticate Guard/Device
        const authResult = await verifyGuardToken(req);
        if (!authResult.isValid) {
            return NextResponse.json({ error: "Unauthorized device/guard" }, { status: 401 });
        }
        const guardId = authResult.payload.guardId;

        // 2. Get Booking ID (e.g., from QR or manual input by guard)
        // Option A: From QR Code data string
        // const { qrDataString } = await req.json();
        // let qrData; try { qrData = JSON.parse(qrDataString); } catch { /*...*/ }
        // const bookingId = qrData?.bookingId;

        // Option B: From direct Booking ID input
        const { bookingId } = await req.json();

        if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
            return NextResponse.json({ error: "Valid Booking ID is required" }, { status: 400 });
        }

        // 3. Find Booking and Validate
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        // Check Status (Must be 'checked-in' to check-out)
        if (booking.status !== 'checked-in') {
             return NextResponse.json({ error: `Cannot check-out booking with status: ${booking.status}` }, { status: 400 });
        }

        // 4. Update Booking Status and Exit Time
        const now = new Date();
        booking.status = 'checked-out';
        booking['timestamps.exit'] = now; // Record exit time
        // TODO: Add any checkout-specific logic here (e.g., calculate final charges, update equipment availability)
        await booking.save();

        // 5. (Optional) Create Attendance Log for Exit
        try {
            await AttendanceLog.create({
                userId: booking.userId,
                societyId: booking.societyId,
                timestamp: now,
                type: 'exit', // Mark as exit
                location: booking.amenityId.name || 'Amenity Check-out',
                verificationMethod: 'qr_code', // Or 'manual' depending on trigger
                verifiedBy: guardId,
                status: 'verified',
            });
        } catch (logError) {
            console.error("Failed to create attendance log for check-out:", logError);
        }

        console.log(`Booking ${bookingId} checked-out by guard ${guardId}`);
        // 6. Return Success Response
        return NextResponse.json({ message: "Check-out successful", bookingId: booking._id }, { status: 200 });

    } catch (err) {
        console.error("[Check-out API] Error:", err);
        return NextResponse.json({ error: "Check-out failed", detail: err.message }, { status: 500 });
    }
}