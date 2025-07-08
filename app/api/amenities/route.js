// FILE: app/api/amenities/route.js
import connectMongo from "@/lib/db";
import Amenity from "@/models/amenity"; // Use correct model import name
import Admin from "@/models/admin";   // Might need if admin token doesn't include societyId
import { verify } from "jsonwebtoken";
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// --- Helper Function to Verify EITHER User OR Admin Token ---
// Returns { isValid: boolean, error: string|null, status: number, payload: object|null }
async function verifyAnyToken(req) {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return { isValid: false, error: "Unauthorized: No token provided", status: 401, payload: null };

    // Try User first
    try {
        const userPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_USER);
        // User token MUST have societyId
        if (userPayload?.id && userPayload?.societyId) {
             console.log("[VerifyAnyToken] Verified as USER.");
            return { isValid: true, error: null, status: 200, payload: { ...userPayload, isAdmin: false } };
        }
         console.warn("[VerifyAnyToken] User token valid but missing id or societyId.");
         // Fall through if user payload invalid
    } catch (userError) {
        // Ignore user error, try admin
         console.log("[VerifyAnyToken] Not a valid USER token (or error), trying ADMIN...");
    }

    // Try Admin
    try {
        const adminPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_ADMIN);
        if (adminPayload?.id) {
            console.log("[VerifyAnyToken] Verified as ADMIN.");
            // --- Fetch Admin's societyId if not in token ---
            // IMPORTANT: Add societyId to admin token during admin login for efficiency
            if (!adminPayload.societyId) {
                 console.warn("[VerifyAnyToken] Admin token missing societyId, fetching...");
                 const adminUser = await Admin.findById(adminPayload.id).select('societyId').lean(); // Use lean for plain object
                 if (!adminUser || !adminUser.societyId) {
                     throw new Error("Admin account not linked to a society.");
                 }
                 adminPayload.societyId = adminUser.societyId.toString();
            }
            // -------------------------------------------------
            return { isValid: true, error: null, status: 200, payload: { ...adminPayload, isAdmin: true } };
        }
         console.warn("[VerifyAnyToken] Admin token valid but missing id.");
    } catch (adminError) {
        console.error("[VerifyAnyToken] FAILED for both USER and ADMIN:", { adminError: adminError.message });
        return { isValid: false, error: `Unauthorized: Invalid token (${adminError.name || 'Verify Error'})`, status: 401, payload: null };
    }

    // Fallback
     console.error("[VerifyAnyToken] Failed due to invalid payload structure.");
    return { isValid: false, error: "Unauthorized: Invalid token payload", status: 401, payload: null };
}


// --- GET Handler (Fetch list of amenities - Accessible by User or Admin) ---
export async function GET(req) {
    console.log("--- HIT: GET /api/amenities ---");
    try {
        await connectMongo();
        console.log("[Amenities List API] DB Connected.");

        // 1. Verify EITHER User or Admin Token
        const authResult = await verifyAnyToken(req);
        if (!authResult.isValid) {
            return NextResponse.json({ message: authResult.error }, { status: authResult.status });
        }
        const payload = authResult.payload;

        // 2. Determine the Society ID to query for
        let societyIdToQuery;
        if (payload.isAdmin) {
            // For admin, get societyId from query param (allows viewing specific society if needed)
            // Fallback to societyId from token if query param missing (recommended to add to token)
            const url = new URL(req.url);
            societyIdToQuery = url.searchParams.get("societyId") || payload.societyId;
            console.log(`[Amenities List API] Admin request. Using societyId: ${societyIdToQuery} (from query or token)`);
        } else {
            // For user, ALWAYS use societyId from their token for security
            societyIdToQuery = payload.societyId;
            console.log(`[Amenities List API] User request. Using societyId from token: ${societyIdToQuery}`);
        }

        // 3. Validate the determined Society ID
        if (!societyIdToQuery || !mongoose.Types.ObjectId.isValid(societyIdToQuery)) {
            console.log("[Amenities List API] Invalid or missing Society ID for query.");
            return NextResponse.json({ error: "Bad Request: Valid Society ID is required" }, { status: 400 });
        }

        // 4. Fetch Amenities for that specific Society
        console.log(`[Amenities List API] Querying amenities for societyId: ${societyIdToQuery}`);
        const amenitiesData = await Amenity.find({ societyId: societyIdToQuery })
                                           .sort({ name: 1 }) // Sort alphabetically by name
                                           .populate('amenityManager', 'name'); // Populate manager name

        console.log("[Amenities List API] Query Result (Count):", amenitiesData.length);

        // 5. Return Response
        // Return the array directly, not nested under 'amenities' key based on previous frontend code
        return NextResponse.json(amenitiesData || [], { status: 200 });

    } catch (error) {
        console.error("API Route Error (GET /api/amenities):", error);
        return NextResponse.json({ error: "Failed to fetch amenities", detail: error.message || "Unknown server error" }, { status: 500 });
    }
}

// --- POST Handler (Admin Only - Keep as is) ---
export async function POST(req) {
    console.log("--- HIT: POST /api/amenities ---");
    try {
        await connectMongo();
        const token = req.headers.get("authorization")?.split(" ")[1];
        if (!token) return NextResponse.json({ error: "Unauthorized: No token" }, { status: 401 });
        let adminPayload;
        try { adminPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_ADMIN); if(!adminPayload?.id) throw new Error("Invalid"); } // Verify ADMIN
        catch (err) { return NextResponse.json({ error: `Forbidden: ${err.message}` }, { status: 403 }); }

        const body = await req.json();
         // Add validation for body fields
         if (!body.name || !body.type || !body.description || !body.capacity || !body.location || !body.societyId) {
              return NextResponse.json({ error: "Missing required amenity fields." }, { status: 400 });
         }
         // TODO: Add security check: verify body.societyId matches admin's societyId from token/DB

        const newAmenity = new Amenity(body);
        await newAmenity.save();
        console.log("Admin created amenity:", newAmenity._id);
        // Return the created amenity object directly
        return NextResponse.json(newAmenity, { status: 201 });
    } catch (error) {
        console.error("API Route Error (POST /api/amenities):", error);
        if (error.name === 'ValidationError') return NextResponse.json({ error: `Validation Failed: ${error.message}`, errors: error.errors }, { status: 400 });
        return NextResponse.json({ error: "Failed to create amenity", detail: error.message }, { status: 500 });
    }
}

// --- PUT/DELETE handlers belong in app/api/amenities/[id]/route.js ---