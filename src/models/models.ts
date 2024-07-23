import mongoose, { model, Schema } from "mongoose";

const userSchema = new mongoose.Schema(
  {
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
      required: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    authProvider: {
      type: String,
      required: true,
      enum: ["local", "google"],
      default: "local",
    },
  },
  { timestamps: true },
);

userSchema.pre("save", function (next) {
  if (this.authProvider === "local" && !this.password) {
    const err = new Error("Password is required for local auth provider");
    return next(err);
  }
  next();
});

const BoardSchema = new Schema(
  {
    name: { type: String, required: true },
    description: String,
    columns: [{ type: mongoose.Schema.Types.ObjectId, ref: "Column" }],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
