const Pelicula = require('../models/Pelicula');
const Resena = require('../models/Resena');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

/**
 * @module controllers/backupController
 * @description Controlador de copia de seguridad (Export / Import) de CineTrack.
 *
 * Endpoints:
 *   GET  /api/backup/export  — Exporta todas las películas y reseñas del usuario como JSON
 *   POST /api/backup/import  — Importa (restaura) un fichero JSON de backup
 */

/**
 * Exporta la colección completa del usuario (películas + reseñas) como JSON.
 * El frontend recibe la respuesta y la fuerza como descarga de archivo.
 *
 * @route GET /api/backup/export
 * @access Autenticado
 */
exports.exportar = catchAsync(async (req, res) => {
    const userId = req.user.id;

    // Cargamos todas las películas del usuario junto con sus reseñas
    const peliculas = await Pelicula.findAll({
        where: { usuario_id: userId },
        include: [{ model: Resena, as: 'resenas' }],
        order: [['id_local', 'ASC']]
    });

    const payload = {
        version: '1.0',
        exportadoEn: new Date().toISOString(),
        usuario: req.user.nombre || req.user.email,
        totalPeliculas: peliculas.length,
        peliculas: peliculas.map(p => ({
            tmdb_id: p.tmdb_id,
            titulo: p.titulo,
            titulo_original: p.titulo_original,
            poster_path: p.poster_path,
            backdrop_path: p.backdrop_path,
            sinopsis: p.sinopsis,
            anio: p.anio,
            estado: p.estado,
            valoracion_tmdb: p.valoracion_tmdb,
            fecha_estreno: p.fecha_estreno,
            duracion: p.duracion,
            generos: p.generos,
            resenas: (p.resenas || []).map(r => ({
                texto: r.texto,
                estrellas: r.estrellas,
                contiene_spoilers: r.contiene_spoilers,
                fecha_creacion: r.fecha_creacion
            }))
        }))
    };

    // Indicamos al cliente que descargue el archivo
    const filename = `cinetrack_backup_${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).json(payload);
});

/**
 * Importa (restaura) una copia de seguridad JSON en la BD del usuario.
 * Usa upsert por tmdb_id para no duplicar películas ya existentes.
 *
 * @route POST /api/backup/import
 * @body { peliculas: Array } — Contenido del archivo JSON exportado
 * @access Autenticado
 */
exports.importar = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const { peliculas } = req.body;

    if (!Array.isArray(peliculas) || peliculas.length === 0) {
        return next(new AppError('El archivo de backup no es válido o está vacío.', 400, 'INVALID_BACKUP'));
    }

    let importadas = 0;
    let actualizadas = 0;
    let errores = 0;

    for (const item of peliculas) {
        try {
            if (!item.tmdb_id || !item.titulo) continue;

            // Upsert: actualizar si ya existe, insertar si no
            const [pelicula, created] = await Pelicula.findOrCreate({
                where: { tmdb_id: item.tmdb_id, usuario_id: userId },
                defaults: {
                    ...item,
                    usuario_id: userId,
                    resenas: undefined // excluimos las reseñas del objeto principal
                }
            });

            if (!created) {
                // Actualizar campos del backup en la película existente
                await pelicula.update({
                    titulo: item.titulo,
                    titulo_original: item.titulo_original,
                    poster_path: item.poster_path,
                    backdrop_path: item.backdrop_path,
                    sinopsis: item.sinopsis,
                    anio: item.anio,
                    estado: item.estado,
                    valoracion_tmdb: item.valoracion_tmdb,
                    fecha_estreno: item.fecha_estreno,
                    duracion: item.duracion,
                    generos: item.generos
                });
                actualizadas++;
            } else {
                importadas++;
            }

            // Restaurar reseñas si existen en el backup
            if (Array.isArray(item.resenas) && item.resenas.length > 0) {
                for (const resena of item.resenas) {
                    await Resena.findOrCreate({
                        where: {
                            pelicula_id: pelicula.id_local,
                            autor_id: userId,
                            texto: resena.texto
                        },
                        defaults: {
                            pelicula_id: pelicula.id_local,
                            autor_id: userId,
                            texto: resena.texto,
                            estrellas: resena.estrellas || 0,
                            contiene_spoilers: resena.contiene_spoilers || false
                        }
                    });
                }
            }
        } catch (err) {
            console.error(`[Backup Import] Error procesando película ${item.titulo}:`, err.message);
            errores++;
        }
    }

    res.status(200).json({
        success: true,
        message: `Backup importado: ${importadas} nuevas, ${actualizadas} actualizadas, ${errores} errores.`,
        data: { importadas, actualizadas, errores }
    });
});
