import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI ||
        "mongodb+srv://rnethrasais_db_user:ePAhwlpRl6GLLwGa@cluster0.ke17muz.mongodb.net/?appName=Cluster0",
      {
        tlsAllowInvalidCertificates: true,
      },
    );
    console.log("MongoDB Connected");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

export default connectDB;
