// FILE: app/api/society/route.js
import connectMongo from "@/lib/db";
import Society from "@/models/society"; // Ensure correct model import name
import Admin from "@/models/admin"; // Needed if admin token doesn't have societyId
import { verify } from "jsonwebtoken";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// --- Helper Function to Verify EITHER User OR Admin Token ---
// (This should ideally be in a shared utility file, e.g., /lib/authUtils.js)
async function verifyAnyToken(req) {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return { isValid: false, error: "Unauthorized: No token provided", status: 401, payload: null };

    // Try User
    try {
        const userPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_USER);
        if (userPayload?.id && userPayload?.societyId) {
            console.log("[Society API] Verified as USER. Payload:", userPayload);
            return { isValid: true, error: null, status: 200, payload: { ...userPayload, isAdmin: false } };
        }
    } catch (userError) {
        // Ignore, try admin
    }

    // Try Admin
    try {
        const adminPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_ADMIN);
        if (adminPayload?.id) { // Admin token must have 'id'
            console.log("[Society API] Verified as ADMIN. Payload:", adminPayload);
            // Ensure admin token also has societyId, or fetch it
            if (!adminPayload.societyId) {
                 console.warn("[Society API] Admin token missing societyId, fetching...");
                 const adminUser = await Admin.findById(adminPayload.id).select('societyId').lean();
                 if (!adminUser || !adminUser.societyId) throw new Error("Admin not linked to a society.");
                 adminPayload.societyId = adminUser.societyId.toString();
            }
            return { isValid: true, error: null, status: 200, payload: { ...adminPayload, isAdmin: true } };
        }
    } catch (adminError) {
        console.error("[Society API] Token Verification FAILED for both USER and ADMIN:", { adminError: adminError.message });
        return { isValid: false, error: `Unauthorized: Invalid token (${adminError.name || 'Verify Error'})`, status: 401, payload: null };
    }
    console.error("[Society API] Invalid token payload structure after attempts.");
    return { isValid: false, error: "Unauthorized: Invalid token payload", status: 401, payload: null };
}


export async function GET(req) {
  console.log("--- HIT: GET /api/society ---");
  try {
    await connectMongo();
    console.log("[Society API GET] DB Connected.");

    // 1. Verify EITHER User or Admin Token
    const authResult = await verifyAnyToken(req);
    if (!authResult.isValid) {
      return NextResponse.json({ message: authResult.error }, { status: authResult.status });
    }
    const payload = authResult.payload; // Contains id, societyId, isAdmin flag

    // 2. Get societyId to query for
    // For this specific route, the societyId is expected as a query parameter,
    // but we will ALSO verify it against the token's societyId for security.
    const url = new URL(req.url);
    const societyIdFromQuery = url.searchParams.get("societyId");
    const societyIdFromToken = payload.societyId;

    console.log(`[Society API GET] societyId from Query: ${societyIdFromQuery}, societyId from Token: ${societyIdFromToken}`);

    if (!societyIdFromQuery || !mongoose.Types.ObjectId.isValid(societyIdFromQuery)) {
      return NextResponse.json({ error: "Bad Request: Valid Society ID required in query" }, { status: 400 });
    }

    // *** SECURITY CHECK: Ensure the queried societyId matches the token's societyId ***
    if (societyIdFromQuery !== societyIdFromToken) {
        console.warn(`[Society API GET] Mismatch or Forbidden: Query SocietyId ${societyIdFromQuery} does not match Token SocietyId ${societyIdFromToken}`);
        return NextResponse.json({ error: "Forbidden: You do not have access to this society's details." }, { status: 403 });
    }
    // --- End Security Check ---

    // 3. Find Society
    console.log(`[Society API GET] Fetching society with ID: ${societyIdFromQuery}`);
    // Populate admin name if needed by frontend
    const societyData = await Society.findById(societyIdFromQuery).populate('adminId', 'name email');

    // 4. Handle Not Found
    if (!societyData) {
      console.log(`[Society API GET] Society ${societyIdFromQuery} not found.`);
      return NextResponse.json({ error: "Society not found" }, { status: 404 });
    }

    // 5. Return Success Response
    return NextResponse.json(societyData, { status: 200 }); // Return society object directly

  } catch (err) {
    console.error("[Society API GET] Error:", err);
    return NextResponse.json({ error: err.message || "Server error fetching society details" }, { status: 500 });
  }
}

// POST handler (for admin to create society - usually part of admin signup)
export async function POST(req) {
    console.log("--- HIT: POST /api/society ---");
    // This route should be ADMIN ONLY and likely part of admin signup
    // For simplicity, assuming it's for general creation if needed, but secure it.
    try {
        await connectMongo();
        // 1. Verify ADMIN Token
        const token = req.headers.get("authorization")?.split(" ")[1];
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        let adminPayload;
        try { adminPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_ADMIN); if (!adminPayload?.id) throw new Error("Invalid"); }
        catch (err) { return NextResponse.json({ error: `Forbidden: ${err.message}` }, { status: 403 }); }

        const body = await req.json();
        // TODO: Add validation for body fields (name, address, pincode, location, etc.)
        if (!body.name || !body.address || !body.pincode || !body.location?.latitude || !body.location?.longitude || !body.adminId) {
            return NextResponse.json({ error: "Missing required fields for society creation" }, { status: 400 });
        }
        // Ensure adminId in body matches token adminId for creating *their* society
        if (body.adminId !== adminPayload.id) {
             return NextResponse.json({ error: "Forbidden: Admin ID mismatch" }, { status: 403 });
        }

        const newSociety = new Society(body);
        await newSociety.save();

        console.log("Admin created society:", newSociety._id);
        return NextResponse.json(newSociety, { status: 201 });

    } catch (err) {
        console.error("[Society API POST] Error:", err);
        if (err.name === 'ValidationError') return NextResponse.json({ error: `Validation Failed: ${err.message}` }, { status: 400 });
        return NextResponse.json({ error: err.message || "Server error creating society" }, { status: 500 });
    }
}
