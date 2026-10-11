const mongoose = require("mongoose");
const list = new mongoose.Schema(
  {
    name: String,
    seasons: Number,
    genre: [String],
    description: String,
    rating: mongoose.Types.Decimal128,
    thumbnail1: String,
    thumbnail2: String,
    currentSeason: Number,
  },
  { collection: "animelist" }
);
const animelist = mongoose.model("Animelist", list);
module.exports = animelist;
