import mongoose from 'mongoose';

const { Schema } = mongoose;

// Fields that drive matching are typed and indexed; the large nested text blocks
// (guide stages, water advice, Tamil copy) are Mixed — they are only ever read whole.
const cropSchema = new Schema(
  {
    _id: { type: String, required: true }, // slug: "okra", "green_chilli" …
    datasetId: String,
    name: { type: String, required: true },
    localName: { type: String, required: true },
    category: String,
    tagline: String,
    blurb: String,
    color: String,

    investment: { type: Number, required: true }, // per-acre midpoint (₹), or per setup when perUnit
    investmentRange: { min: Number, max: Number },
    returnMin: Number,
    returnMax: Number,
    durationDays: Number,
    risk: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
    waterNeed: { type: String, enum: ['low', 'medium', 'high'] },
    landRange: { min: Number, max: Number },
    perUnit: { type: Boolean, default: false },

    suitableSoils: { type: [String], index: true },
    seasons: { type: [String], index: true },

    water: Schema.Types.Mixed,
    guide: [Schema.Types.Mixed],
    guideLevel: { type: String, enum: ['full', 'basic'] },
    ta: Schema.Types.Mixed, // Tamil overlay: name, localName, tagline, blurb, water, guide[]
  },
  { versionKey: false, minimize: false }
);

// API output uses `id`, which is what the React app expects
cropSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export const Crop = mongoose.models.Crop || mongoose.model('Crop', cropSchema);
