// FILE: app/api/admin/logs/delivery/route.js
import connectMongo from "@/lib/db";
import AttendanceLog from "@/models/attendance"; // Use AttendanceLog model
import Admin from "@/models/admin"; // Import Admin model for fetching societyId if not in token
import { verify } from "jsonwebtoken";
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

// --- Helper Function to Verify Admin Token ---
// Place this helper at the top of the file or import it from a shared utility
async function verifyAdminToken(req) {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
        console.log("[VerifyAdminToken] No token provided");
        return { isValid: false, error: "Unauthorized: No token provided", status: 401, payload: null };
    }
    try {
        const adminPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_ADMIN);
        if (!adminPayload?.id) {
            console.warn("[VerifyAdminToken] Admin token valid but missing id in payload.");
            throw new Error("Invalid token payload: missing id");
        }
        // Ensure societyId is in the payload, fetch if not (as done in amenity/[id] route)
        if (!adminPayload.societyId) {
            console.warn("[VerifyAdminToken] Admin token missing societyId, fetching admin record...");
            const adminUser = await Admin.findById(adminPayload.id).select('societyId').lean();
            if (!adminUser || !adminUser.societyId) {
                console.error("[VerifyAdminToken] Admin account not linked to a society.");
                throw new Error("Admin account not linked to a society.");
            }
            adminPayload.societyId = adminUser.societyId.toString();
            console.log("[VerifyAdminToken] Fetched societyId for admin:", adminPayload.societyId);
        }
        console.log("[VerifyAdminToken] Admin token verified. Payload:", adminPayload);
        return { isValid: true, error: null, status: 200, payload: adminPayload };
    } catch (err) {
        console.error("[VerifyAdminToken] Admin Token Verification FAILED:", err.message);
        return { isValid: false, error: `Unauthorized: Invalid admin token (${err.name || 'Verification Error'})`, status: 401, payload: null };
    }
}


export async function GET(req) {
    console.log("--- HIT: GET /api/admin/logs/delivery ---");
    try {
        await connectMongo();
        console.log("[Delivery Logs API] DB Connected.");

        // 1. Verify Admin Token & Get Society ID
        // *** This line was causing the error if verifyAdminToken was not defined/imported ***
        const authResult = await verifyAdminToken(req);
        // *** End of potentially problematic line ***

        if (!authResult || !authResult.isValid) { // Add check for authResult itself being undefined
            console.error("[Delivery Logs API] Auth result is invalid or undefined.");
            const errorMessage = authResult?.error || "Authentication failed";
            const errorStatus = authResult?.status || 401;
            return NextResponse.json({ message: errorMessage }, { status: errorStatus });
        }

        // Ensure payload and societyId exist after successful verification
        if (!authResult.payload || !authResult.payload.societyId) {
             console.error("[Delivery Logs API] Admin payload or societyId missing after verification.");
             return NextResponse.json({ message: "Internal Server Error: Admin context missing after auth." }, { status: 500 });
        }
        const adminSocietyId = authResult.payload.societyId;
        console.log("[Delivery Logs API] Admin Society ID for query:", adminSocietyId);


        // 2. Get Filters from Query Params (Optional)
        const url = new URL(req.url);
        const dateFilter = url.searchParams.get("date");
        const limit = parseInt(url.searchParams.get("limit") || "100", 10);

        // 3. Build Query - Filter for 'delivery_point' source
        const query = {
            societyId: adminSocietyId,
            source: 'delivery_point' // <<< --- KEY FILTER for deliveries ---
        };

        if (dateFilter) {
            try {
                const day = parseISO(dateFilter);
                query.timestamp = { $gte: startOfDay(day), $lt: endOfDay(day) };
            } catch (e) { console.warn("[Delivery Logs API] Invalid date filter format received:", dateFilter); }
        }

        console.log("[Admin Delivery Logs API] Query:", query);

        // 4. Fetch Logs & Populate related data
        const logs = await AttendanceLog.find(query)
            .sort({ timestamp: -1 })
            .limit(limit)
            .populate('userId', 'name houseNo flatNo') // Resident details
            .populate('verifiedBy', 'name workerID'); // Guard/Admin details

        console.log(`[Admin Delivery Logs API] Found ${logs.length} delivery logs.`);
        return NextResponse.json({ logs: logs || [] }, { status: 200 });

    } catch (error) {
        console.error("API Error fetching delivery logs:", error);
        return NextResponse.json({ message: "Server error fetching delivery logs", error: error.message }, { status: 500 });
    }
}