
import connectMongo from "@/lib/db";
import AttendanceLog from "@/models/attendance"; // Use AttendanceLog model
import { verify } from "jsonwebtoken";
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET(req) {
    console.log("--- HIT: GET /api/user/deliveries/pending ---");
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

        // 2. Find "entry" logs for this user from delivery source that don't have a corresponding "exit" log
        // This is a bit tricky. A simpler approach for now is to find recent 'entry' logs
        // for this user from the delivery source. A more robust system might have a separate
        // 'deliveries' collection with a clear 'status' field (e.g., 'at_gate', 'collected').
        // Let's query recent 'entry' logs for simplicity.

        console.log(`[Pending Deliveries API] Querying recent 'entry' logs for user ${userId} from source 'delivery_point'`);

        // Find recent delivery entries for this user where type is 'entry'
        // You might need a way to link entry/exit pairs later for more accuracy
        const recentEntryWindow = new Date();
        recentEntryWindow.setHours(recentEntryWindow.getHours() - 12); // Example: Check logs from last 12 hours

        const pendingDeliveries = await AttendanceLog.find({
            societyId: societyId,
            userId: userId, // Match the logged-in user
            source: 'delivery_point', // Must be from delivery
            type: 'entry', // Must be an entry log
            timestamp: { $gte: recentEntryWindow } // Look at recent entries
            // We assume if there's an 'entry' log without a recent corresponding 'exit' log,
            // the delivery might still be pending collection.
            // A dedicated 'status' on the delivery/log would be better.
        })
        .sort({ timestamp: -1 }) // Newest first
        .limit(5); // Limit the number shown

        console.log(`[Pending Deliveries API] Found ${pendingDeliveries.length} potential pending deliveries.`);

        return NextResponse.json({ pendingDeliveries: pendingDeliveries || [] }, { status: 200 });

    } catch (error) {
        console.error("API Error fetching pending deliveries:", error);
        return NextResponse.json({ error: "Failed to fetch pending deliveries", detail: error.message }, { status: 500 });
    }
}