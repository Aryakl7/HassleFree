// FILE: app/api/complaints/route.js
import connectMongo from "@/lib/db";
import complaint from "@/models/complaint"; // Use correct model name
import Admin from "@/models/admin"; // Needed for verifyAnyToken if admin token lacks societyId
import { verify } from "jsonwebtoken";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

// --- Helper Function to Verify EITHER User OR Admin Token ---
// (This should ideally be in a shared utility file, e.g., /lib/authUtils.js)
async function verifyAnyToken(req) {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return { isValid: false, error: "Unauthorized: No token provided", status: 401, payload: null };

    try { // Try User
        const userPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_USER);
        if (userPayload?.id && userPayload?.societyId) {
            console.log("[Complaints API] Verified as USER.");
            return { isValid: true, error: null, status: 200, payload: { ...userPayload, isAdmin: false } };
        }
    } catch (userError) { /* Ignore, try admin */ }

    try { // Try Admin
        const adminPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_ADMIN);
        if (adminPayload?.id) {
            console.log("[Complaints API] Verified as ADMIN.");
            if (!adminPayload.societyId) { // Fetch societyId if not in admin token
                 const adminUser = await Admin.findById(adminPayload.id).select('societyId').lean();
                 if (!adminUser || !adminUser.societyId) throw new Error("Admin not linked to a society.");
                 adminPayload.societyId = adminUser.societyId.toString();
            }
            return { isValid: true, error: null, status: 200, payload: { ...adminPayload, isAdmin: true } };
        }
    } catch (adminError) {
        console.error("[Complaints API] Token Verification FAILED for both:", { adminError: adminError.message });
        return { isValid: false, error: `Unauthorized: Invalid token (${adminError.name || 'Verify Error'})`, status: 401, payload: null };
    }
    return { isValid: false, error: "Unauthorized: Invalid token payload", status: 401, payload: null };
}


// --- GET Handler (Fetch complaints for a society - accessible by User or Admin) ---
export async function GET(req) {
  console.log("--- HIT: GET /api/complaints ---");
  try {
    await connectMongo();
    console.log("[Complaints API GET] DB Connected.");

    // 1. Verify EITHER User or Admin Token
    const authResult = await verifyAnyToken(req);
    if (!authResult.isValid) {
      return NextResponse.json({ message: authResult.error }, { status: authResult.status });
    }
    const payload = authResult.payload; // Contains id, societyId, isAdmin flag

    // 2. Determine Society ID to query for
    let societyIdToQuery;
    if (payload.isAdmin) {
        // For admin, get societyId from query param (sent by admin frontend)
        // Fallback to societyId from admin token if query param missing
        const url = new URL(req.url);
        societyIdToQuery = url.searchParams.get("societyId") || payload.societyId;
        console.log(`[Complaints API GET] Admin request. Using societyId: ${societyIdToQuery}`);
    } else {
        // For user, ALWAYS use societyId from their token
        societyIdToQuery = payload.societyId;
        console.log(`[Complaints API GET] User request. Using societyId from token: ${societyIdToQuery}`);
    }

    // 3. Validate the determined Society ID
    if (!societyIdToQuery || !mongoose.Types.ObjectId.isValid(societyIdToQuery)) {
      console.log("[Complaints API GET] Invalid or missing Society ID for query.");
      return NextResponse.json({ error: "Bad Request: Valid Society ID is required" }, { status: 400 });
    }

    // 4. Fetch Complaints
    let complaintsData;
    if (payload.isAdmin) {
        // Admin gets all complaints for the society
        console.log(`[Complaints API GET] Admin fetching ALL complaints for societyId: ${societyIdToQuery}`);
        complaintsData = await complaint.find({ societyId: societyIdToQuery })
                                       .sort({ createdAt: -1 })
                                       .populate('userId', 'name houseNo flatNo') // Populate user who filed
                                       .populate('assignedWorker', 'name workerID'); // Populate assigned worker
    } else {
        // User gets only THEIR complaints for that society
        console.log(`[Complaints API GET] User fetching THEIR complaints for societyId: ${societyIdToQuery}, userId: ${payload.id}`);
        complaintsData = await complaint.find({ societyId: societyIdToQuery, userId: payload.id })
                                       .sort({ createdAt: -1 })
                                       .populate('assignedWorker', 'name workerID'); // Populate assigned worker
    }

    console.log("[Complaints API GET] Query Result (Count):", complaintsData.length);
    // Return the array directly, not nested (adjust frontend if it expects nesting)
    return NextResponse.json(complaintsData || [], { status: 200 });

  } catch (error) {
    console.error("API Route Error (GET /api/complaints):", error);
    return NextResponse.json({ error: "Failed to fetch complaints", detail: error.message }, { status: 500 });
  }
}

// --- POST Handler (User creates a complaint - Keep as is, verifies USER token) ---
export async function POST(req) { /* ... (Ensure this uses USER token) ... */ }

// --- PUT Handler (Admin updates complaint status/assignment - Keep as is, verifies ADMIN token) ---
// Note: If you don't have a separate PUT /api/admin/complaints, then this PUT
// needs to also use verifyAnyToken and check payload.isAdmin.
// For now, assuming the existing PUT on /api/complaints is for admin.
export async function PUT(req) {
    console.log("--- HIT: PUT /api/complaints ---");
    try {
        await connectMongo();
        const token = req.headers.get("authorization")?.split(" ")[1];
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        let adminPayload;
        try { adminPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_ADMIN); if(!adminPayload?.id) throw new Error("Invalid"); } // Verify ADMIN
        catch (err) { return NextResponse.json({ error: `Forbidden: ${err.message}` }, { status: 403 }); }

        const url = new URL(req.url);
        const id = url.searchParams.get("id"); // Complaint ID from query
        if (!id || !mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid complaint ID" }, { status: 400 });

        const updateData = await req.json();
        // TODO: Add validation for updateData (e.g., valid status, worker exists)
        // TODO: Security check - ensure complaint 'id' belongs to admin's societyId

        const updatedComplaint = await complaint.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
                                            .populate('userId', 'name')
                                            .populate('assignedWorker', 'name');

        if (!updatedComplaint) return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
        console.log("Complaint updated by admin:", updatedComplaint._id);
        return NextResponse.json({ message: "Complaint updated", complaint: updatedComplaint }, { status: 200 });

    } catch (error) {
         console.error("API Route Error (PUT /api/complaints):", error);
         if (error.name === 'ValidationError') return NextResponse.json({ error: `Validation: ${error.message}`}, { status: 400 });
         return NextResponse.json({ error: "Failed to update complaint", detail: error.message }, { status: 500 });
    }
}