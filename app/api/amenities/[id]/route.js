// FILE: app/api/amenities/[id]/route.js
import connectMongo from "@/lib/db";
import Amenity from "@/models/amenity"; // Ensure path is correct
import Admin from "@/models/admin"; // Needed if fetching admin for societyId fallback
import { verify } from "jsonwebtoken";
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// --- Helper Function to Verify EITHER User OR Admin Token ---
// Returns { isValid: boolean, error: string|null, status: number, payload: object|null }
async function verifyAnyToken(req) {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return { isValid: false, error: "Unauthorized: No token provided", status: 401, payload: null };

    // Try User
    try {
        const userPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_USER);
        if (userPayload?.id && userPayload?.societyId) {
            console.log("[Amenity ID API] Verified as USER.");
            // Add isAdmin flag for consistency, default false for user
            return { isValid: true, error: null, status: 200, payload: { ...userPayload, isAdmin: false } };
        }
    } catch (userError) {
        // Ignore user error, try admin
    }

    // Try Admin
    try {
        const adminPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_ADMIN);
        if (adminPayload?.id) {
            console.log("[Amenity ID API] Verified as ADMIN.");
            // *** IMPORTANT: Assumes 'societyId' IS included in the admin token payload ***
            // If not, you MUST fetch the admin record here to get their societyId for security checks
            if (!adminPayload.societyId) {
                 console.warn("[Amenity ID API] Admin token verified but missing societyId in payload. Fetching admin record...");
                 // This adds a DB call, less efficient than including in token
                 const adminUser = await Admin.findById(adminPayload.id).select('societyId');
                 if (!adminUser || !adminUser.societyId) {
                     throw new Error("Admin account not linked to a society.");
                 }
                 adminPayload.societyId = adminUser.societyId.toString(); // Add it for security checks
            }
            return { isValid: true, error: null, status: 200, payload: { ...adminPayload, isAdmin: true } };
        }
    } catch (adminError) {
        console.error("[Amenity ID API] Token Verification FAILED for both USER and ADMIN:", { adminError: adminError.message });
        return { isValid: false, error: `Unauthorized: Invalid token (${adminError.name || 'Verification Error'})`, status: 401, payload: null };
    }

    // Fallback if somehow verification succeeded but payload was invalid/missing ID
    console.error("[Amenity ID API] Invalid token payload structure after verification attempts.");
    return { isValid: false, error: "Unauthorized: Invalid token payload", status: 401, payload: null };
}

// --- GET Handler (Fetch specific amenity by ID - Accessible by User or Admin) ---
export async function GET(req, { params }) {
    const { id } = params;
    console.log(`--- HIT: GET /api/amenities/${id} ---`);

    // 1. Verify EITHER User or Admin Token
    const authResult = await verifyAnyToken(req);
    if (!authResult.isValid) {
        return NextResponse.json({ message: authResult.error }, { status: authResult.status });
    }
    const payload = authResult.payload; // Contains id, societyId, isAdmin flag

    // 2. Validate Amenity ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Bad Request: Invalid Amenity ID format" }, { status: 400 });
    }

    try {
        await connectMongo();
        console.log(`Fetching amenity with ID: ${id}`);

        // 3. Find Amenity
        const amenityData = await Amenity.findById(id)
                                        .populate('amenityManager', 'name workerID'); // Populate manager details

        // 4. Handle Not Found
        if (!amenityData) {
            console.log(`[Amenity ID API] Amenity ${id} not found.`);
            return NextResponse.json({ message: "Amenity not found" }, { status: 404 });
        }

        // 5. Security Check: Ensure the amenity belongs to the user's/admin's society
        const amenitySocietyId = amenityData.societyId?.toString();
        const requestorSocietyId = payload.societyId; // Get from payload (ensured by verifyAnyToken)

        if (!requestorSocietyId) {
             // This case should ideally be caught by verifyAnyToken if societyId is required in payload
             console.error(`[Amenity ID API] Could not determine requestor's society ID from token payload.`);
             return NextResponse.json({ message: "Forbidden: Cannot determine society context" }, { status: 403 });
        }

        if (amenitySocietyId !== requestorSocietyId) {
            console.warn(`[Amenity ID API] Forbidden Access Attempt: Requestor from society ${requestorSocietyId} tried to access amenity ${id} from society ${amenitySocietyId}`);
            return NextResponse.json({ message: "Forbidden: You do not have access to this amenity" }, { status: 403 });
        }
        // --- End Security Check ---

        console.log(`[Amenity ID API] Access granted for amenity ${id}.`);
        // 6. Return Success Response
        return NextResponse.json(amenityData, { status: 200 });

    } catch (error) {
        console.error(`API Error fetching amenity ${id}:`, error);
        return NextResponse.json({ message: "Server error fetching amenity", error: error.message }, { status: 500 });
    }
}


