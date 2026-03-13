import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { trackingService } from '../../microservices/api.service';
import '../../styles/Tracking.css';
import '../../styles/TrackingMapLive.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");const Tracking_TrackingMapLive = () => {const [searchParams] = useSearchParams();const [trail, setTrail] = useState([]);const [currentIndex, setCurrentIndex] = useState(0);const [isPlaying, setIsPlaying] = useState(false);const [playbackSpeed, setPlaybackSpeed] = useState(500); // ms
  const [loading, setLoading] = useState(true);
  const empID = searchParams.get('EmpID');
  const dtFrom = searchParams.get('DtFrom');
  const dtTo = searchParams.get('DtTo');
  const timeFrom = searchParams.get('TimeFrom');
  const timeTo = searchParams.get('TimeTo');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        // Mimicking the .NET DtFrom/DtTo logic if parameters exist
        const response = await trackingService.getHistoryTrail({
          EmpID: empID,
          DtFrom: dtFrom,
          DtTo: dtTo,
          TimeFrom: timeFrom,
          TimeTo: timeTo
        });

        if (Array.isArray(response) && response.length > 0) {
          setTrail(response);
          setCurrentIndex(0);
        } else {
          setTrail([]);
        }
      } catch (error) {
        console.error("History trail analysis failed", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [empID, dtFrom, dtTo, timeFrom, timeTo]);

  useEffect(() => {
    let interval;
    if (isPlaying && currentIndex < trail.length - 1) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => prev + 1);
      }, playbackSpeed);
    } else if (currentIndex >= trail.length - 1) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentIndex, trail, playbackSpeed]);

  const handlePlayPause = () => {
    if (currentIndex >= trail.length - 1) setCurrentIndex(0);
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="trail-view-root">
            {/* Playback HUD Overlay */}
            <div className="map-hud-overlay">
                <div className="hud-horizontal-split">
                    <div className="analysis-stats-glass">
                        <div className="stats-header-row">
                            <div className="route-icon-box">
                                <i className="fas fa-route"></i>
                            </div>
                            <div className="node-id-info">
                                <h3 className="hud-title text-teal-400">History Trail Analysis</h3>
                                <p className="node-badge uppercase tracking-widest text-white/60">
                                    ID: {empID || 'Unknown'} • From: {dtFrom || '-'} {timeFrom || '0000'} • To: {dtTo || '-'} {timeTo || '2359'}
                                </p>
                            </div>
                        </div>

                        {trail.length > 0 && trail[currentIndex] ?
            <div className="dynamic-marker-info animate-in fade-in slide-in-from-left-2 duration-300">
                                <div className="info-data-block">
                                    <label className="data-label">Telemetry Lock</label>
                                    <div className="data-value font-mono text-emerald-400">{trail[currentIndex].cordinatedate}</div>
                                </div>
                                <div className="info-data-block">
                                    <label className="data-label">Decoded Geoposition</label>
                                    <div className="data-value italic text-sm text-slate-300 line-clamp-2">
                                        {trail[currentIndex].address}
                                    </div>
                                </div>
                                <div className="grid-metrics-row">
                                    <div className="metric-box bg-slate-800/80 border-l-2 border-emerald-500">
                                        <label className="metric-label">Velocity</label>
                                        <div className="metric-value text-emerald-400">{trail[currentIndex].speed} <span className="unit text-xs opacity-50">KM/H</span></div>
                                    </div>
                                    <div className="metric-box bg-slate-800/80 border-l-2 border-teal-500">
                                        <label className="metric-label">Coordinates</label>
                                        <div className="metric-value text-xs text-teal-400 font-mono">
                                            {trail[currentIndex].lat?.toFixed(4)}, {trail[currentIndex].lng?.toFixed(4)}
                                        </div>
                                    </div>
                                </div>
                            </div> :
            !loading &&
            <div className="p-4 text-rose-400 font-bold border border-rose-500/20 bg-rose-500/10 rounded-lg">
                                No historical tracking data found for this period.
                            </div>
            }
                    </div>

                    <div className="exit-action-wrap">
                        <button className="btn-exit-circle" title="Exit Preview" onClick={() => window.close()}>
                            <i className="fas fa-arrow-left"></i>
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Controls Area */}
            <div className="map-playback-panel-wrap">
                <div className="playback-panel-glass">
                    <div className="controls-flex-row">
                        <button
              className={`playback-toggle-btn shadow-lg transition-all ${isPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              onClick={handlePlayPause}
              disabled={trail.length === 0}>
              
                            <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                        </button>

                        <div className="timeline-slider-wrap flex-1">
                            <div className="timeline-labels flex justify-between mb-2">
                                <span className="label-text text-white/50 text-[10px] uppercase font-bold tracking-widest">Route Progress</span>
                                <span className="label-count text-teal-400 text-xs font-mono">{currentIndex + 1} / {trail.length} Samples</span>
                            </div>
                            <input
                type="range"
                min="0"
                max={trail.length > 0 ? trail.length - 1 : 0}
                value={currentIndex}
                onChange={(e) => setCurrentIndex(parseInt(e.target.value))}
                className="w-full accent-teal-500 cursor-pointer h-1 bg-slate-700 rounded-full" />
              
                        </div>

                        <div className="speed-selector-bank flex gap-1">
                            {[1000, 500, 200, 50].map((s, i) =>
              <button
                key={s}
                className={`px-3 py-1 rounded text-[10px] font-black tracking-tighter transition-all ${playbackSpeed === s ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                onClick={() => setPlaybackSpeed(s)}>
                
                                    {['1X', '2X', '5X', '20X'][i]}
                                </button>
              )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Simulated Trail Canvas */}
            <div className="canvas-viewport bg-slate-950">
                <div className="deep-space-canvas relative h-full w-full">
                    {/* Perspective Grid Background */}
                    <div className={__cx("absolute inset-0 opacity-20 pointer-events-none", " ")}>


          </div>

                    {loading ?
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-50">
                            <div className="w-16 h-16 border-t-4 border-teal-500 border-r-4 border-transparent rounded-full animate-spin mb-6"></div>
                            <h2 className="text-teal-400 text-sm font-black tracking-[0.3em] uppercase">Interpolating Geodata</h2>
                        </div> :
          trail.length > 0 ?
          <div className="simulation-layer h-full w-full relative">
                            {/* SVG Trail Path */}
                            <svg className={__cx("absolute inset-0 w-full h-full", "")}>
                                <polyline
                fill="none"
                stroke="#14b8a6"
                strokeWidth="3"
                strokeDasharray="5,5"
                strokeLinecap="round"
                points={trail.slice(0, currentIndex + 1).map((p, i) => {
                  // Calculate simulated screen coordinates based on relative position
                  const x = 20 + i * (60 / trail.length) + Math.sin(i) * 5;
                  const y = 80 - i * (60 / trail.length) + Math.cos(i) * 5;
                  return `${x}% ${y}%`;
                }).join(' ')} />
              
                            </svg>

                            {/* Active Point Marker */}
                            {trail[currentIndex] &&
            <div
              className={`absolute transition-all duration-300 ease-out z-10 -translate-x-1/2 -translate-y-1/2 left-[${20 + currentIndex * (60 / trail.length) + Math.sin(currentIndex) * 5}%] top-[${80 - currentIndex * (60 / trail.length) + Math.cos(currentIndex) * 5}%]`}>
              
                                    <div className="relative">
                                        <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500 animate-ping absolute -inset-0"></div>
                                        <div className="w-4 h-4 rounded-full bg-teal-400 border-2 border-white shadow-[0_0_15px_rgba(45,212,191,0.8)] relative z-20"></div>

                                        {/* Directional Arrow (Simulated) */}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 border-t-2 border-teal-400 rounded-full opacity-20 rotate-45 animate-pulse"></div>
                                    </div>
                                </div>
            }

                            {/* Start/End Anchors */}
                            <div className="absolute left-[20%] top-[80%] -translate-x-1/2 -translate-y-1/2">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></div>
                                <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[8px] font-black text-emerald-500 uppercase">Origin</span>
                            </div>
                        </div> :

          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <i className="fas fa-map-marked-alt text-6xl text-slate-800 mb-6"></i>
                            <p className="text-slate-600 font-bold uppercase tracking-widest text-sm">Waiting for valid trail dataset</p>
                        </div>
          }
                </div>
            </div>
        </div>);

};

export default Tracking_TrackingMapLive;
