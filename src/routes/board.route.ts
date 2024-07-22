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

const BoardRouter = express.Router();
BoardRouter.post("/create-board", createNewBoard);
BoardRouter.get("/list", getAllBoards);
BoardRouter.post("/task/create", createTask);
BoardRouter.get("/:boardId", getBoardById);
BoardRouter.put("/task/update/:id", updateTaskById);
BoardRouter.post("/task/update/order", updateOrder);
BoardRouter.post("/task/update/source-destination", updateSourceAndDestination);

export default BoardRouter;
