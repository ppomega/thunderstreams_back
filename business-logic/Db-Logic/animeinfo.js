const mongoose = require("mongoose");
const connString = process.env.CONNECTION_STRING;
const model = require("../../models/animeSeason");
async function AnimeInfoFetch(name) {
  const AnimeInfo = model(name);
  console.log(AnimeInfo);
  await mongoose
    .connect(connString, { useMongoClient: true })
    .then(() => {})
    .catch((e) => {
      console.log("Error Encountered");
    });
  const result = await AnimeInfo.find();
  delete mongoose.connection.models["AnimeInfo"];

  await mongoose.connection.close();
  return result;
}
module.exports = AnimeInfoFetch;
