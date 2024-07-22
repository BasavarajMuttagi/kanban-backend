import express from "express";
import {
  createNewBoard,
  createTask,
  getAllBoards,
  getBoardById,
  updateTaskById,
} from "../controllers/board.controller";

const BoardRouter = express.Router();
BoardRouter.post("/create-board", createNewBoard);
BoardRouter.get("/list", getAllBoards);
BoardRouter.post("/task/create", createTask);
BoardRouter.get("/:boardId", getBoardById);
BoardRouter.put("/task/update/:id", updateTaskById);

export default BoardRouter;
