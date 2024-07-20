import { config } from "dotenv";
import express from "express";
import cors from "cors";
const app = express();
app.use(cors());
app.use(express.json());
config();
export const PORT = process.env.PORT;


app.get("/", (req, res) => {
  res.send("Express + TypeScript Servers");
});

app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});

export default app;