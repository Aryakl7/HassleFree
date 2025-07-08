    // FILE: app/api/admin/me/route.js
import connectMongo from "@/lib/db";
import Admin from "@/models/admin"; // Adjust path if needed
import { verify } from "jsonwebtoken";
import { NextResponse } from 'next/server';

// --- Helper Function to Verify Admin Token --- (Copy or import)
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

// --- GET Handler (Get current admin profile) ---
export async function GET(req) {
    console.log("--- HIT: GET /api/admin/me ---");
    const authResult = await verifyAdminToken(req);
    if (authResult.error) return NextResponse.json({ message: authResult.error }, { status: authResult.status });

    const adminId = authResult.payload.id;

    try {
        await connectMongo();
        // Exclude password, include societyId (if needed by frontend)
        const admin = await Admin.findById(adminId).select('-password');

        if (!admin) {
            return NextResponse.json({ message: "Admin profile not found" }, { status: 404 });
        }
        return NextResponse.json(admin, { status: 200 });

    } catch (error) {
        console.error("API Error fetching admin profile:", error);
        return NextResponse.json({ message: "Server error fetching profile", error: error.message }, { status: 500 });
    }
}

// --- PUT Handler (Update current admin profile) ---
export async function PUT(req) {
    console.log("--- HIT: PUT /api/admin/me ---");
    const authResult = await verifyAdminToken(req);
    if (authResult.error) return NextResponse.json({ message: authResult.error }, { status: authResult.status });

    const adminId = authResult.payload.id;

    try {
        await connectMongo();
        const updateData = await req.json();

        // Prevent changing critical fields directly if needed
        delete updateData.email; // Don't allow email change via this route
        delete updateData.password; // Password change has its own route
        delete updateData.societyId; // Should not be changed here
        delete updateData._id;

        if (Object.keys(updateData).length === 0) {
             return NextResponse.json({ message: "No update data provided" }, { status: 400 });
        }

        // Add validation if needed (e.g., name not empty)
        if (updateData.name === "") {
             return NextResponse.json({ message: "Name cannot be empty" }, { status: 400 });
        }

        const updatedAdmin = await Admin.findByIdAndUpdate(
            adminId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password'); // Exclude password from response

        if (!updatedAdmin) {
            return NextResponse.json({ message: "Admin profile not found" }, { status: 404 });
        }

        console.log("Admin profile updated:", updatedAdmin._id);
        return NextResponse.json({ message: "Profile updated", admin: updatedAdmin }, { status: 200 });

    } catch (error) {
        console.error("API Error updating admin profile:", error);
         if (error.name === 'ValidationError') {
             return NextResponse.json({ message: `Validation Failed: ${error.message}`, errors: error.errors }, { status: 400 });
        }
        return NextResponse.json({ message: "Server error updating profile", error: error.message }, { status: 500 });
    }
}