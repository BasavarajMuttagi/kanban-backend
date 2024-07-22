import { Request, Response } from "express";
import mongoose, { startSession } from "mongoose";
import { Board, Column, Task, TaskOrderInAColumn } from "../models/models";

const createNewBoard = async (req: Request, res: Response) => {
  const { name, description } = req.body;
  const session = await startSession();
  session.startTransaction();
  try {
    const savedBoard = await Board.create([{ name, description }], { session });

    const savedTaskOrders = await TaskOrderInAColumn.create([{}, {}, {}], {
      session,
    });

    const columns = ["TODO", "IN_PROGRESS", "DONE"].map((name, index) => ({
      name,
      boardId: savedBoard[0]._id,
      taskOrderId: savedTaskOrders[index]._id,
    }));

    const savedColumns = await Column.create(columns, { session });
    savedColumns.map((eachColumn, index) => {
      savedTaskOrders[index].columnId = eachColumn._id;
    });

    await TaskOrderInAColumn.bulkSave(savedTaskOrders, { session });
    await Board.updateOne(
      { _id: savedBoard[0]._id },
      {
        $push: { columns: { $each: savedColumns.map((column) => column._id) } },
      },
      { session },
    );
    await session.commitTransaction();
    session.endSession();
    return res.sendStatus(201);
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getAllBoards = async (req: Request, res: Response) => {
  try {
    const boards = await Board.find().select("-__v -updatedAt -columns");
    return res.status(200).json(boards);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getBoardById = async (req: Request, res: Response) => {
  try {
    const boardId = new mongoose.Types.ObjectId(req.params.boardId);
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }

    const groupedList = await Board.aggregate([
      {
        $match: {
          _id: boardId,
        },
      },
      {
        $lookup: {
          from: "columns",
          localField: "columns",
          foreignField: "_id",
          as: "columnsData",
        },
      },
      {
        $unwind: "$columnsData",
      },
      {
        $lookup: {
          from: "taskorderinacolumns",
          localField: "columnsData.taskOrderId",
          foreignField: "_id",
          as: "columnsData.taskOrder",
        },
      },
      {
        $lookup: {
          from: "tasks",
          localField: "columnsData.taskOrder.tasks",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                updatedAt: 0,
                __v: 0,
                columnId: 0,
              },
            },
          ],
          as: "columnsData.taskOrder",
        },
      },
      {
        $group: {
          _id: "$_id",
          name: {
            $first: "$name",
          },
          description: {
            $first: "$description",
          },
          columns: {
            $push: "$columnsData",
          },
          createdAt: {
            $first: "$createdAt",
          },
          updatedAt: {
            $first: "$updatedAt",
          },
        },
      },
      {
        $project: {
          _id: 0,
          boardId: "$_id",
          name: "$name",
          description: "$description",
          columns: {
            $map: {
              input: "$columns",
              as: "column",
              in: {
                columnId: "$$column._id",
                name: "$$column.name",
                taskOrderId: "$$column.taskOrderId",
                tasks: "$$column.taskOrder",
              },
            },
          },
          createdAt: "$createdAt",
        },
      },
    ]);

    return res.status(200).json(groupedList[0]);
  } catch (error) {
    console.error("Error fetching tasks:", error); // Log the error for debugging
    return res.status(500).json({ error: "Internal server error" });
  }
};

const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, columnId } = req.body as {
      title: string;
      description: string;
      columnId: string;
    };

    const newTask = await Task.create({
      title,
      description,
      columnId,
    });

    await TaskOrderInAColumn.findOneAndUpdate(
      { columnId },
      { $push: { tasks: newTask._id } },
    );

    return res.status(201).json(newTask);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updateTaskById = async (req: Request, res: Response) => {
  try {
    const { title, description, status } = req.body;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id },
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

export {
  createNewBoard,
  createTask,
  getAllBoards,
  getBoardById,
  updateTaskById,
};
