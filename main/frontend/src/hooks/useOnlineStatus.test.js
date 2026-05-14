/**
 * @file useOnlineStatus.test.js
 * @description Tests unitarios para el hook useOnlineStatus.
 *
 * Estrategia:
 *   - renderHook() renderiza el hook en un entorno de prueba sin DOM real.
 *   - Se disparan eventos nativos 'online' y 'offline' en window para verificar
 *     que el hook responde correctamente a los cambios de conectividad.
 *   - act() asegura que las actualizaciones de estado de React se procesan
 *     antes de hacer las aserciones.
 */
import { renderHook, act } from '@testing-library/react-hooks';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

describe('useOnlineStatus', () => {
    // Guardar el valor original de navigator.onLine para restaurarlo tras cada test
    const originalOnLine = window.navigator.onLine;

    beforeEach(() => {
        // Simular que estamos online antes de cada test
        Object.defineProperty(window.navigator, 'onLine', {
            configurable: true,
            writable: true,
            value: true
        });
    });

    afterEach(() => {
        // Restaurar navigator.onLine al valor original
        Object.defineProperty(window.navigator, 'onLine', {
            configurable: true,
            writable: true,
            value: originalOnLine
        });
    });

    test('devuelve true cuando navigator.onLine es true al montar', () => {
        const { result } = renderHook(() => useOnlineStatus());
        expect(result.current).toBe(true);
    });

    test('devuelve false al montar si navigator.onLine es false', () => {
        Object.defineProperty(window.navigator, 'onLine', { value: false, writable: true });
        const { result } = renderHook(() => useOnlineStatus());
        expect(result.current).toBe(false);
    });

    test('cambia a false al disparar el evento "offline"', () => {
        const { result } = renderHook(() => useOnlineStatus());

        // El estado inicial debe ser true
        expect(result.current).toBe(true);

        // Simular pérdida de conexión
        act(() => {
            window.dispatchEvent(new Event('offline'));
        });

        expect(result.current).toBe(false);
    });

    test('cambia a true al disparar el evento "online" después de "offline"', () => {
        const { result } = renderHook(() => useOnlineStatus());

        // Ir offline primero
        act(() => {
            window.dispatchEvent(new Event('offline'));
        });
        expect(result.current).toBe(false);

        // Recuperar conexión
        act(() => {
            window.dispatchEvent(new Event('online'));
        });
        expect(result.current).toBe(true);
    });

    test('elimina los event listeners al desmontar (no hay fugas de memoria)', () => {
        const addSpy = jest.spyOn(window, 'addEventListener');
        const removeSpy = jest.spyOn(window, 'removeEventListener');

        const { unmount } = renderHook(() => useOnlineStatus());

        // Verificar que se registraron los listeners
        expect(addSpy).toHaveBeenCalledWith('online', expect.any(Function));
        expect(addSpy).toHaveBeenCalledWith('offline', expect.any(Function));

        unmount();

        // Verificar que se eliminaron los listeners al desmontar
        expect(removeSpy).toHaveBeenCalledWith('online', expect.any(Function));
        expect(removeSpy).toHaveBeenCalledWith('offline', expect.any(Function));

        addSpy.mockRestore();
        removeSpy.mockRestore();
    });

    test('múltiples toggles consecutivos se mantienen coherentes', () => {
        const { result } = renderHook(() => useOnlineStatus());

        act(() => { window.dispatchEvent(new Event('offline')); });
        expect(result.current).toBe(false);

        act(() => { window.dispatchEvent(new Event('online')); });
        expect(result.current).toBe(true);

        act(() => { window.dispatchEvent(new Event('offline')); });
        expect(result.current).toBe(false);

        act(() => { window.dispatchEvent(new Event('online')); });
        expect(result.current).toBe(true);
    });
});
