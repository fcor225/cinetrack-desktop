const express = require('express');
const router = express.Router();
const tmdbController = require('../controllers/tmdbController');

/** @route GET /api/tmdb/search?query=Titanic&page=1 */
router.get('/search', tmdbController.searchMovies);

/** @route GET /api/tmdb/trending/:timeWindow (day|week) */
router.get('/trending/:timeWindow', tmdbController.getTrending);

/** @route GET /api/tmdb/movie/:tmdbId */
router.get('/movie/:tmdbId', tmdbController.getMovieDetails);

/** @route GET /api/tmdb/movie/:tmdbId/reviews */
router.get('/movie/:tmdbId/reviews', tmdbController.getMovieReviews);

/** @route GET /api/tmdb/popular?page=1 */
router.get('/popular', tmdbController.getPopular);

/** @route GET /api/tmdb/now-playing?page=1 */
router.get('/now-playing', tmdbController.getNowPlaying);

router.get('/upcoming', tmdbController.getUpcoming);
router.get('/movie/:tmdbId/watch/providers', tmdbController.getWatchProviders);
router.get('/movie/:tmdbId/recommendations', tmdbController.getRecommendations);
router.get('/movie/:tmdbId/credits', tmdbController.getCredits);
router.get('/movie/:tmdbId/videos', tmdbController.getVideos);

/** @route GET /api/tmdb/discover?page=1 — Descubrimiento para CineSwipe */
router.get('/discover', tmdbController.getDiscover);

module.exports = router;
