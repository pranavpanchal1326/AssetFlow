import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { StampedTag } from "../components/StampedTag";
import { RefusalAlert } from "../components/RefusalAlert";
import { Calendar, Clock, Plus, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

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
  const [bookingDate, setBookingDate] = useState("2026-07-13");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [showForm, setShowForm] = useState(false);

  // Conflict state
  const [conflictBlock, setConflictBlock] = useState(null);
  const [conflictInfo, setConflictInfo] = useState(null);
  const [refusalOpen, setRefusalOpen] = useState(false);
  const [refusalReason, setRefusalReason] = useState("");

  const activeAsset = assets.find(a => a.tag === activeAssetTag);

  // Days of week
  const weekDays = [
    { key: "2026-07-13", label: "Mon", num: "13", full: "Mon 13" },
    { key: "2026-07-14", label: "Tue", num: "14", full: "Tue 14" },
    { key: "2026-07-15", label: "Wed", num: "15", full: "Wed 15", isToday: true },
    { key: "2026-07-16", label: "Thu", num: "16", full: "Thu 16" },
    { key: "2026-07-17", label: "Fri", num: "17", full: "Fri 17" },
    { key: "2026-07-18", label: "Sat", num: "18", full: "Sat 18", isWeekend: true },
    { key: "2026-07-19", label: "Sun", num: "19", full: "Sun 19", isWeekend: true }
  ];

  // Hours displayed on grid (9 AM to 6 PM)
  const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
  const totalHours = hours.length;
  const hourHeight = 56; // px per hour slot

  // Filter bookings for active asset
  const activeBookings = bookings.filter(b => b.assetTag === activeAssetTag && b.status === "approved");

  // Submit request
  const handleBookingSubmit = (e) => {
    e.preventDefault();
    if (!activeAssetTag) return;

    setConflictBlock(null);
    setConflictInfo(null);

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
        const booker = employees.find(emp => emp.id === res.overlapping.employeeId)?.name || "Another user";
        
        setConflictBlock({
          date: bookingDate,
          start: startTime,
          end: endTime
        });

        setConflictInfo({
          bookerName: booker,
          assetName: activeAsset?.name || activeAssetTag,
        });

        setRefusalReason(`Overlap conflict detected. This slot is reserved by ${booker}.`);
        setRefusalOpen(true);
      } else {
        alert(res.reason || "Booking failed.");
      }
    } else {
      setShowForm(false);
      alert("Reservation confirmed successfully.");
    }
  };

  // Map time string to pixel offset
  const getTimePixelOffset = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    const totalMinutes = h * 60 + m;
    const startMinutes = 8 * 60; // 08:00 start
    const elapsedMinutes = totalMinutes - startMinutes;
    return (elapsedMinutes / 60) * hourHeight;
  };

  return (
    <div>
      {/* Refusal Alert Modal */}
      <RefusalAlert 
        isOpen={refusalOpen}
        title="Schedule Overlap"
        reason={refusalReason}
        onClose={() => setRefusalOpen(false)}
      />

      {/* Page Header */}
      <div className="bookings-page-header">
        <div>
          <h2>Resource Schedule: Week 29</h2>
          {activeAsset && (
            <div style={{ 
              display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" 
            }}>
              <span style={{ 
                fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-3)" 
              }}>
                Location: <strong style={{ color: "var(--ink)" }}>{activeAsset.location}</strong>
              </span>
              <span className={`condition-stamp ${activeAsset.condition}`}>
                {activeAsset.condition}
              </span>
            </div>
          )}
        </div>
        <div className="bookings-asset-selector">
          <span>Bookable /</span>
          <select 
            value={activeAssetTag} 
            onChange={(e) => { 
              setActiveAssetTag(e.target.value); 
              setConflictBlock(null); 
              setConflictInfo(null); 
            }}
          >
            {bookableAssets.map(c => (
              <option key={c.tag} value={c.tag}>{c.tag} — {c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Hot Band - Schedule Conflict Alert */}
      {conflictInfo && (
        <div className="booking-hot-band">
          <AlertTriangle size={18} />
          <div>
            <div className="booking-hot-band-label">Schedule Conflict Detected</div>
            <p>
              Resource "{conflictInfo.assetName}" requested by {currentUser?.name || "you"} intersects with confirmed booking by {conflictInfo.bookerName}. Review required.
            </p>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: showForm ? "280px 1fr" : "1fr", gap: "24px", alignItems: "start" }}>
        
        {/* Booking Form Panel (toggleable) */}
        {showForm && (
          <div className="booking-form-panel">
            <h3>
              <Calendar size={16} />
              Request Time Slot
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
                    <option key={d.key} value={d.key}>{d.label} — Jul {d.num}</option>
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
                <Clock size={14} />
                <span>Reserve Slot</span>
              </button>

              <div style={{ 
                marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--hairline-2)", 
                fontSize: "11px", color: "var(--text-3)" 
              }}>
                <strong>Test Overlap:</strong> Select Mon (Jul 13), set time to <strong>09:00 - 11:00</strong> and reserve.
              </div>
            </form>
          </div>
        )}

        {/* Timetable Grid */}
        <div>
          {/* Controls Row */}
          <div className="booking-controls">
            <div className="booking-week-nav">
              <button className="booking-week-btn"><ChevronLeft size={14} /> Prev</button>
              <button className="booking-week-btn active">Current</button>
              <button className="booking-week-btn">Next <ChevronRight size={14} /></button>
            </div>
            <button 
              className="booking-new-cta" 
              onClick={() => setShowForm(!showForm)}
            >
              <Plus size={14} />
              {showForm ? "Close Form" : "New Booking"}
            </button>
          </div>

          {/* Brutalist Timetable */}
          <div className="brutalist-timetable">
            {/* Header Row */}
            <div className="brutalist-timetable-header">
              <div className="brutalist-time-corner">
                <span>Time</span>
              </div>
              <div className="brutalist-days-row">
                {weekDays.map(day => (
                  <div 
                    key={day.key} 
                    className={`brutalist-day-cell ${day.isToday ? "today" : ""} ${day.isWeekend ? "weekend" : ""}`}
                  >
                    <span>{day.full}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="brutalist-timetable-body" style={{ height: `${totalHours * hourHeight}px` }}>
              {/* Time Column */}
              <div className="brutalist-time-column">
                {hours.map(hour => (
                  <div key={hour} className="brutalist-hour-label">{hour}</div>
                ))}
              </div>

              {/* Grid Area */}
              <div className="brutalist-grid-area">
                {/* Background hour lines */}
                <div className="brutalist-hour-lines">
                  {hours.map((_, i) => (
                    <div key={i} className="brutalist-hour-line" />
                  ))}
                </div>

                {/* Day Columns with Booking Blocks */}
                {weekDays.map(day => {
                  const dayBookings = activeBookings.filter(b => {
                    const bDate = b.startTime.split("T")[0];
                    return bDate === day.key;
                  });

                  const isConflictDay = conflictBlock && conflictBlock.date === day.key;

                  return (
                    <div 
                      key={day.key} 
                      className={`brutalist-day-column ${day.isToday ? "today-column" : ""}`}
                    >
                      {/* Current Time Indicator (only on today) */}
                      {day.isToday && (() => {
                        // Position at ~12:30 for visual demo (since mock data is Jul 15 Wed)
                        const demoTimeOffset = getTimePixelOffset("12:30");
                        return (
                          <div className="current-time-line" style={{ top: `${demoTimeOffset}px` }}>
                            <div className="current-time-dot" />
                          </div>
                        );
                      })()}

                      {/* Active booking blocks */}
                      {dayBookings.map(b => {
                        const startStr = b.startTime.split("T")[1].substring(0, 5);
                        const endStr = b.endTime.split("T")[1].substring(0, 5);
                        
                        const topPx = getTimePixelOffset(startStr);
                        const bottomPx = getTimePixelOffset(endStr);
                        const heightPx = bottomPx - topPx;

                        const booker = employees.find(emp => emp.id === b.employeeId);

                        return (
                          <div 
                            key={b.id} 
                            className="booking-block"
                            style={{
                              top: `${topPx}px`,
                              height: `${heightPx}px`,
                            }}
                            title={`Reserved by ${booker?.name}`}
                          >
                            <span className="booking-block-title">
                              {activeAsset?.name || activeAssetTag}
                            </span>
                            <span className="booking-block-person">{booker?.name}</span>
                            <span className="booking-block-time">{startStr} – {endStr}</span>
                          </div>
                        );
                      })}

                      {/* Conflict Preview Block */}
                      {isConflictDay && (() => {
                        const topPx = getTimePixelOffset(conflictBlock.start);
                        const bottomPx = getTimePixelOffset(conflictBlock.end);
                        const heightPx = bottomPx - topPx;

                        return (
                          <div 
                            className="booking-block conflict-block"
                            style={{
                              top: `${topPx}px`,
                              height: `${heightPx}px`,
                              left: "15%",
                              right: "3px",
                            }}
                          >
                            <span className="conflict-stamp">Rejected</span>
                            <span className="booking-block-title" style={{ color: "var(--ink)" }}>
                              {activeAsset?.name || activeAssetTag}
                            </span>
                            <span className="booking-block-person" style={{ color: "var(--text-2)" }}>
                              {currentUser?.name || "You"}
                            </span>
                            <span className="booking-block-time" style={{ color: "var(--text-2)" }}>
                              {conflictBlock.start} – {conflictBlock.end}
                            </span>
                            <div className="conflict-reason">
                              OVERLAP ERR: {conflictInfo?.bookerName?.toUpperCase() || "CONFLICT"}
                            </div>
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
    </div>
  );
};
