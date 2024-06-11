import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import morgan from "morgan"
import { corsConfig } from "./config/cors"
import { connectDB } from "./config/db"
import projectRoute from "./routes/projectRoutes"
import authRoutes from "./routes/authRoutes"

// Setting
dotenv.config()
connectDB()

// Server instance
const app = express()
// Add CORS
app.use(cors(corsConfig))
// Logging
app.use(morgan("dev"))
// Read Form Data
app.use(express.json())

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/projects", projectRoute)


export default app