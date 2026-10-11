import mongoose from "mongoose";
import {animeList} from "../../models/animeList.js";
const connString:string|undefined = process.env.CONNECTION_STRING;
async function AnimeFetch(): Promise<mongoose.Document[] | undefined> {
  if(connString != undefined){
  await mongoose.connect(connString);
  return await animeList.find()
    .then(async (result:any) => {
      return result;
    })
    .catch((e:any) => {
      console.log(e);
    });}
}
module.exports = AnimeFetch;
