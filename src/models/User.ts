import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;   // Date mejor que number
  passwordChangedAt?: Date;      // ⬅️ NUEVO
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },    // mejor Date
    passwordChangedAt: { type: Date },       // ⬅️ NUEVO
  },
  { timestamps: true }
);

// Método para comparar password
UserSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.passwordHash);
};

// Cuando cambia el hash, marcamos passwordChangedAt
UserSchema.pre("save", function (next) {
  if (this.isModified("passwordHash")) {
    this.set("passwordChangedAt", new Date());
  }
  next();
});

export default mongoose.model<IUser>("User", UserSchema);
