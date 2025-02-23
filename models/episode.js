const mongoose = require("mongoose");
const Episode = new mongoose.Schema({
  episodeNumber: Number,
  title: String,
  length: String,
  description: String,
  releaseDate: String,
});
module.exports = Episode;
