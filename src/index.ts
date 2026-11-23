import express, { type Request, type Response } from "express";
import cors from "cors";
import "dotenv/config";
import { spawn } from "node:child_process";
import ffmpeg from "@ffmpeg-installer/ffmpeg";
import streamFetch from "./business-logic/Stream-Logic/fetch.js";
import AnimeFetch from "./business-logic/Db-Logic/animelistfetch.js";
import AnimeInfoFetch from "./business-logic/Db-Logic/animeinfo.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const thumbnailCache = new Map<string, Buffer>();
const thumbnailJobs = new Map<string, Promise<Buffer>>();

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

async function captureEpisodeFrame(manifestUrl: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const process = spawn(ffmpeg.path, [
      "-hide_banner", "-loglevel", "error", "-ss", "5", "-i", manifestUrl,
      "-frames:v", "1", "-vf", "scale=640:-2", "-f", "image2pipe", "-vcodec", "mjpeg", "pipe:1",
    ]);
    const chunks: Buffer[] = [];
    let errors = "";
    const timeout = setTimeout(() => process.kill("SIGKILL"), 25000);
    process.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    process.stderr.on("data", (chunk: Buffer) => { errors += chunk.toString(); });
    process.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    process.on("close", (code) => {
      clearTimeout(timeout);
      const image = Buffer.concat(chunks);
      if (code === 0 && image.length) resolve(image);
      else reject(new Error(errors || `ffmpeg exited with code ${code}`));
    });
  });
}

app.get("/episode-thumbnail", async (req: Request, res: Response) => {
  const requestedPath = req.query.path;
  const path = typeof requestedPath === "string" ? requestedPath.replace(/\/+$/, "") : "";
  if (!path || path.startsWith("/") || path.split("/").some((part) => part === ".." || part === "") || path.split("/").length < 3) {
    return res.status(400).json({ error: "A valid episode path is required" });
  }

  const cacheKey = path;
  try {
    let image = thumbnailCache.get(cacheKey);
    if (!image) {
      let job = thumbnailJobs.get(cacheKey);
      if (!job) {
        const encodedPath = path.split("/").map(encodeURIComponent).join("/");
        const manifestUrl = `http://127.0.0.1:${PORT}/${encodedPath}/output.mpd`;
        job = captureEpisodeFrame(manifestUrl);
        thumbnailJobs.set(cacheKey, job);
      }
      image = await job;
      thumbnailCache.set(cacheKey, image);
      if (thumbnailCache.size > 200) thumbnailCache.delete(thumbnailCache.keys().next().value!);
      thumbnailJobs.delete(cacheKey);
    }
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(image);
  } catch (error) {
    thumbnailJobs.delete(cacheKey);
    console.error("Failed to capture episode thumbnail", error);
    res.status(502).json({ error: "Could not capture a frame from this episode" });
  }
});

// Shared streaming helper
async function streamPath(path: string, req: Request, res: Response) {
  // basic path traversal guard
  if (path.split("/").some((seg) => seg === ".." || seg === "")) {
    return res.status(400).json({ error: "Invalid path" });
  }
  try {
    const range = req.header("range");
    const chunk = await streamFetch(path, range);
    if (!chunk?.data) {
      throw new Error("Object storage returned an empty response");
    }
    const headers = chunk.headers ?? {};
    for (const header of [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
      "last-modified",
      "etag",
    ]) {
      if (headers[header]) res.setHeader(header, headers[header]);
    }
    res.status(chunk.status);
    chunk.data.on("error", (err: Error) => {
      console.error(err);
      if (!res.headersSent) res.sendStatus(500);
      else res.end();
    });
    chunk.data.pipe(res);
  } catch (e) {
    const upstreamStatus = (e as { response?: { status?: number } })?.response?.status;
    console.error(`Object storage fetch failed for "${path}" with status ${upstreamStatus ?? "unavailable"}`, e);
    if (!res.headersSent) {
      res.status(upstreamStatus === 404 ? 404 : 502).json({
        error: upstreamStatus === 404 ? "File not found in object storage" : "Failed to fetch file from object storage",
      });
    }
  }
}

// Specific route first, before the param routes
app.get("/file", async (req: Request, res: Response) => {
  const name = req.query.name;
  if (typeof name !== "string" || !name) {
    return res.status(400).json({ error: "name query param is required" });
  }
  await streamPath(name, req, res);
});

app.get("/:disk/:name/:ep/:file", async (req: Request, res: Response) => {
  const { disk, name, ep, file } = req.params;
  await streamPath([disk, name, ep, file].join("/"), req, res);
});

app.get("/:disk/:cat/:name/:ep/:file", async (req: Request, res: Response) => {
  const { disk, cat, name, ep, file } = req.params;
  await streamPath([disk, cat, name, ep, file].join("/"), req, res);
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
