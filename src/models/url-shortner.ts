import { Schema, Types, model, Document } from "mongoose";
import type { IUser } from "./user.js";

interface IUrlShortnerSchema extends Document {
  longUrl: string;
  shortCode: string;
  click: number;
  creator: Types.ObjectId | IUser;
  expiresAt: Date | null;
  createdAt: string;
  updatedAt: string;
}

const urlShortnerSchema = new Schema(
  {
    longUrl: {
      type: String,
      required: true,
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
    },
    click: {
      type: Number,
      default: 0,
    },
    creator: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
    },


  },
  { timestamps: true },
);

export default model<IUrlShortnerSchema>("UrlShortner", urlShortnerSchema);
