import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { auth } from "./config/firebaseAdmin.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/api/auth/verifyToken", async (req, res) => {
try {
    const { token } = req.body;
    const decodedToken = await auth.verifyIdToken(token);
    res.json({ uid: decodedToken.uid });
} catch (error) {
    res.status(401).json({ message: "Invalid token" });
}
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
