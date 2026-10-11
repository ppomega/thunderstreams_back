import { Schema, model, Types ,Model} from 'mongoose';
import {Episode} from "./Episode.js";
interface  AnimeInfo{
seasonNumber: number;
episodes: Types.DocumentArray<typeof Episode>;
}
function createModel(name:string): Model<AnimeInfo> {
  const list = new Schema<AnimeInfo>(
    {
      seasonNumber: Number,
      episodes: [Episode],
    },
    { collection: name }
  );
  return model("AnimeInfo", list);
}

export default createModel;
