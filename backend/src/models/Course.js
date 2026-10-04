import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true }, // python, java, cpp, javascript
  description: { type: String, default: '' },
  // Optional metadata for course landing pages
  provider: { type: String, default: '' },
  badge: { type: String, default: '' },
  rating: { type: Number, default: null },
  reviewsCount: { type: Number, default: null },
  enrollmentCount: { type: Number, default: null },
  estimatedHours: { type: Number, default: null },
  scheduleNote: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  levels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Level' }],
}, { timestamps: true });

export default mongoose.model('Course', courseSchema);