// --- PUT Handler (Update specific amenity by ID - Admin Only) ---
export async function PUT(req, { params }) {
    const { id } = params; // Amenity ID
    console.log(`--- HIT: PUT /api/amenities/${id} ---`);

    // 1. Verify ADMIN Token
    const authResult = await verifyAnyToken(req);
    if (!authResult.isValid || !authResult.payload.isAdmin) {
        return NextResponse.json({ message: authResult.error || "Forbidden: Admin access required" }, { status: authResult.status || 403 });
    }
    const adminSocietyId = authResult.payload.societyId; // Get societyId from verified admin token

    // 2. Validate Amenity ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Bad Request: Invalid Amenity ID format" }, { status: 400 });
    }
     if (!adminSocietyId) { // Should have been caught by verifyAnyToken if setup correctly
          console.error("[Amenity ID PUT] Admin token payload missing societyId!");
          return NextResponse.json({ message: "Internal Server Error: Admin context missing" }, { status: 500 });
     }

    try {
        await connectMongo();

        // 3. Get Update Data
        const updateData = await req.json();
        console.log(`Updating amenity ${id} with data:`, updateData);

        // 4. Validation
        if (!updateData || Object.keys(updateData).length === 0) {
            return NextResponse.json({ message: "Bad Request: No update data provided" }, { status: 400 });
        }
        // Prevent changing critical fields
        delete updateData._id;
        delete updateData.societyId; // Cannot change the society it belongs to
        delete updateData.createdAt;
        delete updateData.updatedAt; // Mongoose handles this
        delete updateData.__v;

        // Add more validation for specific fields if needed here
        // e.g., if (updateData.capacity !== undefined && updateData.capacity < 0) { ... }

        // 5. Find and Update (Including Security Check)
        const updatedAmenity = await Amenity.findOneAndUpdate(
            { _id: id, societyId: adminSocietyId }, // Ensure admin updates ONLY within their society
            { $set: updateData },
            { new: true, runValidators: true }
        ).populate('amenityManager', 'name workerID');

        // 6. Handle Not Found (or Forbidden if societyId didn't match)
        if (!updatedAmenity) {
             // Check if it exists at all to differentiate 404 from 403
             const exists = await Amenity.findById(id);
             if(exists) {
                 console.warn(`[Amenity ID PUT] Forbidden: Admin from society ${adminSocietyId} tried to update amenity ${id} from different society ${exists.societyId}`);
                 return NextResponse.json({ message: "Forbidden: Cannot update amenity outside your society" }, { status: 403 });
             } else {
                 return NextResponse.json({ message: "Amenity not found" }, { status: 404 });
             }
        }

        console.log("Amenity updated successfully by admin:", updatedAmenity._id);

        // 7. Return Success Response
        return NextResponse.json({ message: "Amenity updated successfully", amenity: updatedAmenity }, { status: 200 });

    } catch (error) {
        console.error(`API Error updating amenity ${id}:`, error);
        if (error.name === 'ValidationError') {
             return NextResponse.json({ message: `Validation Failed: ${error.message}`, errors: error.errors }, { status: 400 });
        }
        return NextResponse.json({ message: "Server error updating amenity", error: error.message }, { status: 500 });
    }
}


// --- DELETE Handler (Delete specific amenity by ID - Admin Only) ---
export async function DELETE(req, { params }) {
    const { id } = params; // Amenity ID
    console.log(`--- HIT: DELETE /api/amenities/${id} ---`);

    // 1. Verify ADMIN Token
    const authResult = await verifyAnyToken(req);
    if (!authResult.isValid || !authResult.payload.isAdmin) {
        return NextResponse.json({ message: authResult.error || "Forbidden: Admin access required" }, { status: authResult.status || 403 });
    }
    const adminSocietyId = authResult.payload.societyId;

    // 2. Validate Amenity ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Bad Request: Invalid Amenity ID format" }, { status: 400 });
    }
     if (!adminSocietyId) {
          console.error("[Amenity ID DELETE] Admin token payload missing societyId!");
          return NextResponse.json({ message: "Internal Server Error: Admin context missing" }, { status: 500 });
     }

    try {
        await connectMongo();
        console.log(`Attempting to delete amenity ${id} from society ${adminSocietyId}`);

        // 3. Find and Delete (Including Security Check)
        const deletedAmenity = await Amenity.findOneAndDelete({
            _id: id,
            societyId: adminSocietyId // Ensure deletion only within admin's society
        });

        // 4. Handle Not Found (or Forbidden if societyId didn't match)
        if (!deletedAmenity) {
             // Check if it exists at all to differentiate 404 from 403
             const exists = await Amenity.findById(id);
             if(exists) {
                 console.warn(`[Amenity ID DELETE] Forbidden: Admin from society ${adminSocietyId} tried to delete amenity ${id} from different society ${exists.societyId}`);
                 return NextResponse.json({ message: "Forbidden: Cannot delete amenity outside your society" }, { status: 403 });
             } else {
                 return NextResponse.json({ message: "Amenity not found" }, { status: 404 });
             }
        }

        // Optional: Add cleanup logic here if deleting an amenity requires deleting related bookings/equipment etc.
        // Be careful with cascading deletes!
        console.log("Amenity deleted successfully by admin:", deletedAmenity._id);

        // 5. Return Success Response
        return NextResponse.json({ message: "Amenity deleted successfully" }, { status: 200 });

    } catch (error) {
        console.error(`API Error deleting amenity ${id}:`, error);
        return NextResponse.json({ message: "Server error deleting amenity", error: error.message }, { status: 500 });
    }
}