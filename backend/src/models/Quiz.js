import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true },
  marks: { type: Number, default: 1 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['placement', 'module', 'final'], required: true },
  level: { type: mongoose.Schema.Types.ObjectId, ref: 'Level', default: null },
  module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', default: null },
  questions: [questionSchema],
  passingScore: { type: Number, default: 60 },
}, { timestamps: true });

export default mongoose.model('Quiz', quizSchema);
