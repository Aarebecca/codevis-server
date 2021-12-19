import express from "express";
import bodyParser from "body-parser";
import { config } from "./express.config";
import { varFlowPipeline } from "./src";

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.post("/var-flow", (req, res) => {
  const { code } = req.body;
  if (!code) {
    res.status(400).send("code is required");
    return;
  }
  res.send(JSON.stringify(varFlowPipeline(code)));
});

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});
