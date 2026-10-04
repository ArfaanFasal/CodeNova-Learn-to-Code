import mongoose from 'mongoose';

const levelSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Beginner, Intermediate, Expert
  slug: { type: String, required: true }, // beginner, intermediate, expert
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  order: { type: Number, required: true },
  modules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }],
  finalAssessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', default: null },
}, { timestamps: true });

export default mongoose.model('Level', levelSchema);
