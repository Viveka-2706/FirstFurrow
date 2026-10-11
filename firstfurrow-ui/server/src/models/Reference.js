import mongoose from 'mongoose';

const { Schema } = mongoose;
const opts = { versionKey: false };

// Soil types, with the districts where each is found (replaces the old soilRegionMap)
export const Soil = mongoose.models.Soil || mongoose.model('Soil', new Schema(
  { _id: String, order: Number, name: String, where: String, feel: String, regions: [String], ta: Schema.Types.Mixed },
  opts
));

// Districts, with the coordinates used for the live weather card
export const Region = mongoose.models.Region || mongoose.model('Region', new Schema(
  { _id: String, order: Number, name: String, lat: Number, lon: Number, ta: Schema.Types.Mixed },
  opts
));

// ---- Symptom checker rule base ----
export const SymptomGroup = mongoose.models.SymptomGroup || mongoose.model('SymptomGroup', new Schema(
  { _id: String, order: Number, en: String, ta: String, symptomIds: [String] },
  opts
));

export const Symptom = mongoose.models.Symptom || mongoose.model('Symptom', new Schema(
  { _id: String, order: Number, icon: String, en: String, ta: String, crops: [String] },
  opts
));

export const Problem = mongoose.models.Problem || mongoose.model('Problem', new Schema(
  {
    _id: String,
    icon: String,
    severity: { type: String, enum: ['high', 'medium', 'low'] },
    crops: [String],
    weights: Schema.Types.Mixed, // { symptomId: 1|2|3 }
    en: Schema.Types.Mixed, // { name, cause, fix[], prevent }
    ta: Schema.Types.Mixed,
  },
  opts
));
