import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { StampedTag } from "../components/StampedTag";
import { RefusalAlert } from "../components/RefusalAlert";
import { Calendar, Clock, Plus, AlertTriangle } from "lucide-react";

export const Bookings = () => {
  const { 
    assets, 
    bookings, 
    employees, 
    addBooking, 
    currentUser 
  } = useContext(AppContext);

  // Filter bookable assets
  const bookableAssets = assets.filter(a => a.bookable);

  // Select active asset for timetable view
  const [activeAssetTag, setActiveAssetTag] = useState(() => {
    return bookableAssets.length > 0 ? bookableAssets[0].tag : "";
  });

  // Booking Form State
  const [bookingDate, setBookingDate] = useState("2026-07-13"); // Monday
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");

  // Conflict Pre-render state
  const [conflictBlock, setConflictBlock] = useState(null);
  const [refusalOpen, setRefusalOpen] = useState(false);
  const [refusalReason, setRefusalReason] = useState("");

  const activeAsset = assets.find(a => a.tag === activeAssetTag);

  // Days of week (mock dates for Monday Jul 13 to Sun Jul 19, 2026)
  const weekDays = [
    { key: "2026-07-13", label: "Mon", dateStr: "Jul 13" },
    { key: "2026-07-14", label: "Tue", dateStr: "Jul 14" },
    { key: "2026-07-15", label: "Wed", dateStr: "Jul 15" },
    { key: "2026-07-16", label: "Thu", dateStr: "Jul 16" },
    { key: "2026-07-17", label: "Fri", dateStr: "Jul 17" },
    { key: "2026-07-18", label: "Sat", dateStr: "Jul 18" },
    { key: "2026-07-19", label: "Sun", dateStr: "Jul 19" }
  ];

  // Hours displayed on grid
  const hours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

  // Filter bookings for active asset
  const activeBookings = bookings.filter(b => b.assetTag === activeAssetTag && b.status === "approved");

  // Submit request
  const handleBookingSubmit = (e) => {
    e.preventDefault();
    if (!activeAssetTag) return;

    setConflictBlock(null);

    const startDateTime = `${bookingDate}T${startTime}:00`;
    const endDateTime = `${bookingDate}T${endTime}:00`;

    if (new Date(endDateTime) <= new Date(startDateTime)) {
      alert("End time must be after start time.");
      return;
    }

    const res = addBooking({
      assetTag: activeAssetTag,
      employeeId: currentUser?.id || "E-1",
      startTime: startDateTime,
      endTime: endDateTime
    });

    if (!res.success) {
      if (res.error === "overlap") {
        // Find owner details
        const booker = employees.find(emp => emp.id === res.overlapping.employeeId)?.name || "Another user";
        
        // Show conflict preview block on timetable
        setConflictBlock({
          date: bookingDate,
          start: startTime,
          end: endTime
        });

        setRefusalReason(`Overlap conflict detected. This slot is reserved by ${booker}.`);
        setRefusalOpen(true);
      } else {
        alert(res.reason || "Booking failed.");
      }
    } else {
      alert("Reservation confirmed successfully.");
    }
  };

  // Helper to map time to percentage position in columns
  const getTimePositionPercent = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    const totalMinutes = h * 60 + m;
    const startOfDayMinutes = 9 * 60; // 09:00 start
    const endOfDayMinutes = 18 * 60; // 18:00 end
    const minutesInDay = endOfDayMinutes - startOfDayMinutes;
    
    const elapsed = totalMinutes - startOfDayMinutes;
    return (elapsed / minutesInDay) * 100;
  };

  return (
    <div>
      {/* Refusal Alert Modal Popup */}
      <RefusalAlert 
        isOpen={refusalOpen}
        title="Schedule Overlap"
        reason={refusalReason}
        onClose={() => setRefusalOpen(false)}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div className="flex-align-center">
          <span className="mono" style={{ fontSize: "12px", color: "var(--text-3)" }}>BOOKABLE /</span>
          <select 
            value={activeAssetTag} 
            onChange={(e) => { setActiveAssetTag(e.target.value); setConflictBlock(null); }}
            style={{ 
              padding: "8px 16px", 
              fontSize: "14px", 
              fontWeight: "600",
              backgroundColor: "var(--surface)", 
              border: "1px solid var(--hairline)", 
              borderRadius: "4px" 
            }}
          >
            {bookableAssets.map(c => <option key={c.tag} value={c.tag}>{c.tag} — {c.name}</option>)}
          </select>
        </div>

        {activeAsset && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-3)" }}>Location: <strong>{activeAsset.location}</strong></span>
            <span className={`condition-stamp ${activeAsset.condition}`} style={{ fontSize: "9px" }}>
              {activeAsset.condition}
            </span>
          </div>
        )}
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: "300px 1fr", alignItems: "start" }}>
        
        {/* Reservation request form panel */}
        <div className="data-table-card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={16} />
            <span>Request Time Slot</span>
          </h3>

          <form onSubmit={handleBookingSubmit}>
            
            <div className="form-group">
              <label>Booking Date</label>
              <select 
                className="form-control"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                required
              >
                {weekDays.map(d => (
                  <option key={d.key} value={d.key}>{d.label} — {d.dateStr}</option>
                ))}
              </select>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Start Time</label>
                <select 
                  className="form-control mono"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                >
                  {hours.slice(0, -1).map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>End Time</label>
                <select 
                  className="form-control mono"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                >
                  {hours.slice(1).map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "8px" }}>
              <Clock size={16} />
              <span>Reserve Slot</span>
            </button>

            {/* Quick Testing shortcuts */}
            <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--hairline-2)", fontSize: "11px", color: "var(--text-3)" }}>
              <strong>Test Overlap:</strong> Select Mon (Jul 13), set time to <strong>09:00 - 11:00</strong> and reserve to check overlap handling (Sony FX3 has active booking).
            </div>

          </form>
        </div>

        {/* Timetable weekly grid calendar */}
        <div>
          <div className="timetable-grid">
            
            {/* Corner header */}
            <div className="timetable-header">
              <div className="timetable-corner" />
              {weekDays.map(day => (
                <div key={day.key} className="timetable-day-header">
                  {day.label} <span style={{ fontWeight: "normal", fontSize: "10px", marginLeft: "4px", color: "var(--text-3)" }}>{day.dateStr}</span>
                </div>
              ))}
            </div>

            {/* Timetable slots */}
            <div className="timetable-body">
              {/* Vertical hour markers on the left */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                {hours.map(hour => (
                  <div key={hour} className="timetable-hour-label">{hour}</div>
                ))}
              </div>

              {/* Grid content columns */}
              {weekDays.map(day => {
                // Find bookings for this day
                const dayBookings = activeBookings.filter(b => {
                  const bDate = b.startTime.split("T")[0];
                  return bDate === day.key;
                });

                // Check if this day has the temporary conflict preview block
                const isConflictDay = conflictBlock && conflictBlock.date === day.key;

                return (
                  <div key={day.key} className="timetable-slots-column" style={{ height: `${(hours.length - 1) * 50}px`, position: "relative" }}>
                    
                    {/* Render helper lines representing hours */}
                    {hours.slice(0, -1).map((_, i) => (
                      <div 
                        key={i} 
                        style={{ 
                          position: "absolute", 
                          top: `${i * 50}px`, 
                          left: 0, 
                          right: 0, 
                          height: "1px", 
                          backgroundColor: "var(--hairline-2)" 
                        }} 
                      />
                    ))}

                    {/* Active bookings blocks */}
                    {dayBookings.map(b => {
                      const startStr = b.startTime.split("T")[1].substring(0, 5);
                      const endStr = b.endTime.split("T")[1].substring(0, 5);
                      
                      const topPct = getTimePositionPercent(startStr);
                      const bottomPct = getTimePositionPercent(endStr);
                      const heightPct = bottomPct - topPct;

                      const booker = employees.find(emp => emp.id === b.employeeId);

                      return (
                        <div 
                          key={b.id} 
                          className="timetable-block"
                          style={{
                            top: `${topPct}%`,
                            height: `${heightPct}%`,
                            title: `Reserved by ${booker?.name}`
                          }}
                        >
                          <span style={{ fontWeight: "600" }}>{booker?.name}</span>
                          <span style={{ fontSize: "9.5px", opacity: 0.8 }}>{startStr} - {endStr}</span>
                        </div>
                      );
                    })}

                    {/* Conflict Preview Hatch block */}
                    {isConflictDay && (() => {
                      const topPct = getTimePositionPercent(conflictBlock.start);
                      const bottomPct = getTimePositionPercent(conflictBlock.end);
                      const heightPct = bottomPct - topPct;

                      return (
                        <div 
                          className="timetable-block hazard-hatch"
                          style={{
                            top: `${topPct}%`,
                            height: `${heightPct}%`,
                            zIndex: 15
                          }}
                        >
                          <span style={{ fontWeight: "600", display: "flex", alignItems: "center", gap: "2px" }}>
                            <AlertTriangle size={10} />
                            <span>Overlap</span>
                          </span>
                          <span style={{ fontSize: "9.5px" }}>{conflictBlock.start} - {conflictBlock.end}</span>
                        </div>
                      );
                    })()}

                  </div>
                );
              })}

            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
