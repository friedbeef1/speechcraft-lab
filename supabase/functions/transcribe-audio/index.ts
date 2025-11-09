import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation
const validateAudioInput = (audio: unknown): { valid: boolean; error?: string } => {
  if (typeof audio !== 'string') {
    return { valid: false, error: 'Audio must be a base64 string' };
  }
  
  // Check base64 format
  if (!/^[A-Za-z0-9+/=]+$/.test(audio)) {
    return { valid: false, error: 'Invalid base64 format' };
  }
  
  // Check size limit: 10MB base64 = ~7.5MB audio (5-7 minutes)
  if (audio.length > 10485760) {
    return { valid: false, error: 'Audio too large. Maximum 7.5MB (approximately 5-7 minutes)' };
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

  const ASSEMBLYAI_API_KEY = Deno.env.get('ASSEMBLYAI_API_KEY');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!ASSEMBLYAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
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
    const rateLimitResult = await checkRateLimit(supabase, identifier, identifierType, 'transcribe-audio', limit);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: rateLimitResult.error }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const body = await req.json();
    const { audio } = body;
    
    const validation = validateAudioInput(audio);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting transcription:', {
      identifier,
      identifierType,
      audioSize: audio.length,
    });

    // Step 1: Upload audio to AssemblyAI
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'authorization': ASSEMBLYAI_API_KEY,
        'content-type': 'application/octet-stream',
      },
      body: Uint8Array.from(atob(audio), c => c.charCodeAt(0)),
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload error:', errorText);
      throw new Error(`Failed to upload audio: ${uploadResponse.status}`);
    }

    const { upload_url } = await uploadResponse.json();
    console.log('Audio uploaded successfully');

    // Step 2: Request transcription with word-level timestamps
    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'authorization': ASSEMBLYAI_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: upload_url,
        word_boost: ['um', 'uh', 'like', 'you know', 'so', 'actually', 'basically'],
      }),
    });

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text();
      console.error('Transcription request error:', errorText);
      throw new Error(`Failed to request transcription: ${transcriptResponse.status}`);
    }

    const { id: transcriptId } = await transcriptResponse.json();
    console.log('Transcription requested, ID:', transcriptId);

    // Step 3: Poll for transcription completion
    let transcript;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const statusResponse = await fetch(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        {
          headers: {
            'authorization': ASSEMBLYAI_API_KEY,
          },
        }
      );

      if (!statusResponse.ok) {
        throw new Error(`Failed to check status: ${statusResponse.status}`);
      }

      transcript = await statusResponse.json();
      console.log('Transcription status:', transcript.status);

      if (transcript.status === 'completed') {
        break;
      } else if (transcript.status === 'error') {
        throw new Error(`Transcription failed: ${transcript.error}`);
      }

      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error('Transcription timeout');
    }

    // Count filler words from the transcript
    const fillerWords = ['um', 'uh', 'like', 'you know', 'so', 'actually', 'basically'];
    const transcriptText = transcript.text.toLowerCase();
    let fillerWordCount = 0;

    fillerWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = transcriptText.match(regex);
      fillerWordCount += matches ? matches.length : 0;
    });

    console.log('Transcription complete:', {
      identifier,
      identifierType,
      wordCount: transcript.words?.length || 0,
      fillerWordCount,
      duration: transcript.audio_duration
    });

    return new Response(
      JSON.stringify({
        transcript: transcript.text,
        fillerWordCount,
        wordCount: transcript.words?.length || 0,
        duration: transcript.audio_duration,
        confidence: transcript.confidence,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in transcribe-audio function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Transcription failed. Please check your audio and try again.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});