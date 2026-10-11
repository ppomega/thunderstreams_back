import mongoose from "mongoose";
import createModel from "../../models/AnimeSeason.js";

const connString:string|undefined = process.env.CONNECTION_STRING;

async function AnimeInfoFetch(name:string): Promise<mongoose.Document[] | undefined> {
  const AnimeInfo = createModel(name);
  if(connString != undefined){  await mongoose.connect(connString);
  
  return await AnimeInfo.find().then(async (result) => {
    mongoose.deleteModel("AnimeInfo");
    return result;
  });
}
}
module.exports = AnimeInfoFetch;
