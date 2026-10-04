import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema({
  input: { type: String, default: '' },
  expectedOutput: { type: String, default: '' },
  isSample: { type: Boolean, default: false },
});

const codingProblemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
    constraints: { type: String, default: '' },
    starterCode: { type: String, default: '' },
    testCases: [testCaseSchema],
    // category distinguishes regular practice problems from final-assessment practical tasks
    category: {
      type: String,
      enum: ['practice', 'final_practical'],
      default: 'practice',
    },
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', default: null },
    level: { type: mongoose.Schema.Types.ObjectId, ref: 'Level', default: null },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('CodingProblem', codingProblemSchema);
