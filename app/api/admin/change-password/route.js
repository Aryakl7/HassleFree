// FILE: app/api/admin/change-password/route.js
import connectMongo from "@/lib/db";
import Admin from "@/models/admin"; // Use correct model import
import { verify } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextResponse } from 'next/server';

export async function POST(req) {
    console.log("--- HIT: POST /api/admin/change-password ---");
    try {
        await connectMongo();

        // 1. Verify Admin Token
        const token = req.headers.get("authorization")?.split(" ")[1];
        if (!token) return NextResponse.json({ message: "Unauthorized: No token" }, { status: 401 });

        let adminPayload;
        try {
            adminPayload = verify(token, process.env.ACCESS_TOKEN_SECRET_ADMIN);
            if (!adminPayload?.id) throw new Error("Invalid payload");
        } catch (err) {
            return NextResponse.json({ message: `Unauthorized: ${err.message}` }, { status: 401 });
        }
        const adminId = adminPayload.id;

        // 2. Get Passwords from Body
        const { currentPassword, newPassword } = await req.json();
        if (!currentPassword || !newPassword) {
            return NextResponse.json({ message: "Current and new password are required" }, { status: 400 });
        }
        if (newPassword.length < 6) { // Example validation
            return NextResponse.json({ message: "New password must be at least 6 characters" }, { status: 400 });
        }

        // 3. Find Admin and Verify Current Password
        const admin = await Admin.findById(adminId).select('+password'); // Need password to compare
        if (!admin) {
            return NextResponse.json({ message: "Admin not found" }, { status: 404 });
        }

        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
            return NextResponse.json({ message: "Incorrect current password" }, { status: 400 }); // Bad request, not unauthorized
        }

        // 4. Hash New Password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // 5. Update Password
        admin.password = hashedNewPassword;
        await admin.save(); // Use save to trigger potential pre-save hooks

        console.log(`Password updated successfully for admin: ${adminId}`);
        return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });

    } catch (error) {
        console.error("API Error changing admin password:", error);
        return NextResponse.json({ message: "Server error changing password", error: error.message }, { status: 500 });
    }
}