import React, { useState } from 'react';
import * as m from 'motion/react';
const { motion, AnimatePresence } = m;
import { useLanguage } from '../contexts/LanguageContext';
import { Thermometer, Send, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TextArea } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

interface SymptomResponse {
  possible_causes: string[];
  urgency_level: string;
  recommendation: string;
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const Symptoms: React.FC = () => {
  const { t, language } = useLanguage();
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<SymptomResponse | null>(null);
  const [error, setError] = useState('');

  const getUrgencyStyle = (level: string) => {
    const lower = level.toLowerCase();
    if (
      lower.includes('high') || lower.includes('emergency') ||
      lower.includes('alta') || lower.includes('emergência') ||
      lower.includes('emergencia')
    ) {
      return 'error';
    }
    if (lower.includes('medium') || lower.includes('média') || lower.includes('media')) {
      return 'secondary';
    }
    return 'primary';
  };

  const handleGuidance = async () => {
    if (!symptoms.trim()) return;
    setLoading(true);
    setError('');
    setResponse(null);

    const langMap: Record<string, string> = {
      pt: 'Portuguese',
      en: 'English',
      es: 'Spanish',
    };

    const prompt = `You are a veterinary assistant AI. A pet owner describes the following symptoms: "${symptoms}".

Provide a preliminary guidance following these strict rules:
1. NEVER give a definitive diagnosis or suggest grave terminal diseases for mild symptoms.
2. ALWAYS consider common daily causes first (e.g., food change, hot weather, minor stress, new environment, recent vaccination).
3. Use cautious and realistic language like "May be related to something simple like..." or "Could be a temporary reaction to...".
4. List possible causes (3-5 items maximum), prioritizing common ones.
5. Determine urgency level: Low, Medium, High, or Emergency.
6. Provide clear, actionable, and non-alarmist recommendations.
7. Respond ENTIRELY in ${langMap[language as string] || 'English'}.
8. Return ONLY a valid JSON object with these keys:
   - possible_causes: string array
   - urgency_level: string (one of: Low, Medium, High, Emergency)
   - recommendation: string

Return only the JSON. No explanation, no markdown, no backticks.`;

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) throw new Error('VITE_GROQ_API_KEY not configured');

      const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
          max_tokens: 600,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Groq API error ${res.status}: ${errBody}`);
      }

      const data = await res.json();
      const text: string = data.choices?.[0]?.message?.content || '';
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error('Invalid JSON response from AI');
      const parsed: SymptomResponse = JSON.parse(text.substring(start, end + 1));
      setResponse(parsed);
    } catch (err) {
      console.error('AI Error:', err);
      setError('Erro ao obter orientação. Verifique a chave VITE_GROQ_API_KEY e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-24">
      <header className="mb-12 px-2">
        <h1 className="editorial-header">{t('symptom_guidance')}</h1>
        <p className="text-on-surface-variant mt-2 font-medium opacity-60 uppercase tracking-widest text-xs">{t('symptoms_description')}</p>
      </header>

      <div className="space-y-12 px-2">
        <Card className="p-8 rounded-[3rem] border-none bg-surface-container-low/30 shadow-none">
          <TextArea
            value={symptoms}
            onChange={e => setSymptoms(e.target.value)}
            placeholder={t('symptoms_placeholder')}
            className="min-h-[200px] text-lg font-medium p-8 rounded-[2rem] bg-surface-container-lowest"
          />
          <Button
            onClick={handleGuidance}
            isLoading={loading}
            disabled={!symptoms.trim()}
            className="w-full mt-8 py-6 rounded-3xl text-xl font-black shadow-2xl shadow-primary/20"
          >
            <Send className="w-6 h-6 mr-2" />
            {t('symptom_guidance')}
          </Button>
          {error && (
            <p className="mt-6 text-sm text-error font-bold text-center bg-error/10 py-3 rounded-xl">{error}</p>
          )}
        </Card>

        {response && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="p-10 rounded-[3rem] bg-surface-container-lowest shadow-2xl border-none space-y-10">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-primary/10 rounded-2xl text-primary mb-6">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-4">
                  {t('urgency_level')}
                </h3>
                <Badge variant={getUrgencyStyle(response.urgency_level)} className="px-8 py-3 text-lg font-black rounded-2xl shadow-lg">
                  {response.urgency_level}
                </Badge>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">
                  {t('possible_causes')}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {(response.possible_causes || []).map((cause, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-surface-container-low/50 rounded-2xl border border-surface-container-high/20">
                      <div className="w-3 h-3 rounded-full bg-primary shrink-0" />
                      <span className="font-bold text-on-surface">{cause}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10">
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">
                  {t('recommendation')}
                </h3>
                <p className="text-xl font-medium text-on-surface leading-normal">
                  {response.recommendation}
                </p>
              </div>
            </Card>
          </motion.div>
        )}

        <Card className="p-8 bg-surface-container-low/50 rounded-[2.5rem] flex gap-6 border-none shadow-none">
          <div className="p-4 bg-surface-container-lowest rounded-2xl text-primary shrink-0 h-fit shadow-sm">
            <Info className="w-8 h-8" />
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed font-medium opacity-60 italic">
            {t('ai_guidance_warning')}
          </p>
        </Card>
      </div>
    </div>
  );
};
