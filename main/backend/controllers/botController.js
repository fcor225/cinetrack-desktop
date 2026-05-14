const { GoogleGenerativeAI } = require('@google/generative-ai');
const Pelicula = require('../models/Pelicula');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

/**
 * @module controllers/botController
 * @description Controlador para el CineBot impulsado por Gemini AI.
 * Inyecta el contexto del usuario (sus películas vistas) en el system prompt.
 */

exports.chat = catchAsync(async (req, res, next) => {
    const { message } = req.body;
    
    if (!message) {
        return next(new AppError('El mensaje es obligatorio', 400));
    }

    if (!process.env.GEMINI_API_KEY) {
        return res.status(200).json({
            success: true,
            reply: '⚠️ Hola! Soy CineBot. Para que pueda ayudarte a encontrar películas, el administrador necesita configurar la clave `GEMINI_API_KEY` en el archivo .env del servidor.'
        });
    }

    // 1. Obtener contexto: Películas vistas y favoritas del usuario
    // Limitamos a las últimas 30 para no saturar el prompt de Gemini
    const peliculas = await Pelicula.findAll({
        where: {
            usuario_id: req.user.id
        },
        attributes: ['titulo', 'estado'],
        order: [['id_local', 'DESC']],
        limit: 100 // Tomamos un lote razonable
    });

    const vistas = peliculas
        .filter(p => p.estado === 'VISTA')
        .map(p => p.titulo)
        .slice(0, 30);
        
    const favoritas = peliculas
        .filter(p => p.estado === 'FAVORITA')
        .map(p => p.titulo)
        .slice(0, 30);

    // 2. Construir el prompt de sistema
    const systemInstruction = `
    Eres "CineBot", un asistente virtual cinéfilo carismático, ingenioso y experto en el séptimo arte, integrado en la app CineTrack Desktop.
    
    Contexto del usuario:
    - Películas favoritas: ${favoritas.length > 0 ? favoritas.join(', ') : 'Ninguna registrada aún.'}
    - Películas que ya ha visto: ${vistas.length > 0 ? vistas.join(', ') : 'Ninguna registrada aún.'}
    
    Reglas:
    1. Si te pide recomendaciones, guíate por sus películas favoritas y vistas. NO le recomiendes películas que ya haya visto.
    2. Responde siempre en formato Markdown, usando negritas para títulos de películas.
    3. Tus respuestas deben ser breves, directas y con tono amigable.
    4. Usa algunos emojis relacionados con el cine.
    `;

    try {
        // Inicializar Gemini
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        // Combinar instrucciones con el mensaje del usuario para mayor compatibilidad
        const fullPrompt = `${systemInstruction}\n\nUsuario dice: ${message}`;

        const result = await model.generateContent(fullPrompt);
        const responseText = result.response.text();

        res.status(200).json({
            success: true,
            reply: responseText
        });
    } catch (error) {
        console.error("🔴 Error en CineBot (Gemini):", error);
        // Log more specific error info if available
        if (error.response) {
            console.error("Response Data:", error.response.data);
        }
        return next(new AppError('Error al contactar con la Inteligencia Artificial.', 500));
    }
});
