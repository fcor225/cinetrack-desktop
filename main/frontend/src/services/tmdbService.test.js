/**
 * @file tmdbService.test.js
 * @description Tests unitarios para la capa de servicio tmdbService.
 *
 * Estrategia de mock:
 *   - Se mockea el módulo './apiClient' completo con jest.mock().
 *   - Cada test configura el retorno de apiClient.get mediante mockResolvedValue.
 *   - Esto evita cualquier llamada HTTP real a la red y aísla completamente
 *     la lógica del servicio.
 *
 * Tests incluidos:
 *   - search()         → construye la URL con query y page encodificados
 *   - getTrending()    → usa el time window correcto; usa caché en segunda llamada
 *   - getMovieDetails()→ llama al endpoint correcto con tmdbId
 *   - getPopular()     → pasa el número de página en los params
 *   - getDashboardMovies() → hace las 3 peticiones en paralelo y estructura el resultado
 */
import tmdbService from '../services/tmdbService';
import apiClient from '../services/apiClient';

// Mock completo del módulo apiClient para evitar llamadas HTTP reales
jest.mock('../services/apiClient');

// Respuesta base reutilizable en varios tests
const mockMovieList = [
    { id: 1, title: 'Avengers: Endgame' },
    { id: 2, title: 'Inception' }
];

describe('tmdbService', () => {
    // Limpiar todos los mocks y el estado de la caché antes de cada test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ── search ───────────────────────────────────────────────────────────────
    describe('search()', () => {
        test('construye la URL correcta con query y page por defecto', async () => {
            apiClient.get.mockResolvedValue({
                data: { success: true, data: mockMovieList }
            });

            const result = await tmdbService.search('Avengers');

            expect(apiClient.get).toHaveBeenCalledTimes(1);
            expect(apiClient.get).toHaveBeenCalledWith(
                '/tmdb/search?query=Avengers&page=1'
            );
            expect(result.data).toEqual(mockMovieList);
        });

        test('encoda correctamente caracteres especiales en la query', async () => {
            apiClient.get.mockResolvedValue({ data: { data: [] } });

            await tmdbService.search('El señor de los anillos');

            const calledUrl = apiClient.get.mock.calls[0][0];
            expect(calledUrl).toContain(encodeURIComponent('El señor de los anillos'));
        });

        test('respeta el número de página proporcionado', async () => {
            apiClient.get.mockResolvedValue({ data: { data: [] } });

            await tmdbService.search('Matrix', 3);

            expect(apiClient.get).toHaveBeenCalledWith(
                `/tmdb/search?query=Matrix&page=3`
            );
        });
    });

    // ── getTrending ──────────────────────────────────────────────────────────
    describe('getTrending()', () => {
        test('llama al endpoint correcto con timeWindow "day" por defecto', async () => {
            apiClient.get.mockResolvedValue({
                data: { success: true, data: mockMovieList }
            });

            const result = await tmdbService.getTrending();

            expect(apiClient.get).toHaveBeenCalledWith('/tmdb/trending/day');
            expect(result.data).toEqual(mockMovieList);
        });

        test('llama al endpoint con timeWindow "week" cuando se especifica', async () => {
            apiClient.get.mockResolvedValue({ data: { data: [] } });

            await tmdbService.getTrending('week');

            expect(apiClient.get).toHaveBeenCalledWith('/tmdb/trending/week');
        });

        test('utiliza la caché y NO llama a apiClient en la segunda invocación', async () => {
            // Primera llamada → toca la red
            apiClient.get.mockResolvedValue({
                data: { success: true, data: mockMovieList }
            });

            const first = await tmdbService.getTrending('day');
            const second = await tmdbService.getTrending('day');

            // Solo una llamada HTTP real
            expect(apiClient.get).toHaveBeenCalledTimes(1);
            // Los datos son idénticos (vienen de la caché)
            expect(first).toEqual(second);
        });
    });

    // ── getMovieDetails ──────────────────────────────────────────────────────
    describe('getMovieDetails()', () => {
        test('llama al endpoint correcto con el tmdbId proporcionado', async () => {
            const mockMovie = { id: 550, title: 'Fight Club' };
            apiClient.get.mockResolvedValue({
                data: { success: true, data: mockMovie }
            });

            const result = await tmdbService.getMovieDetails(550);

            expect(apiClient.get).toHaveBeenCalledWith('/tmdb/movie/550');
            expect(result.data).toEqual(mockMovie);
        });
    });

    // ── getPopular ───────────────────────────────────────────────────────────
    describe('getPopular()', () => {
        test('llama con page=1 por defecto y usa caché', async () => {
            apiClient.get.mockResolvedValue({
                data: { success: true, data: mockMovieList }
            });

            await tmdbService.getPopular();

            expect(apiClient.get).toHaveBeenCalledWith('/tmdb/popular?page=1');
        });

        test('pasa el número de página correcto en los params', async () => {
            apiClient.get.mockResolvedValue({ data: { data: [] } });

            await tmdbService.getPopular(2);

            expect(apiClient.get).toHaveBeenCalledWith('/tmdb/popular?page=2');
        });
    });

    // ── getDashboardMovies ───────────────────────────────────────────────────
    describe('getDashboardMovies()', () => {
        test('realiza las 3 peticiones en paralelo y devuelve la estructura correcta', async () => {
            const trendingData = [{ id: 1, title: 'Trending Movie' }];
            const nowPlayingData = [{ id: 2, title: 'Now Playing Movie' }];
            const upcomingData = [{ id: 3, title: 'Upcoming Movie' }];

            // Mapear las URLs a sus respuestas mock
            apiClient.get.mockImplementation((url) => {
                if (url === '/tmdb/trending/day') return Promise.resolve({ data: { data: trendingData } });
                if (url === '/tmdb/now-playing') return Promise.resolve({ data: { data: nowPlayingData } });
                if (url === '/tmdb/upcoming') return Promise.resolve({ data: { data: upcomingData } });
                return Promise.reject(new Error(`URL no mockeada: ${url}`));
            });

            const result = await tmdbService.getDashboardMovies();

            // Las 3 URLs deben haberse llamado
            expect(apiClient.get).toHaveBeenCalledWith('/tmdb/trending/day');
            expect(apiClient.get).toHaveBeenCalledWith('/tmdb/now-playing');
            expect(apiClient.get).toHaveBeenCalledWith('/tmdb/upcoming');

            // La estructura del resultado debe ser la esperada
            expect(result).toEqual({
                trending: trendingData,
                nowPlaying: nowPlayingData,
                upcoming: upcomingData
            });
        });

        test('usa la caché en la segunda invocación (solo 3 llamadas HTTP en total)', async () => {
            apiClient.get.mockResolvedValue({ data: { data: [] } });

            await tmdbService.getDashboardMovies();
            await tmdbService.getDashboardMovies(); // debe usar caché

            // Solo 3 llamadas en la primera vez, ninguna adicional en la segunda
            expect(apiClient.get).toHaveBeenCalledTimes(3);
        });
    });

    // ── Manejo de errores ────────────────────────────────────────────────────
    describe('manejo de errores', () => {
        test('propaga el error cuando apiClient.get falla', async () => {
            const mockError = new Error('Network Error');
            apiClient.get.mockRejectedValue(mockError);

            await expect(tmdbService.getMovieDetails(999)).rejects.toThrow('Network Error');
        });
    });
});
