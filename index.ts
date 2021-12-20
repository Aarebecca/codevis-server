import express from "express";
import bodyParser from "body-parser";
import { config } from "./express.config";
import { varFlowPipeline, initLogger } from "./src";
import cors from "cors";

const logger = initLogger();
logger.info("start service");

const CONSTANTS = {
  success: "ok",
  error: "fail",
};

const app = express();

app.use(
  cors({
    origin: "*",
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.post("/var-flow", (req, res) => {
  const { code, mixer = "average", nodeColor = "{}" } = req.body;
  if (!code) {
    res.status(400).send("code is required");
    return;
  }
  try {
    res.send({
      status: CONSTANTS.success,
      data: varFlowPipeline(code, mixer, nodeColor),
    });
  } catch (e) {
    // log
    logger.error(`var-flow error: ${e}`);
    res.send({
      status: CONSTANTS.error,
      message: "解析失败",
    });
  }
});

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});
