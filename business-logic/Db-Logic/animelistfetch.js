const mongoose = require("mongoose");
const connString = process.env.CONNECTION_STRING;

const AnimeList = require("../../models/animeList");
async function AnimeFetch() {
  await mongoose
    .connect(connString)
    .then(() => {})
    .catch((e) => {
      console.log("Error");
    });
  const result = await AnimeList.find();
  await mongoose.connection.close();
  return result;
}
module.exports = AnimeFetch;
