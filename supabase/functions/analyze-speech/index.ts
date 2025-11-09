import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, duration, fillerWordCount } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing speech:', { 
      transcriptLength: transcript.length, 
      duration, 
      fillerWordCount 
    });

    // Calculate basic metrics
    const words = transcript.trim().split(/\s+/);
    const wordCount = words.length;
    const speechRate = Math.round((wordCount / duration) * 60); // words per minute
    
    // Fluency score calculation (0-100)
    const fillerWordRatio = fillerWordCount / wordCount;
    const fluencyScore = Math.max(0, Math.min(100, 
      100 - (fillerWordRatio * 50) - (Math.abs(speechRate - 150) * 0.2)
    ));

    // Request AI analysis using Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a professional speech coach providing constructive feedback. 
Analyze the transcript and provide specific, actionable feedback in two categories:
1. Delivery Feedback: pace, tone, energy, pauses
2. Content Feedback: clarity, structure, engagement, key points

Format your response as JSON with this structure:
{
  "delivery": ["point 1", "point 2", "point 3"],
  "content": ["point 1", "point 2", "point 3"]
}

Keep each point concise (1-2 sentences) and constructive.`
          },
          {
            role: 'user',
            content: `Speech transcript: "${transcript}"
Duration: ${duration} seconds
Word count: ${wordCount}
Speech rate: ${speechRate} words/minute
Filler words: ${fillerWordCount}

Please analyze this speech and provide feedback.`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add funds to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received:', data);
    
    const aiResponse = data.choices[0].message.content;
    
    // Try to parse JSON, fallback to default structure
    let feedback;
    try {
      feedback = JSON.parse(aiResponse);
    } catch (e) {
      console.warn('Failed to parse AI response as JSON, using defaults');
      feedback = {
        delivery: [
          'Practice maintaining a steady pace throughout your speech',
          'Consider varying your tone to emphasize key points',
          'Work on reducing hesitation and building confidence'
        ],
        content: [
          'Your main points could be more clearly structured',
          'Consider adding specific examples to support your ideas',
          'Try to maintain focus on your central message'
        ]
      };
    }

    return new Response(
      JSON.stringify({
        metrics: {
          fluencyScore: Math.round(fluencyScore),
          wordCount,
          speechRate,
          fillerWordCount
        },
        feedback
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-speech function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
