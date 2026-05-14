import { useState, useEffect, useRef } from 'react';

/**
 * @module hooks/useIntersectionObserver
 * @description Custom hook que observa si un elemento DOM es visible en el viewport.
 * Implementado con la API nativa IntersectionObserver (sin dependencias externas).
 *
 * @param {Object} options - Opciones del IntersectionObserver
 * @param {string} [options.root=null]       - Elemento raíz del viewport (null = ventana)
 * @param {string} [options.rootMargin='0px'] - Margen adicional alrededor del root
 * @param {number} [options.threshold=0.1]   - Porcentaje de visibilidad para disparar
 * @returns {{ ref: React.RefObject, isIntersecting: boolean }}
 *   - ref: ref a adjuntar al elemento observado
 *   - isIntersecting: true cuando el elemento es visible
 *
 * @example
 * const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.5 });
 * useEffect(() => { if (isIntersecting) cargarMas(); }, [isIntersecting]);
 * return <div ref={ref} />;
 */
const useIntersectionObserver = ({
    root = null,
    rootMargin = '0px',
    threshold = 0.1
} = {}) => {
    const ref = useRef(null);
    const [isIntersecting, setIsIntersecting] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        // Crear el observer
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsIntersecting(entry.isIntersecting);
            },
            { root, rootMargin, threshold }
        );

        observer.observe(element);

        // Cleanup al desmontar o cuando cambian las opciones
        return () => {
            observer.unobserve(element);
            observer.disconnect();
        };
    }, [root, rootMargin, threshold]);

    return { ref, isIntersecting };
};

export default useIntersectionObserver;
