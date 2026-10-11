import { Schema, model, Types } from 'mongoose';
interface Episode {
  episodeNumber: number;
  title: string;
  length: string;
  description: string;
  releaseDate: string;
}
const EpisodeSchema = new Schema<Episode>({
  episodeNumber: { type: Number, required: true },
  title: { type: String, required: true },
  length: { type: String, required: true },
  description: { type: String, required: true },
  releaseDate: { type: String, required: true }
});
export const Episode = model<Episode>('Episode', EpisodeSchema);
