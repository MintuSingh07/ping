const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    status: {
      type: String,
      enum: ["active", "suspended", "pending"],
      default: "active",
    },
    // Integration Channels
    integrations: {
      whatsapp: {
        connected: { type: Boolean, default: false },
        phoneNumber: { type: String, default: "" },
        pushName: { type: String, default: "" },
        connectedAt: { type: Date },
      },
      telegram: {
        connected: { type: Boolean, default: false },
        phoneNumber: { type: String, default: "" },
        username: { type: String, default: "" },
        userId: { type: String, default: "" },
        sessionString: { type: String, default: "" }, // Will hold encrypted GramJS session string
        connectedAt: { type: Date },
      },
      linkedin: {
        connected: { type: Boolean, default: false },
        profileId: { type: String, default: "" },
        name: { type: String, default: "" },
        email: { type: String, default: "" },
        avatar: { type: String, default: "" },
        accessToken: { type: String, default: "" }, // Encrypted
        refreshToken: { type: String, default: "" }, // Encrypted
        expiresAt: { type: Date },
        connectedAt: { type: Date },
      },
      gmail: {
        connected: { type: Boolean, default: false },
        email: { type: String, default: "" },
        name: { type: String, default: "" },
        accessToken: { type: String, default: "" }, // Encrypted
        refreshToken: { type: String, default: "" }, // Encrypted
        expiresAt: { type: Date },
        connectedAt: { type: Date },
      },
    },
  },
  { timestamps: true }
);

// Pre-save hook to hash password if modified
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to check password validity
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
