// FILE: app/api/bookings/generate-qr/route.js
import connectMongo from "@/lib/db";
import Booking from "@/models/booking";
import { verify } from "jsonwebtoken";
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import QRCode from 'qrcode'; // Import qrcode library

export async function POST(req) {
    console.log("--- HIT: POST /api/bookings/generate-qr ---");
    try {
        await connectMongo();

        // 1. Verify USER Token & Get User ID
        const token = req.headers.get("authorization")?.split(" ")[1];
        if (!token) return NextResponse.json({ error: "Unauthorized: No token" }, { status: 401 });

        let userPayload;
        try {
            userPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_USER);
            if (!userPayload?.id) throw new Error("Invalid payload");
        } catch (err) { return NextResponse.json({ error: `Unauthorized: ${err.message}` }, { status: 401 }); }
        const userId = userPayload.id;

        // 2. Get Booking ID from Body
        const { bookingId } = await req.json();
        if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
             return NextResponse.json({ error: "Valid Booking ID is required" }, { status: 400 });
        }

        // 3. Find Booking & Verify Ownership and Status
        const booking = await Booking.findOne({ _id: bookingId, userId: userId });
        if (!booking) {
             return NextResponse.json({ error: "Booking not found or you do not own this booking" }, { status: 404 });
        }
        // Optionally restrict QR generation to certain statuses (e.g., confirmed)
        // if (booking.status !== 'confirmed') {
        //     return NextResponse.json({ error: `Cannot generate QR code for booking with status: ${booking.status}` }, { status: 400 });
        // }

        // 4. Generate QR Code Data (Include necessary info for check-in verification)
        // Keep it simple: Booking ID is usually enough for the check-in system to look up details.
        const qrDataString = JSON.stringify({
            type: "AMENITY_BOOKING", // Identify the QR type
            bookingId: booking._id.toString(),
            amenityId: booking.amenityId.toString(),
            userId: booking.userId.toString(),
            // Add date/time if needed for offline validation, but adds complexity
        });

        // 5. Generate QR Code Image (Data URL)
        const qrCodeDataURL = await QRCode.toDataURL(qrDataString);

        // 6. Optionally save QR to booking (or generate on-the-fly like here)
        // booking.qrCode = qrCodeDataURL; // Depends if you need to store it
        // await booking.save();

        console.log(`Generated QR code for booking ${bookingId}`);
        return NextResponse.json({ qrCode: qrCodeDataURL }, { status: 200 });

    } catch (err) {
        console.error("[Generate QR API] Error:", err);
        return NextResponse.json({ error: "Failed to generate QR code", detail: err.message }, { status: 500 });
    }
}