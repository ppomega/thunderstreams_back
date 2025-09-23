const express = require("express");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
var cors = require("cors");
const { spawn } = require("child_process");
require("dotenv").config(); // Load .env variables
const fetch = require("./business-logic/Stream-Logic/fetch");
const AnimeFetch = require("./business-logic/Db-Logic/animelistfetch");
const AnimeInfoFetch = require("./business-logic/Db-Logic/animeinfo");
const app = express();
const PORT = process.env.PORT;
app.use(cors());

function streamToExoPlayer(inputStream, res) {
  const ffmpeg = spawn(ffmpegPath, [
    "-i",
    "pipe:0",
    "-c:v",
    "libx264",
    "-profile:v",
    "main",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-f",
    "mp4",
    "-movflags",
    "frag_keyframe+empty_moov+default_base_moof",
    "pipe:1",
  ]);

  // Pipe your input stream into FFmpeg stdin
  inputStream.pipe(ffmpeg.stdin);

  // Pipe FFmpeg stdout to HTTP response
  res.setHeader("Content-Type", "video/mp4");
  ffmpeg.stdout.pipe(res);

  ffmpeg.stderr.on("data", (data) => {
    console.error(`FFmpeg stderr: ${data}`);
  });

  ffmpeg.on("close", (code) => {
    console.log(`FFmpeg exited with code ${code}`);
  });
}
app.listen(PORT, () => {
  console.log(`Server is running  http://localhost:${PORT}`);
});

app.get("/", (req, res) => {
  res.send("hello");
});

app.get("/animeInfo", async (req, res) => {
  const name = req.query;
  console.log(name.name);
  const data = await AnimeInfoFetch(name.name);
  res.send(data);
});

app.get("/assets", async (req, res) => {
  res.json(await AnimeFetch());
});

app.get("/:disk/:name/:ep/:file", async (req, res) => {
  try {
    console.log(req.params);
    const path =
      req.params.disk +
      "/" +
      req.params.name +
      "/" +
      req.params.ep +
      "/" +
      req.params.file;
    console.log(path);
    const chunk = await fetch(path);
    if (req.params.file.endsWith(".mpd")) {
      chunk.data.pipe(res);
      return;
    }
    streamToExoPlayer(chunk.data, res);
  } catch (e) {}
});

app.get("/:disk/:cat/:name/:ep/:file", async (req, res) => {
  try {
    const path =
      req.params.disk +
      "/" +
      req.params.cat +
      "/" +
      req.params.name +
      "/" +
      req.params.ep +
      "/" +
      req.params.file;
    const chunk = await fetch(path);
    if (req.params.file.endsWith(".mpd")) {
      chunk.data.pipe(res);
      return;
    }
    streamToExoPlayer(chunk.data, res);
  } catch (e) {}
});

app.get("/file", async (req, res) => {
  try {
    console.log(req.query.name);
    const file = await fetch(req.query.name);
    file.data.pipe(res);
  } catch (e) {}
});
