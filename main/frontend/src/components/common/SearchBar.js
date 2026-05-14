import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchBar.css';

const SearchBar = ({ onSearch, placeholder = 'Buscar películas...' }) => {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();
    const inputRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim().length >= 2) {
            navigate(`/buscar?q=${encodeURIComponent(query.trim())}`);
            if (onSearch) onSearch(query.trim());
        }
    };

    useEffect(() => {
        const handleKey = (e) => { if (e.key === '/' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); inputRef.current?.focus(); } };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    return (
        <form className="search-bar" onSubmit={handleSubmit}>
            <span className="search-bar__icon">🔍</span>
            <input ref={inputRef} type="text" className="search-bar__input" placeholder={placeholder} value={query} onChange={(e) => setQuery(e.target.value)} />
            {query && <button type="button" className="search-bar__clear" onClick={() => setQuery('')}>✕</button>}
            <span className="search-bar__shortcut">/</span>
        </form>
    );
};
export default SearchBar;
