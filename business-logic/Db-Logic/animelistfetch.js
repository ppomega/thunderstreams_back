const mongoose = require("mongoose");
const connString = process.env.CONNECTION_STRING;

const AnimeList = require("../../models/animeList");
async function AnimeFetch() {
  await mongoose.connect(connString);
  await AnimeList.find().then(async (r) => {
    await mongoose.connection.close();
    return r;
  });
  return result;
}
module.exports = AnimeFetch;
