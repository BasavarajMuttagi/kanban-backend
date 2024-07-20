import { config } from "dotenv";
import express from "express";
import cors from "cors";
import { connect } from "mongoose";
import TaskRouter from "./src/routes/task.route";
const app = express();
app.use(cors());
app.use(express.json());
config();
const PORT = process.env.PORT;
const DATABASE_URL = process.env.DATABASE_URL;

app.use("/task", TaskRouter);
app.get("/", (req, res) => {
  res.send("Express + TypeScript Servers");
});

async function main() {
  try {
    await connect(DATABASE_URL!).then(() => {
      app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
      });
    });
  } catch (error) {
    console.log(error);
  }
}

main();
export default app;
