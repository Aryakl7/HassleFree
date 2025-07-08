// FILE: app/api/admin/users/[id]/route.js
import connectMongo from "@/lib/db";
import User from "@/models/user"; // Adjust path if needed
import { verify } from "jsonwebtoken";
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

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

// --- PUT Handler (Update specific user by Admin) ---
export async function PUT(req, { params }) {
    const { id } = params; // User ID
    console.log(`--- HIT: PUT /api/admin/users/${id} ---`);

    const authResult = await verifyAdminToken(req);
    if (authResult.error) return NextResponse.json({ message: authResult.error }, { status: authResult.status });

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Bad Request: Invalid User ID" }, { status: 400 });
    }

    try {
        await connectMongo();
        const updateData = await req.json();

        // IMPORTANT: Admins should NOT update passwords this way.
        delete updateData.password;
        // Admins likely shouldn't change email either.
        delete updateData.email;
        // Prevent changing societyId
        delete updateData.societyId;
        delete updateData._id;

        // Add validation for fields being updated (e.g., name, houseNo required)
        if (updateData.name === "" || updateData.houseNo === "" || updateData.flatNo === "" ) {
             return NextResponse.json({ message: "Bad Request: Name, House No, Flat No cannot be empty" }, { status: 400 });
        }
         // TODO: Add societyId check for security: findOneAndUpdate({ _id: id, societyId: adminSocietyId }, ...)

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password'); // Exclude password

        if (!updatedUser) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        console.log("User updated by admin:", updatedUser._id);
        return NextResponse.json({ message: "User updated", user: updatedUser }, { status: 200 });

    } catch (error) {
        console.error(`API Error updating user ${id}:`, error);
        if (error.name === 'ValidationError') {
             return NextResponse.json({ message: `Validation Failed: ${error.message}`, errors: error.errors }, { status: 400 });
        }
        return NextResponse.json({ message: "Server error updating user", error: error.message }, { status: 500 });
    }
}

// --- DELETE Handler (Delete specific user by Admin) ---
export async function DELETE(req, { params }) {
    const { id } = params; // User ID
    console.log(`--- HIT: DELETE /api/admin/users/${id} ---`);

    const authResult = await verifyAdminToken(req);
    if (authResult.error) return NextResponse.json({ message: authResult.error }, { status: authResult.status });

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Bad Request: Invalid User ID" }, { status: 400 });
    }

    try {
        await connectMongo();

         // TODO: Add societyId check for security: findOneAndDelete({ _id: id, societyId: adminSocietyId })
        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        console.log("User deleted by admin:", deletedUser._id);
        return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });

    } catch (error) {
        console.error(`API Error deleting user ${id}:`, error);
        return NextResponse.json({ message: "Server error deleting user", error: error.message }, { status: 500 });
    }
}