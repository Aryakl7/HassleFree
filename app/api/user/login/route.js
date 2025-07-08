// FILE: app/api/user/login/route.js
import connectMongo from "@/lib/db";
import user from "@/models/user"; // Use correct model import name
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
  console.log("--- HIT: POST /api/user/login ---"); // Add log
  try {
    await connectMongo();
    const { email, password } = await req.json();
    console.log("[User Login API] Attempting login for:", email); // Log attempt

    if (!email || !password) {
      return NextResponse.json({ message: "Please provide email and password" }, { status: 400 });
    }

    // *** Ensure you select societyId AND password ***
    const foundUser = await user.findOne({ email }).select('+password +societyId'); // Select both explicitly

    if (!foundUser) {
         console.log("[User Login API] User not found:", email);
         return NextResponse.json({ message: "Incorrect email or password" }, { status: 401 });
    }
    console.log("[User Login API] User found:", foundUser._id);

    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) {
      console.log("[User Login API] Password mismatch for:", email);
      return NextResponse.json({ message: "Incorrect email or password" }, { status: 401 });
    }
    console.log("[User Login API] Password matched for:", email);


     // *** CRITICAL: Check and Log societyId BEFORE signing token ***
     if (!foundUser.societyId) {
         console.error(`[User Login API] CRITICAL: User ${email} (ID: ${foundUser._id}) is missing societyId!`);
         return NextResponse.json({ message: "User account not fully configured (missing society link)." }, { status: 403 }); // Use 403 Forbidden
     }
     console.log(`[User Login API] User ${email} belongs to society: ${foundUser.societyId}`);
     // ----------------------------------------------------------

    // *** Include societyId in the JWT payload ***
    const accessTokenPayload = {
        id: foundUser._id.toString(),
        societyId: foundUser.societyId.toString(), // <--- ENSURE THIS IS CORRECT
        // Add other non-sensitive fields if needed (e.g., name: foundUser.name)
    };
    console.log("[User Login API] Signing token with payload:", accessTokenPayload);
    // -----------------------------------------
    console.log("[User Login API] SECRET USED FOR SIGNING:", process.env.ACCESS_TOKEN_SECRET_USER);
    const accessToken = sign(
      accessTokenPayload,
      process.env.ACCESS_TOKEN_SECRET_USER, // *** Use USER secret ***
      { expiresIn: "7d" }
    );
    console.log("[User Login API] Token signed successfully.");

    const responseBody = {
      message: "Login successful",
      accessToken,
      societyId: foundUser.societyId.toString(), // Return for cookie setting
      status: "success",
    };

    return NextResponse.json(responseBody, { status: 200 });

  } catch (err) {
    console.error("[User Login API] Error during user login:", err);
    return NextResponse.json({ message: "Internal server error during login", status: "error", }, { status: 500 });
  }
}