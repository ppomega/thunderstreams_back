import { Schema, model, Types ,Model} from 'mongoose';
import { EpisodeSchema, type Episode } from "./Episode.js";
interface  AnimeInfo{
seasonNumber: number;
episodes: Types.DocumentArray<Episode>;
}
function createModel(name:string): Model<AnimeInfo> {
  const list = new Schema<AnimeInfo>(
    {
      seasonNumber: Number,
      episodes: [EpisodeSchema],
    },
    { collection: name }
  );
  return model("AnimeInfo", list);
}

export default createModel;
