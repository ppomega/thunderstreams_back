const mongoose = require("mongoose");
const Episode = require("../models/episode");
function createModel(name) {
  const list = new mongoose.Schema(
    {
      seasonNumber: Number,
      episodes: [Episode],
    },
    { collection: name }
  );
  return mongoose.model("AnimeInfo", list);
}

module.exports = createModel;
