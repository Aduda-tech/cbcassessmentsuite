import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Loader2, 
  Bot, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  MessageSquare, 
  FileText,
  Lightbulb
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { ClassConfig, StudentAnalysis } from '../types/cbc';
import { analyzeStudents, calculateSubjectSummaries, calculateOverallSummary } from '../utils/cbcCalculations';

interface AiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClass: ClassConfig;
}

export const AiAdvisorModal: React.FC<AiAdvisorModalProps> = ({
  isOpen,
  onClose,
  currentClass
}) => {
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [userPrompt, setUserPrompt] = useState('');

  if (!isOpen) return null;

  const analyzed = analyzeStudents(currentClass.students);
  const subSummaries = calculateSubjectSummaries(analyzed);
  const overallStats = calculateOverallSummary(analyzed);

  const generateAIInsights = async (customQuestion?: string) => {
    setLoading(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY || '';
      const ai = new GoogleGenAI({ apiKey });

      const contextData = {
        className: currentClass.className,
        examName: currentClass.examName,
        totalStudents: overallStats.totalStudents,
        meanTotalMarks: overallStats.meanTotalMarks,
        meanTotalPoints: overallStats.meanTotalPoints,
        boysMeanPoints: overallStats.boysMeanTotalPoints,
        girlsMeanPoints: overallStats.girlsMeanTotalPoints,
        subjectPerformance: subSummaries.map(s => ({
          subject: s.label,
          meanScore: s.meanScore,
          cbcGrade: s.cbcGrade,
          topStudent: s.bestPerformerName,
          topScore: s.highestScore
        })),
        bottomLearnersCount: analyzed.filter(s => s.tplGrade === 'BE1' || s.tplGrade === 'BE2').length,
        topLearnersCount: analyzed.filter(s => s.tplGrade === 'EE1' || s.tplGrade === 'EE2').length
      };

      const prompt = customQuestion 
        ? `You are an expert Kenyan Competency-Based Assessment (CBC) Curriculum & School Improvement Advisor.
Here is the examination performance summary for ${currentClass.className} (${currentClass.examName}):
${JSON.stringify(contextData, null, 2)}

User Question: ${customQuestion}

Provide clear, constructive, and actionable advice tailored to Kenyan Junior Secondary Schools (JSS). Use bullet points and professional pedagogical tone.`
        : `You are an expert Kenyan Competency-Based Assessment (CBC) Curriculum & School Improvement Advisor.
Analyze the following classroom assessment dataset for ${currentClass.className} (${currentClass.examName}):
${JSON.stringify(contextData, null, 2)}

Please provide a structured 4-part pedagogical analysis:
1. **Executive Summary**: Overview of overall class competency level, gender performance comparison, and general mastery of the curriculum.
2. **Critical Learning Area Analysis**: Highlight which subjects are performing best (Exceeding / Meeting expectations) and which require immediate remedial intervention (Approaching / Below expectations). Why might Mathematics or certain sciences lag, and how can teachers intervene?
3. **Targeted Remedial Strategies**: Step-by-step actionable recommendations for Head of Institution (HOI) and Class Teachers to support learners in the BE1 and BE2 brackets before the next term assessment.
4. **Sample Parent Communication Draft**: A concise, encouraging, yet honest template note that class teachers can send home to parents of underperforming learners.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setAnalysisResult(response.text || "No insights could be generated at this time.");
    } catch (err: any) {
      console.error("Gemini Error:", err);
      setAnalysisResult(`Error generating AI recommendations: ${err.message || "Please check if GEMINI_API_KEY is configured in AI Studio settings."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPrompt.trim()) return;
    generateAIInsights(userPrompt);
    setUserPrompt('');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg shadow-purple-500/20">
              <Sparkles className="w-6 h-6 text-white animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <h2 className="text-xl font-black bg-gradient-to-r from-purple-400 via-pink-300 to-amber-300 bg-clip-text text-transparent">
                Gemini AI School Performance & CBC Pedagogical Advisor
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Instant analytical diagnostic for {currentClass.className} ({analyzed.length} learners evaluated)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Action Triggers */}
        <div className="flex flex-wrap items-center gap-3 mb-6 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>Generate Quick Diagnostic:</span>
          </span>
          <button
            onClick={() => generateAIInsights()}
            disabled={loading}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-extrabold shadow transition flex items-center gap-1.5"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Full 4-Part Pedagogical Audit</span>
          </button>
          <button
            onClick={() => generateAIInsights("Focus strictly on Mathematics and Science remedial action plans for students scoring below 40 marks.")}
            disabled={loading}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            <span>STEM Remedial Strategy</span>
          </button>
          <button
            onClick={() => generateAIInsights("Write a motivating speech that the Head of Institution (HOI) can deliver during class assembly celebrating top performers while encouraging the rest.")}
            disabled={loading}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>HOI Assembly Speech</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin min-h-[250px] bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
              <div>
                <p className="text-base font-bold text-white">Analyzing CBC Competencies & Grade Vectors...</p>
                <p className="text-xs text-slate-400 mt-1">Evaluating subject means, gender gaps, and learning area distributions.</p>
              </div>
            </div>
          ) : analysisResult ? (
            <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-slate-200 space-y-3 whitespace-pre-wrap font-sans">
              {analysisResult}
            </div>
          ) : (
            <div className="text-center py-12 space-y-3">
              <Bot className="w-12 h-12 text-purple-400/50 mx-auto" />
              <h3 className="text-base font-bold text-slate-300">No AI Report Generated Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Click one of the diagnostic buttons above or type a custom inquiry below to get expert guidance from Gemini on your classroom results!
              </p>
            </div>
          )}
        </div>

        {/* Custom Question Input */}
        <form onSubmit={handleCustomSubmit} className="mt-5 pt-4 border-t border-slate-800 flex items-center gap-3">
          <input
            type="text"
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="Ask Gemini anything about this class (e.g., 'Why is Kiswahili outperforming English?' or 'Draft an intervention plan for student #5')..."
            className="flex-1 px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs sm:text-sm font-medium focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !userPrompt.trim()}
            className="px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 text-white rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/30 transition flex items-center gap-2"
          >
            <span>Ask</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
