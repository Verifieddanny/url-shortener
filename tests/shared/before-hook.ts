import mongoose from "mongoose";
import user from "../../src/models/user.js";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import type { IUser } from "../../src/models/user.js";
import urlShortner from "../../src/models/url-shortner.js";

dotenv.config();

interface SetupOptions {
  createSecondaryUser?: boolean;
}

export const mongooseConnect = async (
  options: SetupOptions = {},
): Promise<{ testUser: IUser; dummyUser?: IUser | undefined }> => {
  const state = mongoose.connection.readyState;
  if (state === 0 || state === 3) {
    if (state === 3) {
      await new Promise((resolve) =>
        mongoose.connection.once("disconnected", resolve),
      );
    }
    await mongoose.connect(process.env.TEST_MONGODB_URL!);
  } else if (state === 2) {
    await new Promise((resolve) =>
      mongoose.connection.once("connected", resolve),
    );
  }

  await user.deleteMany({});
  await urlShortner.deleteMany({});

  const hashedPassword = await bcrypt.hash("1234567890", 12);

  const userInMem = new user({
    firstName: "Test Name",
    lastName: "Test Name",
    username: "devTester",
    email: "test@test.com",
    password: hashedPassword,
  });

  const testUser = await userInMem.save();

  let dummyUser: IUser;
  if (options.createSecondaryUser) {
    const otherUser = new user({
      username: "otherGuy",
      email: "other@test.com",
      password: "hashedPassword",
      firstName: "Other",
      lastName: "User",
    });
    dummyUser = await otherUser.save();
    return { testUser, dummyUser };
  }

  return { testUser };
};
