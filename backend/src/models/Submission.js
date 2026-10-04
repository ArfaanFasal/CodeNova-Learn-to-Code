import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problem: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingProblem', required: true },
  code: { type: String, required: true },
  language: { type: String, required: true },
  status: { type: String, enum: ['accepted', 'wrong_answer', 'error', 'timeout'], default: 'pending' },
  passedTests: { type: Number, default: 0 },
  totalTests: { type: Number, default: 0 },
  output: { type: String, default: '' },
  error: { type: String, default: '' },
  testResults: [{ passed: Boolean, input: String, expected: String, actual: String }],
}, { timestamps: true });

export default mongoose.model('Submission', submissionSchema);
