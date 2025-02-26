const mongoose = require("mongoose");
const connString = process.env.CONNECTION_STRING;
const model = require("../../models/animeSeason");
async function AnimeInfoFetch(name) {
  const AnimeInfo = model(name);
  await mongoose
    .connect(connString)
    .then(() => {})
    .catch((e) => {
      console.log(e);
    });
  const result = await AnimeInfo.find();
  mongoose.deleteModel("AnimeInfo");
  // delete mongoose.connection.models["AnimeInfo"];

  await mongoose.connection.close();
  return result;
}
module.exports = AnimeInfoFetch;
