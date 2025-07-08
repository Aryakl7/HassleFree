// FILE: app/api/gate/vehicle-scan/route.js
import connectMongo from "@/lib/db";
import User from "@/models/user";
import Guest from "@/models/guest";
import VehicleEntryLog from "@/models/vehicleEntry";
import AttendanceLog from "@/models/attendance";
import { verify } from "jsonwebtoken";
import { NextResponse } from 'next/server';
import { format } from "date-fns";

// TODO: Implement proper guard/device authentication
async function verifyGuardToken(req) { /* ... */ return { isValid: true, payload: { guardId: 'GUARD_DEVICE_001', societyId: 'YOUR_SOCIETY_ID_FOR_TESTING' } }; }


export async function POST(req) {
    console.log("--- HIT: POST /api/gate/vehicle-scan ---");
    try {
        await connectMongo();
        const authResult = await verifyGuardToken(req);
        if (!authResult.isValid) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

        const { plateNumber, direction, gateLocation, imageOfPlateUrl } = await req.json(); // direction: 'entry' or 'exit'

        if (!plateNumber || !direction || !gateLocation) {
            return NextResponse.json({ error: "Missing plateNumber, direction, or gateLocation" }, { status: 400 });
        }

        const societyId = authResult.payload.societyId;
        const now = new Date();
        let vehicleLogType = 'unauthorized';
        let associatedUserId = null;
        let associatedGuestId = null;
        let personName = `Vehicle: ${plateNumber}`;
        let attendanceLogPurpose = `Vehicle ${plateNumber} ${direction}`;

        if (direction === 'entry') {
            // 1. Check if it's a resident's vehicle
            const residentVehicle = await User.findOne({ societyId, carNumbers: plateNumber }).select('name _id houseNo flatNo');
            if (residentVehicle) {
                vehicleLogType = 'resident';
                associatedUserId = residentVehicle._id;
                personName = residentVehicle.name;
                attendanceLogPurpose = `Resident Vehicle Entry: ${plateNumber}`;
                console.log(`Vehicle ${plateNumber} identified as resident: ${residentVehicle.name}`);
            } else {
                // 2. Check if it's an expected guest's vehicle (approved, for today)
                const todayStr = format(now, 'yyyy-MM-dd');
                const guestVehicle = await Guest.findOne({
                    societyId,
                    carNo: plateNumber,
                    status: 'approved', // Or 'checked-in' if they can enter multiple times
                    date: { $gte: new Date(todayStr), $lt: new Date(new Date(todayStr).setDate(new Date(todayStr).getDate() + 1)) }
                }).populate('userId', 'name'); // To get host name

                if (guestVehicle) {
                    vehicleLogType = 'guest';
                    associatedGuestId = guestVehicle._id;
                    associatedUserId = guestVehicle.userId?._id; // Host user
                    personName = `Guest: ${guestVehicle.name} (Vehicle: ${plateNumber})`;
                    attendanceLogPurpose = `Guest Vehicle Entry: ${plateNumber} (Host: ${guestVehicle.userId?.name || 'N/A'})`;
                    // Optionally update guest status to 'checked-in' if not already
                    if (guestVehicle.status === 'approved') {
                        guestVehicle.status = 'checked-in';
                        guestVehicle['timestamps.entry'] = now;
                        await guestVehicle.save();
                    }
                    console.log(`Vehicle ${plateNumber} identified as guest: ${guestVehicle.name}`);
                } else {
                    console.log(`Vehicle ${plateNumber} is unauthorized.`);
                }
            }

            // Create VehicleEntryLog for entry
            await VehicleEntryLog.create({
                vehicleNumber: plateNumber, entryTime: now, type: vehicleLogType,
                purpose: attendanceLogPurpose, residentId: associatedUserId, guestId: associatedGuestId,
                capturedImage: imageOfPlateUrl, societyId, securityGuardId: authResult.payload.guardId
            });

            // Create AttendanceLog for entry
            await AttendanceLog.create({
                userId: associatedUserId, guestId: associatedGuestId,
                personName: personName, timestamp: now, type: 'entry',
                source: 'main_gate', location: gateLocation,
                vehicleNumber: plateNumber, purpose: attendanceLogPurpose,
                verificationMethod: 'vehicle_plate', verifiedBy: authResult.payload.guardId, status: 'verified',
                societyId
            });

        } else if (direction === 'exit') {
            // Find the latest entry for this vehicle without an exit time
            const lastEntry = await VehicleEntryLog.findOneAndUpdate(
                { vehicleNumber: plateNumber, societyId, exitTime: null },
                { $set: { exitTime: now } },
                { sort: { entryTime: -1 } }
            ).populate('residentId', 'name').populate('guestId', 'name');

            if (lastEntry) {
                personName = lastEntry.residentId?.name || lastEntry.guestId?.name || `Vehicle: ${plateNumber}`;
                associatedUserId = lastEntry.residentId?._id;
                associatedGuestId = lastEntry.guestId?._id;
                attendanceLogPurpose = `Vehicle Exit: ${plateNumber}`;

                 // Create AttendanceLog for exit
                await AttendanceLog.create({
                    userId: associatedUserId, guestId: associatedGuestId,
                    personName: personName, timestamp: now, type: 'exit',
                    source: 'main_gate', location: gateLocation,
                    vehicleNumber: plateNumber, purpose: attendanceLogPurpose,
                    verificationMethod: 'vehicle_plate', verifiedBy: authResult.payload.guardId, status: 'verified',
                    societyId
                });
                console.log(`Vehicle ${plateNumber} exit logged.`);
            } else {
                console.warn(`No matching entry found for exiting vehicle: ${plateNumber}`);
                 // Optionally create an exit log anyway, perhaps as 'unknown_exit'
            }
        }

        return NextResponse.json({ message: `Vehicle ${plateNumber} ${direction} processed.` }, { status: 200 });

    } catch (error) {
        console.error("Vehicle Scan API Error:", error);
        return NextResponse.json({ error: "Vehicle scan processing failed", detail: error.message }, { status: 500 });
    }
}