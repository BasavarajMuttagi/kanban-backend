import mongoose, { model, Schema } from "mongoose";

const userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const BoardSchema = new Schema(
  {
    name: { type: String, required: true },
    description: String,
    columns: [{ type: mongoose.Schema.Types.ObjectId, ref: "Column" }],
  },
  { timestamps: true },
);

const ColumnSchema = new Schema({
  name: {
    type: String,
    enum: ["TODO", "IN_PROGRESS", "DONE"],
    required: true,
  },
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Board",
    required: true,
  },
  taskOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TaskOrderInAColumn",
    required: true,
  },
});

const TaskSchema = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    columnId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Column",
      required: true,
    },
    status: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "DONE"],
      default: "TODO",
    },
  },
  { timestamps: true },
);

const TaskOrderInAColumnSchema = new Schema({
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
  columnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Column",
  },
});

const Board = model("Board", BoardSchema);
const Column = model("Column", ColumnSchema);
const Task = model("Task", TaskSchema);
const TaskOrderInAColumn = model(
  "TaskOrderInAColumn",
  TaskOrderInAColumnSchema,
);
const User = mongoose.model("User", userSchema);
export { Board, Column, Task, TaskOrderInAColumn, User };
