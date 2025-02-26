const mongoose = require("mongoose");
const connString = process.env.CONNECTION_STRING;
const model = require("../../models/animeSeason");
async function AnimeInfoFetch(name) {
  const AnimeInfo = model(name);
  await mongoose.connect(connString);
  const result = await AnimeInfo.find().then(async (r) => {
    mongoose.deleteModel("AnimeInfo");
    await mongoose.connection.close();
    return r;
  });
  // delete mongoose.connection.models["AnimeInfo"];

  return result;
}
module.exports = AnimeInfoFetch;
