import express, { type Request, type Response } from "express";
import cors from "cors";
import "dotenv/config";
import streamFetch from "./business-logic/Stream-Logic/fetch.js";
import AnimeFetch from "./business-logic/Db-Logic/animelistfetch.js";
import AnimeInfoFetch from "./business-logic/Db-Logic/animeinfo.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());

app.get("/", (_req: Request, res: Response) => {
  res.send("hello");
});

app.get("/animeInfo", async (req: Request, res: Response) => {
  const name = req.query.name;
  if (typeof name !== "string" || !name) {
    return res.status(400).json({ error: "name query param is required" });
  }
  try {
    const data = await AnimeInfoFetch(name);
    res.send(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch anime info" });
  }
});

app.get("/assets", async (_req: Request, res: Response) => {
  try {
    res.json(await AnimeFetch());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch assets" });
  }
});

// Shared streaming helper
async function streamPath(path: string, res: Response) {
  // basic path traversal guard
  if (path.split("/").some((seg) => seg === ".." || seg === "")) {
    return res.status(400).json({ error: "Invalid path" });
  }
  try {
    const chunk = await streamFetch(path);
    if (chunk.headers?.["content-type"]) {
      res.setHeader("Content-Type", chunk.headers["content-type"]);
    }
    chunk.data.on("error", (err: Error) => {
      console.error(err);
      if (!res.headersSent) res.sendStatus(500);
      else res.end();
    });
    chunk.data.pipe(res);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.status(404).json({ error: "File not found" });
  }
}

// Specific route first, before the param routes
app.get("/file", async (req: Request, res: Response) => {
  const name = req.query.name;
  if (typeof name !== "string" || !name) {
    return res.status(400).json({ error: "name query param is required" });
  }
  await streamPath(name, res);
});

app.get("/:disk/:name/:ep/:file", async (req: Request, res: Response) => {
  const { disk, name, ep, file } = req.params;
  await streamPath([disk, name, ep, file].join("/"), res);
});

app.get("/:disk/:cat/:name/:ep/:file", async (req: Request, res: Response) => {
  const { disk, cat, name, ep, file } = req.params;
  await streamPath([disk, cat, name, ep, file].join("/"), res);
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});