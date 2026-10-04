import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true },
    level: { type: mongoose.Schema.Types.ObjectId, ref: 'Level', required: true },
    order: { type: Number, required: true },
    // 'theory' = conceptual content, 'practice' = coding-focused
    type: {
      type: String,
      enum: ['theory', 'practice'],
      default: 'theory',
    },
    content: { type: String, default: '' }, // HTML/markdown learning content
    videoUrl: { type: String, default: '' },
    // Quick standalone (theory only): question + sample input/output for code practice
    quickStandaloneQuestion: { type: String, default: '' },
    quickStandaloneInput: { type: String, default: '' },
    quickStandaloneOutput: { type: String, default: '' },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', default: null },
    codingProblems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CodingProblem' }],
  },
  { timestamps: true }
);

export default mongoose.model('Module', moduleSchema);
