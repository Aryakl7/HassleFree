import connectMongo from "@/lib/db";
import admin from "@/models/admin"; // Use the correct model import
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";
import { NextResponse } from 'next/server'; // Use NextResponse for consistency

export async function POST(req) {
  console.log("--- HIT: POST /api/admin/login ---"); // Log entry
  try {
    await connectMongo();

    const { email, password } = await req.json();
    console.log("[Admin Login] Attempting login for:", email);

    if (!email || !password) {
      return NextResponse.json(
        { message: "Please provide email and password" },
        { status: 400 }
      );
    }

    // Fetch admin INCLUDING societyId and password
    const foundAdmin = await admin.findOne({ email }).select('+password +societyId'); // <-- Explicitly select societyId

    if (!foundAdmin) {
        console.log("[Admin Login] Admin not found:", email);
        return NextResponse.json({ message: "Incorrect email or password" }, { status: 401 });
    }
    console.log("[Admin Login] Admin found:", foundAdmin._id);


    const isMatch = await bcrypt.compare(password, foundAdmin.password);
    if (!isMatch) {
       console.log("[Admin Login] Password mismatch for:", email);
      return NextResponse.json({ message: "Incorrect email or password" }, { status: 401 });
    }
     console.log("[Admin Login] Password matched for:", email);

    // --- Verification: Ensure the admin has a society linked ---
    if (!foundAdmin.societyId) {
      console.error(`[Admin Login] CRITICAL: Admin ${foundAdmin.email} (ID: ${foundAdmin._id}) has no associated societyId!`);
      return NextResponse.json(
          { message: "Admin account is not properly configured. Missing Society association." },
          { status: 500 } // Or potentially 403 Forbidden
      );
    }
     console.log(`[Admin Login] Admin ${email} belongs to society: ${foundAdmin.societyId}`);
    // --- End Verification ---

    // --- *** FIX: Define the payload object including societyId *** ---
    const accessTokenPayload = {
      id: foundAdmin._id.toString(),
      isAdmin: true,
      societyId: foundAdmin.societyId.toString()
    };
    console.log("[Admin Login] Signing token with payload:", accessTokenPayload);
    // ---------------------------------------------------------------

    console.log("[Admin Login] Signing with Secret:", process.env.ACCESS_TOKEN_SECRET_ADMIN); // Log secret being used

    const accessToken = sign(
      accessTokenPayload,
      process.env.ACCESS_TOKEN_SECRET_ADMIN,
      { expiresIn: "8h" } 
    );
    console.log("[Admin Login] Token signed.");

    // Return token AND societyId in the response body (for cookie setting)
    return NextResponse.json(
      {
        accessToken,
        societyId: foundAdmin.societyId.toString(), // Return for cookie setting on frontend
        status: "success"
      },
      { status: 200 }
    );

  } catch (err) {
     console.error("Admin Login Error:", err);
    return NextResponse.json(
      { message: "Something went wrong during login", status: "error", detail: err.message },
      { status: 500 }
    );
  }
}