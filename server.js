import "express-async-errors";

import connectDB from "./db/connect.js";
import contactsRouter from "./routes/contactsRouter.js";
import dotenv from "dotenv";
import { errorHandlerMiddleware } from "./middlewares/error-handler.js";
import express from "express";
import { fileURLToPath } from "url";
import morgan from "morgan";
import notFoundMiddleware from "./middlewares/not-found.js";

dotenv.config();

const app = express();

if (process.env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
}

app.use(express.json());

app.use("/asset", express.static("public/asset"));
app.use("/api/v1/contacts", contactsRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

//connection
const start = async () => {
    try {
        await connectDB(process.env.MONGO_URL);
        app.listen(port, () => {
            console.log(` Server is running on port ${port}`);
        });
    } catch (error) {
        console.log(error);
    }
};

start();
