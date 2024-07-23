import express from "express";
import {
  createNewBoard,
  createTask,
  deleteTaskAndUpdateOrder,
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
BoardRouter.post(
  "/task/update/source-destination",
  validateToken,
  updateSourceAndDestination,
);
BoardRouter.post("/task/update/order", validateToken, updateOrder);
BoardRouter.post("/task/update/:id", validateToken, updateTaskById);

BoardRouter.post("/task/delete/", validateToken, deleteTaskAndUpdateOrder);

export default BoardRouter;
