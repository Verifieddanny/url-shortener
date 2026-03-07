import mongoose from "mongoose";
import urlShortner from "../src/models/url-shortner.js";
import user from "../src/models/user.js";

after(async () => {
  console.log("Cleaning up global database connection...");
  await user.deleteMany({});
  await urlShortner.deleteMany({});

  await mongoose.connection.close();
});
