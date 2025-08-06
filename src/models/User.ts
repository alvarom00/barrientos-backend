import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: number;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Number },
});

// Método para comparar contraseña
UserSchema.methods.comparePassword = async function (candidate: string) {
  const bcrypt = require("bcryptjs");
  return bcrypt.compare(candidate, this.passwordHash);
};

export default mongoose.model<IUser>("User", UserSchema);
