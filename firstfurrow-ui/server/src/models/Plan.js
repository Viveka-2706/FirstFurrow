import mongoose from 'mongoose';

const { Schema } = mongoose;

const journalEntry = new Schema(
  { id: { type: String, required: true }, text: { type: String, required: true, maxlength: 2000 }, date: { type: Date, required: true } },
  { _id: false }
);

const planSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    cropId: { type: String, required: true, index: true },
    land: { type: Number, required: true },
    soilId: { type: String, required: true },
    soilName: String,
    region: { type: String, required: true },
    season: { type: String, required: true },

    // A full copy of the crop as it was when the plan was made, so a plan in progress never
    // changes underneath the farmer if the crop data is edited later.
    crop: { type: Schema.Types.Mixed, required: true },

    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    stageStatus: { type: [Boolean], default: [] },
    actualCosts: { type: [Schema.Types.Mixed], default: [] }, // number | null per stage
    journal: { type: [journalEntry], default: [] },
    completed: { type: Boolean, default: false },
    profit: { type: Number, default: null },
  },
  // minimize:false → keep empty objects inside the crop snapshot instead of silently dropping them
  { timestamps: true, versionKey: false, minimize: false }
);

export const Plan = mongoose.models.Plan || mongoose.model('Plan', planSchema);
