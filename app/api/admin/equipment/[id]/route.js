// FILE: app/api/admin/equipment/[id]/route.js
import connectMongo from "@/lib/db";
import Equipment from "@/models/equipment"; // Adjust path if needed
import { verify } from "jsonwebtoken";
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// --- Helper Function to Verify Admin Token --- (Copy from workers/[id]/route.js or create shared util)
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

// --- PUT Handler (Update specific equipment) ---
export async function PUT(req, { params }) {
    const { id } = params;
    console.log(`--- HIT: PUT /api/admin/equipment/${id} ---`);

    const authResult = await verifyAdminToken(req);
    if (authResult.error) return NextResponse.json({ message: authResult.error }, { status: authResult.status });

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Bad Request: Invalid Equipment ID" }, { status: 400 });
    }

    try {
        await connectMongo();
        const updateData = await req.json();
        // Add validation for updateData fields if necessary

        // TODO: Add societyId check for security: findOneAndUpdate({ _id: id, societyId: adminSocietyId }, ...)
        const updatedEquipment = await Equipment.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedEquipment) {
            return NextResponse.json({ message: "Equipment not found" }, { status: 404 });
        }
        console.log("Equipment updated successfully:", updatedEquipment._id);
        return NextResponse.json({ message: "Equipment updated", equipment: updatedEquipment }, { status: 200 });

    } catch (error) {
        console.error(`API Error updating equipment ${id}:`, error);
        if (error.name === 'ValidationError') {
             return NextResponse.json({ message: `Validation Failed: ${error.message}`, errors: error.errors }, { status: 400 });
        }
        return NextResponse.json({ message: "Server error updating equipment", error: error.message }, { status: 500 });
    }
}

// --- DELETE Handler (Delete specific equipment) ---
export async function DELETE(req, { params }) {
    const { id } = params;
    console.log(`--- HIT: DELETE /api/admin/equipment/${id} ---`);

    const authResult = await verifyAdminToken(req);
    if (authResult.error) return NextResponse.json({ message: authResult.error }, { status: authResult.status });

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Bad Request: Invalid Equipment ID" }, { status: 400 });
    }

    try {
        await connectMongo();

        // TODO: Add societyId check for security: findOneAndDelete({ _id: id, societyId: adminSocietyId })
        const deletedEquipment = await Equipment.findByIdAndDelete(id);

        if (!deletedEquipment) {
            return NextResponse.json({ message: "Equipment not found" }, { status: 404 });
        }
        console.log("Equipment deleted successfully:", deletedEquipment._id);
        return NextResponse.json({ message: "Equipment deleted successfully" }, { status: 200 });

    } catch (error) {
        console.error(`API Error deleting equipment ${id}:`, error);
        return NextResponse.json({ message: "Server error deleting equipment", error: error.message }, { status: 500 });
    }
}