const mongoose = require("mongoose");
const connString = process.env.CONNECTION_STRING;

const AnimeList = require("../../models/animeList");
async function AnimeFetch() {
  await mongoose.connect(connString);
  return await AnimeList.find()
    .then(async (r) => {
      return r;
    })
    .catch((e) => {
      console.log(e);
    });
}
module.exports = AnimeFetch;
