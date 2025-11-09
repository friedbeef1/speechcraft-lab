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
    const { audio } = await req.json();
    const ASSEMBLYAI_API_KEY = Deno.env.get('ASSEMBLYAI_API_KEY');
    
    if (!ASSEMBLYAI_API_KEY) {
      throw new Error('ASSEMBLYAI_API_KEY is not configured');
    }

    console.log('Starting transcription process...');

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
