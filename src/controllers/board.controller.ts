import { Request, Response } from "express";
import mongoose, { startSession } from "mongoose";
import { Board, Column, Task, TaskOrderInAColumn } from "../models/models";
import { tokenType } from "../middlewares/auth.middleware";

const createNewBoard = async (req: Request, res: Response) => {
  const user = req.body.user as tokenType;
  const { name, description } = req.body;
  const session = await startSession();
  session.startTransaction();
  try {
    const savedBoard = await Board.create(
      [{ name, description, userId: user.userId }],
      { session },
    );

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
    const pipeline = [
      {
        $project: {
          _id: 0,
          boardId: "$_id",
          name: 1,
          description: 1,
          createdAt: 1,
        },
      },
    ];

    const boards = await Board.aggregate(pipeline);

    return res.status(200).json(boards);
  } catch (error) {
    console.error(error);
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
        $unwind: "$columnsData.taskOrder",
      },
      {
        $lookup: {
          from: "tasks",
          localField: "columnsData.taskOrder.tasks",
          foreignField: "_id",
          as: "columnsData.taskDetails",
        },
      },
      {
        $addFields: {
          "columnsData.taskDetails": {
            $map: {
              input: "$columnsData.taskOrder.tasks",
              as: "taskId",
              in: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$columnsData.taskDetails",
                      cond: { $eq: ["$$this._id", "$$taskId"] },
                    },
                  },
                  0,
                ],
              },
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          description: { $first: "$description" },
          columns: { $push: "$columnsData" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
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
                tasks: "$$column.taskDetails", // Tasks in the original order
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

const updateOrder = async (req: Request, res: Response) => {
  try {
    const { taskOrderId, tasks } = req.body;

    console.log({ taskOrderId, tasks });
    const task = await TaskOrderInAColumn.findOneAndUpdate(
      { _id: taskOrderId },
      { $set: { tasks } },
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.sendStatus(200);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updateSourceAndDestination = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      status,
      taskId,
      sourceTaskOrderId,
      destinationTaskOrderId,
      sourceTasks,
      destinationTasks,
    } = req.body;

    // Update the task
    const taskUpdate = await Task.findOneAndUpdate(
      { _id: taskId },
      { $set: { status } },
      { session },
    );

    if (!taskUpdate) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Task not found" });
    }

    // Update the task order source
    const taskOrderUpdateSource = await TaskOrderInAColumn.findOneAndUpdate(
      { _id: sourceTaskOrderId },
      { $set: { tasks: sourceTasks } },
      { session },
    );

    if (!taskOrderUpdateSource) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Task order not found" });
    }

    // Update the task order destination
    const taskOrderUpdateDestination =
      await TaskOrderInAColumn.findOneAndUpdate(
        { _id: destinationTaskOrderId },
        { $set: { tasks: destinationTasks } },
        { session },
      );

    if (!taskOrderUpdateDestination) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Task order not found" });
    }

    // Commit the transaction
    await session.commitTransaction();
    return res.sendStatus(200);
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    session.endSession();
  }
};

export {
  createNewBoard,
  createTask,
  getAllBoards,
  getBoardById,
  updateTaskById,
  updateOrder,
  updateSourceAndDestination,
};
