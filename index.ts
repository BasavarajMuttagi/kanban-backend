import { config } from "dotenv";
import express from "express";
import cors from "cors";
import { connect } from "mongoose";
import BoardRouter from "./src/routes/board.route";
import AuthRouter from "./src/routes/auth.route";

const app = express();
app.use(cors());
app.use(express.json());
config();
const PORT = process.env.PORT;
const DATABASE_URL = process.env.DATABASE_URL;
export const SECRET_SALT = process.env.SECRET_SALT as string;

app.use("/auth", AuthRouter);
app.use("/board", BoardRouter);
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
