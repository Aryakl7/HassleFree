// FILE: app/api/announcement/[id]/route.js
import connectMongo from "@/lib/db";
import announcement from "@/models/announcement"; // Adjust path if needed
import { verify } from "jsonwebtoken";
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// --- Helper Function to Verify Admin Token ---
// (Consider moving this to a shared /lib/authUtils.js file)
async function verifyAdminToken(req) {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return { error: "Unauthorized: No token provided", status: 401, payload: null };
    try {
        const adminPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_ADMIN);
        if (!adminPayload?.id) throw new Error("Invalid payload");
        return { error: null, status: 200, payload: adminPayload };
    } catch (err) {
        return { error: `Unauthorized: ${err.message}`, status: 401, payload: null };
    }
}

// --- DELETE Handler (Delete specific announcement by ID) ---
export async function DELETE(req, { params }) {
    const { id } = params; // Get announcement ID from the dynamic route segment
    console.log(`--- HIT: DELETE /api/announcement/${id} ---`);

    // 1. Verify Admin Token
    const authResult = await verifyAdminToken(req);
    if (authResult.error) {
        return NextResponse.json({ message: authResult.error }, { status: authResult.status });
    }
    // Optionally get adminId and societyId from payload if needed for stricter checks
    // const adminSocietyId = authResult.payload.societyId;

    // 2. Validate Announcement ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Bad Request: Invalid Announcement ID format" }, { status: 400 });
    }

    try {
        await connectMongo();
        console.log(`Attempting to delete announcement ${id}`);

        // 3. Find and Delete Announcement
        // Optional Security: Add societyId check if needed
        // const deletedAnnouncement = await announcement.findOneAndDelete({ _id: id, societyId: adminSocietyId });
        const deletedAnnouncement = await announcement.findByIdAndDelete(id);

        // 4. Handle Not Found
        if (!deletedAnnouncement) {
            console.log(`Announcement not found for ID: ${id}`);
            return NextResponse.json({ message: "Announcement not found" }, { status: 404 });
        }

        console.log("Announcement deleted successfully:", deletedAnnouncement._id);

        // 5. Return Success Response
        return NextResponse.json({ message: "Announcement deleted successfully" }, { status: 200 });
        // return new NextResponse(null, { status: 204 }); // Alternative: No Content

    } catch (error) {
        console.error(`API Error deleting announcement ${id}:`, error);
        return NextResponse.json({ message: "Server error deleting announcement", error: error.message }, { status: 500 });
    }
}


// --- PUT Handler (Update specific announcement by ID) ---
export async function PUT(req, { params }) {
    const { id } = params; // Get announcement ID
    console.log(`--- HIT: PUT /api/announcement/${id} ---`);

    // 1. Verify Admin Token
    const authResult = await verifyAdminToken(req);
    if (authResult.error) {
        return NextResponse.json({ message: authResult.error }, { status: authResult.status });
    }

    // 2. Validate Announcement ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Bad Request: Invalid Announcement ID" }, { status: 400 });
    }

    try {
        await connectMongo();

        // 3. Get Update Data
        const updateData = await req.json();

        // 4. Basic Validation (Add more as needed)
        if (!updateData || Object.keys(updateData).length === 0) {
            return NextResponse.json({ message: "Bad Request: No update data provided" }, { status: 400 });
        }
        // Prevent critical fields from being changed if necessary
        delete updateData._id;
        delete updateData.adminId; // Don't change who created it
        delete updateData.societyId; // Don't change the society it belongs to
        delete updateData.createdAt;

        console.log(`Updating announcement ${id} with:`, updateData);

        // 5. Find and Update
        // Optional Security: Add societyId check
        // const updatedAnnouncement = await announcement.findOneAndUpdate({ _id: id, societyId: adminSocietyId }, ...);
        const updatedAnnouncement = await announcement.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true } // Return updated doc, run schema validation
        );

        // 6. Handle Not Found
        if (!updatedAnnouncement) {
            return NextResponse.json({ message: "Announcement not found" }, { status: 404 });
        }

        console.log("Announcement updated successfully:", updatedAnnouncement._id);

        // 7. Return Success Response
        return NextResponse.json({ message: "Announcement updated", announcement: updatedAnnouncement }, { status: 200 });

    } catch (error) {
        console.error(`API Error updating announcement ${id}:`, error);
        if (error.name === 'ValidationError') {
            return NextResponse.json({ message: `Validation Failed: ${error.message}`, errors: error.errors }, { status: 400 });
        }
        return NextResponse.json({ message: "Server error updating announcement", error: error.message }, { status: 500 });
    }
}