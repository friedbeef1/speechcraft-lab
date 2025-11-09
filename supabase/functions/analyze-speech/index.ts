import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation
const validateAnalysisInput = (data: any): { valid: boolean; error?: string } => {
  const { transcript, duration, fillerWordCount } = data;
  
  if (typeof transcript !== 'string') {
    return { valid: false, error: 'Transcript must be a string' };
  }
  
  if (transcript.trim().length === 0) {
    return { valid: false, error: 'Transcript cannot be empty' };
  }
  
  if (transcript.length > 10000) {
    return { valid: false, error: 'Transcript too long. Maximum 10,000 characters.' };
  }
  
  if (typeof duration !== 'number' || duration <= 0 || duration > 600) {
    return { valid: false, error: 'Duration must be between 1 and 600 seconds (10 minutes)' };
  }
  
  if (typeof fillerWordCount !== 'number' || fillerWordCount < 0 || fillerWordCount > 1000) {
    return { valid: false, error: 'Filler word count must be between 0 and 1000' };
  }
  
  return { valid: true };
};

// Rate limiting check for both authenticated users and guests
const checkRateLimit = async (
  supabase: any,
  identifier: string,
  identifierType: 'user' | 'ip',
  endpoint: string,
  limit: number
): Promise<{ allowed: boolean; error?: string }> => {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  // Count requests in the last hour
  const { data, error } = await supabase
    .from('rate_limits')
    .select('id', { count: 'exact' })
    .eq('identifier', identifier)
    .eq('identifier_type', identifierType)
    .eq('endpoint', endpoint)
    .gte('requested_at', hourAgo);
  
  if (error) {
    console.error('Rate limit check error:', error);
    return { allowed: false, error: 'Rate limit check failed' };
  }
  
  const requestCount = data?.length || 0;
  
  if (requestCount >= limit) {
    console.warn('Rate limit exceeded', { identifier, identifierType, endpoint, requestCount });
    return {
      allowed: false,
      error: `Rate limit exceeded. You can make ${limit} requests per hour.`
    };
  }
  
  // Log this request
  const { error: insertError } = await supabase.from('rate_limits').insert({
    identifier,
    identifier_type: identifierType,
    endpoint,
  });

  if (insertError) {
    console.error('Rate limit insert error:', insertError);
    return { allowed: false, error: 'Rate limit tracking failed' };
  }
  
  return { allowed: true };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Support both authenticated and guest access
    let identifier: string;
    let identifierType: 'user' | 'ip';
    let limit: number;
    
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const jwt = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
      
      if (user) {
        // Authenticated user
        identifier = user.id;
        identifierType = 'user';
        limit = 20; // 20 requests per hour for authenticated users
        console.log('Authenticated user:', user.id);
      } else {
        // Guest access via IP
        identifier = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        identifierType = 'ip';
        limit = 9; // 9 requests per hour for guests
        console.log('Guest access via IP:', identifier);
      }
    } else {
      // Guest access via IP
      identifier = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      identifierType = 'ip';
      limit = 9; // 9 requests per hour for guests
      console.log('Guest access via IP:', identifier);
    }

    // Check rate limit
    const rateLimitResult = await checkRateLimit(supabase, identifier, identifierType, 'analyze-speech', limit);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: rateLimitResult.error }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const body = await req.json();
    const validation = validateAnalysisInput(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { transcript, duration, fillerWordCount } = body;

    console.log('Analyzing speech:', { 
      identifier,
      identifierType,
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
    console.log('AI response received');
    
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