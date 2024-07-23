import express from "express";
import {
  createNewBoard,
  createTask,
  getAllBoards,
  getBoardById,
  updateOrder,
  updateSourceAndDestination,
  updateTaskById,
} from "../controllers/board.controller";
import { validateToken } from "../middlewares/auth.middleware";

const BoardRouter = express.Router();
BoardRouter.post("/create-board", validateToken, createNewBoard);
BoardRouter.get("/list", validateToken, getAllBoards);
BoardRouter.post("/task/create", validateToken, createTask);
BoardRouter.get("/:boardId", validateToken, getBoardById);
BoardRouter.put("/task/update/:id", validateToken, updateTaskById);
BoardRouter.post("/task/update/order", validateToken, updateOrder);
BoardRouter.post(
  "/task/update/source-destination",
  validateToken,
  updateSourceAndDestination,
);

export default BoardRouter;
