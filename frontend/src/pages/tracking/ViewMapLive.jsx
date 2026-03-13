import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { trackingService } from '../../microservices/api.service';
import '../../styles/Tracking.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");const Tracking_ViewMapLive = () => {const [searchParams] = useSearchParams();const [markers, setMarkers] = useState([]);const [loading, setLoading] = useState(true);const [selectedIndex, setSelectedIndex] = useState(0);const fact = searchParams.get('fact') || '0';const empCode = searchParams.get('EmpCode') || '';
  const userId = searchParams.get('userid') || '';

  const fetchPos = async () => {
    setLoading(true);
    try {
      const response = await trackingService.getEmpLiveLocation({
        fact,
        EmpCode: empCode,
        userid: userId
      });
      const rows = Array.isArray(response) ? response : [];
      setMarkers(rows);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Live pos fetch failed', error);
      setMarkers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPos();
  }, [fact, empCode, userId]);

  const selectedMarker = markers[selectedIndex] || null;

  const selectedCoords = useMemo(() => {
    if (!selectedMarker) return null;
    const lat = Number(selectedMarker.lat ?? selectedMarker.LAT ?? 0);
    const lng = Number(selectedMarker.lng ?? selectedMarker.LNG ?? 0);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) {
      return null;
    }
    return { lat, lng };
  }, [selectedMarker]);

  const mapUrl = selectedCoords ?
  `https://maps.google.com/maps?q=${selectedCoords.lat},${selectedCoords.lng}&z=15&output=embed` :
  '';

  return (
    <div className="p-[16px] bg-[#f5f6f8] min-h-[100vh]">
      <div className="bg-white border border-[#dce3ef] rounded-lg overflow-hidden">
        <div className="bg-[#1a9d8f] text-white py-[12px] px-[16px] text-5 font-semibold">
          View Map Live
        </div>

        <div className="p-[16px] flex gap-[10px]">
          <button className="btn btn-primary" onClick={fetchPos} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="btn btn-primary" onClick={() => window.close()}>
            Close
          </button>
        </div>

        <div className="grid">
          <div className="max-h-[70vh] overflow-y-auto">
            <div className="py-[10px] px-[12px] border-b border-b-[#e3e7ef] font-semibold">
              Employees ({markers.length})
            </div>
            {markers.length === 0 ?
            <div className="p-[12px] text-[#666]">{loading ? 'Loading...' : 'No live location found.'}</div> :

            markers.map((m, idx) => {
              const isActive = idx === selectedIndex;
              return (
                <div
                  key={`${m.tr_no || m.USERCODE || idx}`}
                  onClick={() => setSelectedIndex(idx)} className={isActive ? "p-[12px] cursor-pointer border-b border-b-[#f0f2f6] bg-[#e8f4f2]" : "p-[12px] cursor-pointer border-b border-b-[#f0f2f6] bg-white"}>
                  
                    <div className="font-semibold">{m.emp_name || m.Name || m.tr_no || m.USERCODE || '-'}</div>
                    <div className="text-[12px] text-[#555]">{m.cordinatedate || ''}</div>
                    <div className="text-[12px] text-[#777]">{m.address || ''}</div>
                  </div>);

            })
            }
          </div>

          <div className="min-h-[70vh] bg-[#fafafa]">
            {!selectedCoords ?
            <div className="p-[24px] text-[#666]">
                {loading ? 'Loading map...' : 'No valid coordinates to display.'}
              </div> :

            <>
                <iframe
                title="Live Map"
                src={mapUrl}
                width="100%"
                height="100%"

                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade" className="border-[0px] min-h-[70vh]" />
              
                <div className="py-[10px] px-[12px] bg-white border-t border-t-[#e3e7ef]">
                  <div><b>Emp:</b> {selectedMarker?.tr_no || selectedMarker?.USERCODE || '-'}</div>
                  <div><b>Name:</b> {selectedMarker?.emp_name || selectedMarker?.Name || '-'}</div>
                  <div><b>Speed:</b> {selectedMarker?.speed ?? 0} km/h</div>
                  <div><b>Last Sync:</b> {selectedMarker?.cordinatedate || '-'}</div>
                  <button
                  className={__cx("btn btn-primary", "mt-[8px]")}

                  onClick={() => window.open(`https://www.google.com/maps?q=${selectedCoords.lat},${selectedCoords.lng}`, '_blank')}>
                  
                    Open in Google Maps
                  </button>
                </div>
              </>
            }
          </div>
        </div>
      </div>
    </div>);

};

export default Tracking_ViewMapLive;