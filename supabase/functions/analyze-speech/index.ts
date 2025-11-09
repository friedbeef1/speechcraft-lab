import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation
const validateAnalysisInput = (data: any): { valid: boolean; error?: string } => {
  const { transcript, duration, fillerWordCount, prompt } = data;
  
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
  
  if (typeof prompt !== 'string' || prompt.trim().length < 10 || prompt.length > 500) {
    return { valid: false, error: 'Prompt must be between 10 and 500 characters' };
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
    // Extract user from JWT (verify_jwt = true ensures this exists)
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (!user || authError) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Set rate limit based on whether user is anonymous
    const identifier = user.id;
    const identifierType = 'user';
    const isAnonymous = user.is_anonymous ?? false;
    const limit = isAnonymous ? 9 : 20; // 9 for guests, 20 for authenticated users
    
    console.log(`${isAnonymous ? 'Anonymous' : 'Authenticated'} user:`, user.id);

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

    const { transcript, duration, fillerWordCount, prompt } = body;

    console.log('Analyzing speech:', { 
      identifier,
      identifierType,
      transcriptLength: transcript.length, 
      duration, 
      fillerWordCount,
      prompt: prompt.substring(0, 50) + '...'
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

PRACTICE SCENARIO: "${prompt}"

The user was practicing responding to this specific situation. Analyze their speech in the context of this scenario and provide specific, actionable feedback in two categories:

1. Speech Technique: How well did their pace, tone, energy, and pauses support handling this type of conversation? Consider what delivery style works best for this scenario.

2. Content Quality: How effectively did they address the specific scenario? Did they cover key points relevant to this situation? Was their message structure appropriate for this context?

CRITICAL: You MUST respond with ONLY a JSON object, nothing else. No markdown, no explanations, no code blocks. Just the raw JSON.

Required JSON structure:
{
  "delivery": ["point 1", "point 2", "point 3"],
  "content": ["point 1", "point 2", "point 3"]
}

Keep each point concise (1-2 sentences) and constructive. Reference the specific scenario and actual speech content.`
          },
          {
            role: 'user',
            content: `Practice Scenario: "${prompt}"

Speech transcript: "${transcript}"
Duration: ${duration} seconds
Word count: ${wordCount}
Speech rate: ${speechRate} words/minute
Filler words: ${fillerWordCount}

Please analyze how well this speech addressed the practice scenario.`
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
    
    let aiResponse = data.choices[0].message.content;
    console.log('Raw AI response:', aiResponse.substring(0, 200));
    
    // Try to parse JSON, with smart extraction if needed
    let feedback;
    try {
      // First try direct parsing
      feedback = JSON.parse(aiResponse);
    } catch (e) {
      try {
        // Try to extract JSON from markdown code blocks or surrounding text
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          feedback = JSON.parse(jsonMatch[0]);
          console.log('Successfully extracted JSON from response');
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (e2) {
        console.error('Failed to parse AI response:', e2);
        console.error('Response was:', aiResponse);
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