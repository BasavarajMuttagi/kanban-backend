import express from "express";
import {
  createTask,
  getAllTasks,
  getTaskById,
  softDeleteTaskById,
  updateTaskById,
} from "../controllers/task.controller";

const TaskRouter = express.Router();

TaskRouter.post("/create", createTask);
TaskRouter.get("/getall", getAllTasks);
TaskRouter.get("/:id", getTaskById);
TaskRouter.put("/update/:id", updateTaskById);
TaskRouter.delete("/delete/:id", softDeleteTaskById);

export default TaskRouter;
