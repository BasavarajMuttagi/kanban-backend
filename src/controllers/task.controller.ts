import { Request, Response } from "express";
import { Task } from "../models/models";

const createTask = async (req: Request, res: Response) => {
  try {
    await Task.create(req.body);
    return res.sendStatus(201);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getAllTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await Task.find({ isDeleted: false });
    return res.status(200).json(tasks);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getTaskById = async (req: Request, res: Response) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, isDeleted: false });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    return res.status(200).json(task);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updateTaskById = async (req: Request, res: Response) => {
  try {
    const { title, description, status } = req.body;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: { title, description, status } },
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.sendStatus(200);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const softDeleteTaskById = async (req: Request, res: Response) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, {
      isDeleted: true,
    });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    return res.sendStatus(200);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export {
  createTask,
  getAllTasks,
  getTaskById,
  updateTaskById,
  softDeleteTaskById,
};
