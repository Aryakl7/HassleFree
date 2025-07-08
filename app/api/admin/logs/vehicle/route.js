// FILE: app/api/admin/logs/vehicle/route.js
import connectMongo from "@/lib/db";
import VehicleEntryLog from "@/models/vehicleEntry"; // Adjust path if needed
import { verify } from "jsonwebtoken";
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// --- GET Handler (Fetch vehicle logs for a society) ---
export async function GET(req) {
    console.log("--- HIT: GET /api/admin/logs/vehicle ---");
    try {
        await connectMongo();

        // 1. Verify Admin Token
        const token = req.headers.get("authorization")?.split(" ")[1];
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        let adminPayload;
        try {
            adminPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_ADMIN);
             if (!adminPayload?.id) throw new Error("Invalid payload");
        } catch (err) {
            return NextResponse.json({ message: `Unauthorized: ${err.message}` }, { status: 401 });
        }

        // 2. Get Society ID
        const url = new URL(req.url);
        const societyId = url.searchParams.get("societyId");
        if (!societyId || !mongoose.Types.ObjectId.isValid(societyId)) {
            return NextResponse.json({ message: "Bad Request: Valid Society ID required" }, { status: 400 });
        }

        // 3. Fetch Logs (Add date filters, pagination later)
        console.log(`Fetching vehicle logs for societyId: ${societyId}`);
        const logs = await VehicleEntryLog.find({ societyId: societyId })
            .sort({ entryTime: -1 }) // Sort by most recent entry
            .limit(100) // Limit results initially
            .populate('residentId', 'name houseNo flatNo') // Populate related user
            .populate('guestId', 'name'); // Populate related guest

        console.log(`Found ${logs.length} vehicle logs`);
        return NextResponse.json({ logs: logs || [] }, { status: 200 });

    } catch (error) {
        console.error("API Error fetching vehicle logs:", error);
        return NextResponse.json({ message: "Server error fetching vehicle logs", error: error.message }, { status: 500 });
    }
}