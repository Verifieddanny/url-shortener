import { Schema, Types, model, Document } from "mongoose";

interface IDemo extends Document {
  longUrl: string;
  shortCode: string;
  expiresAt: Date;
  createdAt: string;
  updatedAt: string;
}

const Demo = new Schema(
  {
    longUrl: {
      type: String,
      required: true,
      unique: true,
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      expires: "2d",
    },
  },
  { timestamps: true },
);

export default model<IDemo>("Demo", Demo);
