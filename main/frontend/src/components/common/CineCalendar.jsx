import React, { useState, useEffect } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import movieService from '../../services/movieService';
import './CineCalendar.css';

const CineCalendar = () => {
    const [heatmapData, setHeatmapData] = useState([]);
    
    useEffect(() => {
        const fetchHeatmap = async () => {
            try {
                const res = await movieService.getHeatmapData();
                if (res.data) {
                    setHeatmapData(res.data);
                }
            } catch (error) {
                console.error("Error cargando datos del Cine-Calendario:", error);
            }
        };
        fetchHeatmap();
    }, []);

    // Calcular el último año
    const today = new Date();
    const startDate = new Date();
    startDate.setFullYear(today.getFullYear() - 1);

    return (
        <section className="cine-calendar">
            <h2>📅 Cine-Calendario</h2>
            <p className="cine-calendar__desc">Tu actividad de visionado del último año</p>
            
            <div className="cine-calendar__container">
                <CalendarHeatmap
                    startDate={startDate}
                    endDate={today}
                    values={heatmapData}
                    classForValue={(value) => {
                        if (!value || value.count === 0) {
                            return 'color-empty';
                        }
                        return `color-scale-${Math.min(value.count, 4)}`;
                    }}
                    tooltipDataAttrs={(value) => {
                        return {
                            'data-tooltip-id': 'heatmap-tooltip',
                            'data-tooltip-content': value && value.count 
                                ? `${value.count} película(s) vista(s) el ${value.date}` 
                                : `Sin actividad`
                        };
                    }}
                    showWeekdayLabels={true}
                />
                <Tooltip id="heatmap-tooltip" />
            </div>
            
            <div className="cine-calendar__legend">
                <span>Menos</span>
                <div className="legend-boxes">
                    <div className="legend-box color-empty"></div>
                    <div className="legend-box color-scale-1"></div>
                    <div className="legend-box color-scale-2"></div>
                    <div className="legend-box color-scale-3"></div>
                    <div className="legend-box color-scale-4"></div>
                </div>
                <span>Más</span>
            </div>
        </section>
    );
};

export default CineCalendar;
