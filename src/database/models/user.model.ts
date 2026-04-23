import { model, Schema } from "mongoose";
import { fa } from "zod/v4/locales";
import { compareHash, hashValue } from "../../common/utils/bcrypt";
import { use } from "passport";
import { compare } from "bcrypt";

interface UserPreferences {
  enable2FA: boolean;
  emailNotification: boolean;
  twoFactorSecret?: string;
}

export interface UserDocument extends Document {
  id: string;
  name: string;
  email: string;
  password: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  userPreferences: UserPreferences;
  comparePassword(value: string): Promise<boolean>;
}

const UserPreferencesSchema = new Schema<UserPreferences>({
  enable2FA: { type: Boolean, default: false },
  emailNotification: { type: Boolean, default: true },
  twoFactorSecret: {
    type: String,
    required: false,
  },
});

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: false, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    isEmailVerified: { type: Boolean, default: false },
    userPreferences: { type: UserPreferencesSchema, default: {} },
  },
  {
    timestamps: true,
    toJSON: {},
  }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await hashValue(this.password);
  }
});

userSchema.methods.comparePassword = async function (
  value: string
): Promise<boolean> {
  return compareHash(value, this.password);
};

userSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.password = ""; // Clear password field
    delete ret.userPreferences.twoFactorSecret;
    return ret;
  },
});

const UserModel = model<UserDocument>("User", userSchema);

export default UserModel;
