import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import fileUpload from "express-fileupload";
import {
  AST,
  extractVariableNamesList,
  extractVariableNamesWithLoc,
  initLogger,
  varFlowPipeline,
  lifeCycleData,
  phenogram,
} from "./src";
import { config } from "./express.config";

const logger = initLogger();
logger.info("start service");

const CONSTANTS = {
  success: "ok",
  error: "fail",
};

const app = express();

app.use(
  fileUpload({
    createParentPath: true,
  })
);

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

/**
 * parse code and get functions list
 */
app.post("/function-list", async (req, res) => {
  /**
   * get function list
   */
  try {
    // @ts-ignore
    if (!req.files) {
      return res.status(400).send("No file uploaded.");
    }

    // @ts-ignore
    const file = req.files.file;
    const { prettier = 1 } = req.body;
    // @ts-ignore
    const code = file.data.toString();

    const ast = new AST(code);
    const { functions, availableFunctions, normalizeIdentifierFunctions } = ast;
    const generate = (f: typeof functions[0]) => {
      return AST.generate(f, {}, !!prettier);
    };
    res.send({
      status: CONSTANTS.success,
      data: {
        functions: functions.map(generate),
        available: availableFunctions.map(generate),
        normalized: normalizeIdentifierFunctions.map(generate),
      },
    });
  } catch (e) {
    // log
    logger.error(`function list error: ${String(e)}`);
    res.send({
      status: CONSTANTS.error,
      message: "解析失败",
    });
  }
});

/**
 * get variables and it locations in code
 */
app.post("/var-list", (req, res) => {
  const { code } = req.body;
  if (!code) {
    res.status(400).send("code is required");
    return;
  }
  try {
    const ast = new AST(code);
    const { normalizeIdentifierFunctions } = ast;
    const f = normalizeIdentifierFunctions[0];

    res.send({
      status: CONSTANTS.success,
      data: {
        varList: extractVariableNamesList(f),
        locList: extractVariableNamesWithLoc(f, true),
      },
    });
  } catch (e) {
    // log
    logger.error(`var list error: ${e}`);
    res.send({
      status: CONSTANTS.error,
      message: "解析失败",
    });
  }
});

app.post("/heat-map", (req, res) => {
  // TODO 确认下这里 nodeColor 的值
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
    logger.error(`var flow error: ${e}`);
    res.send({
      status: CONSTANTS.error,
      message: "解析失败",
    });
  }
});

/**
 * 生成代码的变量流图数据
 */
app.post("/lifecycle-data", (req, res) => {
  const { code } = req.body;
  if (!code) {
    res.status(400).send("code is required");
    return;
  }
  try {
    res.send({
      status: CONSTANTS.success,
      data: lifeCycleData(code),
    });
  } catch (e) {
    // log
    logger.error(`lifecycle-data: ${e}`);
    res.send({
      status: CONSTANTS.error,
      message: "解析失败",
    });
  }
});

/**
 * 生成代码的表征图数据
 * @param code 代码
 * @param sample 是否采样
 * @param line 采样行数
 * @param column 采样列数
 */
app.post("/phenogram", (req, res) => {
  const { code, sample = false, line, column } = req.body;
  if (!code) {
    res.status(400).send("code is required");
    return;
  }
  try {
    res.send({
      status: CONSTANTS.success,
      data: phenogram(code, sample, [line, column]),
    });
  } catch (e) {
    // log
    logger.error(`phenogram: ${e}`);
    res.send({
      status: CONSTANTS.error,
      message: "解析失败",
    });
  }
});

/**
 * 生成多个代码的表征图数据
 * @param code 代码
 * @param sample 是否采样
 * @param line 采样行数
 * @param column 采样列数
 */
app.post("/multi-phenogram", (req, res) => {
  const { codes, sample = false, line, column } = req.body;
  if (!codes) {
    res.status(400).send("code is required");
    return;
  }
  try {
    res.send({
      status: CONSTANTS.success,
      data: JSON.parse(codes).map((code: string) =>
        phenogram(code, sample, [line, column])
      ),
    });
  } catch (e) {
    // log
    logger.error(`phenogram: ${e}`);
    res.send({
      status: CONSTANTS.error,
      message: "解析失败",
    });
  }
});

/**
 * 查询相似代码
 * @param code 代码
 * @param debug 调试模式，使用样本数据
 */
app.post("/similar-code", (req, res) => {
  const { code, debug } = req.body;
  if (debug) {
    const debugData = {
      "1": [],
    };
  }
});

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});
