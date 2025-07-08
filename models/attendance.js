// models/attendance.model.js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const attendanceLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' }, // Can be null for non-user entries like delivery
  guestId: { type: Schema.Types.ObjectId, ref: 'Guest' }, // Link to guest if applicable
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' }, // Link to booking if applicable
  deliveryId: { type: String }, // Unique ID for delivery personnel if needed
  personName: { type: String, required: true }, // Name of person (user, guest, delivery)
  timestamp: { type: Date, default: Date.now, required: true },
  type: { type: String, enum: ['entry', 'exit'], required: true },
  source: { 
    type: String,
    enum: ['main_gate', 'amenity_checkin', 'delivery_point', 'manual_admin'],
    required: true,
    default: 'main_gate'
  },
  location: { type: String, required: true }, // e.g., "Main Gate", "Swimming Pool", "Block A Lobby"
  vehicleNumber: { type: String }, // If associated vehicle entry
  purpose: { type: String }, // If applicable (e.g., Delivery, Guest Visit)
  confidence: { type: Number }, // For facial recognition
  deviceId: { type: String }, // ID of scanner/device
  verificationMethod: {
    type: String,
    enum: ['facial_recognition', 'manual', 'qr_code', 'override', 'vehicle_plate'], // Added vehicle plate
    required: true
  },
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'Worker' }, // Guard or Staff ID
  photo: { type: String }, // Snapshot URL
  status: { // Log status itself (usually verified unless override)
    type: String,
    enum: ['verified', 'failed', 'manual_override'],
    required: true,
    default: 'verified'
  },
  societyId: { type: Schema.Types.ObjectId, ref: 'Society', required: true }
}, { timestamps: true });

export default mongoose.models?.AttendanceLog || mongoose.model('AttendanceLog', attendanceLogSchema);