// FILE: app/api/admin/guests/[id]/status/route.js
import connectMongo from "@/lib/db";
import Guest from "@/models/guest";
import { verify } from "jsonwebtoken";
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

const ALLOWED_ADMIN_STATUSES = ['approved', 'rejected', 'checked-in', 'checked-out']; // Statuses admin can set

export async function PUT(req, { params }) {
    const { id } = params; // Guest ID
    console.log(`--- HIT: PUT /api/admin/guests/${id}/status ---`);

    try {
        await connectMongo();

        // 1. Verify Admin Token
        const token = req.headers.get("authorization")?.split(" ")[1];
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        let adminPayload;
        try { adminPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_ADMIN); if (!adminPayload?.id) throw new Error("Invalid"); }
        catch (err) { return NextResponse.json({ message: `Unauthorized: ${err.message}` }, { status: 401 }); }
        // TODO: Ideally get societyId from adminPayload

        // 2. Validate Guest ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: "Bad Request: Invalid Guest ID" }, { status: 400 });
        }

        // 3. Get New Status from Body
        const { status } = await req.json();
        if (!status || !ALLOWED_ADMIN_STATUSES.includes(status)) {
            return NextResponse.json({ message: `Bad Request: Invalid status. Allowed: ${ALLOWED_ADMIN_STATUSES.join(', ')}` }, { status: 400 });
        }

        // 4. Prepare Update Data (include timestamps)
        const updateData = { status: status };
        if (status === 'checked-in') {
            updateData['timestamps.entry'] = new Date();
            // Maybe clear exit time if re-checking in? updateData['timestamps.exit'] = null;
        } else if (status === 'checked-out') {
            updateData['timestamps.exit'] = new Date();
        }

         console.log(`[Admin Update Guest Status] Updating ${id} with:`, updateData);

        // 5. Find and Update Guest
        // TODO: Add societyId check for security
        const updatedGuest = await Guest.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedGuest) {
            return NextResponse.json({ message: "Guest not found" }, { status: 404 });
        }

        // 6. Return Success
        console.log(`Guest ${id} status updated to ${status}`);
        return NextResponse.json({ message: "Guest status updated", guest: updatedGuest }, { status: 200 });

    } catch (error) {
        console.error(`API Error updating guest ${id} status:`, error);
        if (error.name === 'ValidationError') return NextResponse.json({ message: `Validation Failed: ${error.message}` }, { status: 400 });
        return NextResponse.json({ message: "Server error updating guest status", error: error.message }, { status: 500 });
    }
}