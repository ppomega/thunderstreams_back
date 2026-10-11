import { Schema, model, Types ,Model} from 'mongoose';
interface Animelist{
  name: string;
  seasons: number;
  genre: string[];
  description: string;
  rating: Types.Decimal128;
  thumbnail1: string;
  thumbnail2: string;
  currentSeason: number;
}
const list = new Schema<Animelist>(
  {
    name: String,
    seasons: Number,
    genre: [String],
    description: String,
    rating: Types.Decimal128,
    thumbnail1: String,
    thumbnail2: String,
    currentSeason: Number,
  },
  { collection: "animelist" }
);
export  const animeList: Model<Animelist> = model("Animelist", list);
