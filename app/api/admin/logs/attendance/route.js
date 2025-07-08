// FILE: app/api/admin/logs/attendance/route.js
import connectMongo from "@/lib/db";
import AttendanceLog from "@/models/attendance"; // Ensure this path and model name are correct
import { verify } from "jsonwebtoken";
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// --- GET Handler (Fetch attendance logs for a society) ---
export async function GET(req) {
    console.log("--- HIT: GET /api/admin/logs/attendance ---");
    try {
        await connectMongo();
        console.log("DB Connected for /api/admin/logs/attendance");

        // 1. Verify Admin Token
        const token = req.headers.get("authorization")?.split(" ")[1];
        if (!token) {
            console.log("[Attendance Logs API] No token provided.");
            return NextResponse.json({ message: "Unauthorized: No token provided" }, { status: 401 });
        }

        let adminPayload;
        try {
            adminPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_ADMIN);
            console.log("[Attendance Logs API] Token Verified. Payload:", adminPayload);
            if (!adminPayload?.id) throw new Error("Invalid payload structure");
        } catch (err) {
            console.error("[Attendance Logs API] Token Verification FAILED:", err.message);
            return NextResponse.json({ message: `Unauthorized: ${err.message}` }, { status: 401 });
        }

        // 2. Get Society ID from query parameters
        const url = new URL(req.url);
        const societyId = url.searchParams.get("societyId");
        console.log("[Attendance Logs API] Society ID Received:", societyId);

        if (!societyId || !mongoose.Types.ObjectId.isValid(societyId)) {
            console.log("[Attendance Logs API] Invalid or missing Society ID.");
            return NextResponse.json({ message: "Bad Request: Valid Society ID is required" }, { status: 400 });
        }

        // 3. Fetch Logs (Add date filters, pagination as needed later)
        console.log(`[Attendance Logs API] Querying logs for societyId: ${societyId}`);
        // Example: Fetch last 100 logs, sorted descending by timestamp
        const logs = await AttendanceLog.find({ societyId: societyId })
            .sort({ timestamp: -1 }) // Show most recent first
            .limit(100) // Limit results for initial load
            .populate('userId', 'name houseNo flatNo') // Populate related user info (adjust fields as needed)
            .populate('verifiedBy', 'name workerID'); // Populate related worker info (if applicable)

        console.log(`[Attendance Logs API] Found ${logs.length} attendance logs`);

        // 4. Return Response
        return NextResponse.json({ logs: logs || [] }, { status: 200 }); // Ensure logs is always an array

    } catch (error) {
        console.error("API Error fetching attendance logs:", error);
        return NextResponse.json({ message: "Server error fetching attendance logs", error: error.message }, { status: 500 });
    }
}