import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Verificar si la API key existe
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        error: 'GOOGLE_API_KEY no encontrada en .env.local',
        status: 'error',
        details: 'Verifica que el archivo .env.local esté en la raíz del proyecto'
      });
    }

    // Verificar formato de la API key
    if (!apiKey.startsWith('AIza')) {
      return NextResponse.json({
        error: 'Formato de API key incorrecto',
        status: 'error',
        details: 'La API key debe empezar con "AIza"'
      });
    }

    return NextResponse.json({
      message: 'Configuración correcta',
      status: 'success',
      apiKeyLength: apiKey.length,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
      env: process.env.NODE_ENV
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Error en configuración',
      status: 'error',
      details: error.message
    });
  }
}