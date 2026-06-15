import { NextRequest, NextResponse } from 'next/server';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const TMDB_LANG_MAP: Record<string, string> = {
  'English': 'en-US',
  'Hindi': 'hi-IN',
  'Tamil': 'ta-IN',
  'Telugu': 'te-IN',
  'Kannada': 'kn-IN',
  'Malayalam': 'ml-IN',
  'Marathi': 'mr-IN',
  'Bengali': 'bn-IN',
  'Spanish': 'es-ES',
  'French': 'fr-FR',
  'German': 'de-DE',
  'Portuguese': 'pt-BR',
  'Italian': 'it-IT',
  'Russian': 'ru-RU',
  'Japanese': 'ja-JP',
  'Korean': 'ko-KR',
  'Chinese': 'zh-CN',
  'Thai': 'th-TH',
  'Vietnamese': 'vi-VN',
  'Indonesian': 'id-ID'
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mediaId = searchParams.get('id');
    const type = searchParams.get('type') || 'movie';
    const lang = searchParams.get('lang') || 'English';

    if (!mediaId) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey || apiKey === 'your_tmdb_api_key_here') {
      return NextResponse.json({
        translated: false,
        title: '',
        overview: 'Translation not available (API key missing)',
      });
    }

    const tmdbLang = TMDB_LANG_MAP[lang] || 'en-US';
    
    // For anime, if the ID doesn't match TMDB directly, we can search TMDB by name or return original
    // But for movie/tv, we can directly fetch the translation
    const tmdbType = type === 'anime' ? 'tv' : type; 
    const url = `${TMDB_BASE_URL}/${tmdbType}/${mediaId}?api_key=${apiKey}&language=${tmdbLang}`;

    const res = await fetch(url, {
      next: { revalidate: 86400 }, // Cache translations for 24 hours
    });

    if (!res.ok) {
      return NextResponse.json({
        translated: false,
        title: '',
        overview: 'Translation not found for this language',
      });
    }

    const data = await res.json();
    
    return NextResponse.json({
      translated: true,
      title: data.title || data.name || '',
      overview: data.overview || '',
      genres: data.genres || [],
    });
  } catch (error) {
    console.error('Translation route error:', error);
    return NextResponse.json(
      { error: 'Internal translation error' },
      { status: 500 }
    );
  }
}
