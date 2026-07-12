import React from "react";

export const LifecycleRail = ({ currentStatus, onChangeStatus, readOnly = false }) => {
  // Ordered 7-state lifecycle rail
  const states = [
    { key: "registered", label: "Registered" },
    { key: "available", label: "Available" },
    { key: "allocated", label: "Allocated" },
    { key: "reserved", label: "Reserved" },
    { key: "maint", label: "Maint" },
    { key: "alert", label: "Alert" },
    { key: "disposed", label: "Disposed" }
  ];

  // Helper to find index of current status
  const currentIndex = states.findIndex(s => s.key === currentStatus.toLowerCase());

  const handleStepClick = (stateKey, idx) => {
    if (readOnly || !onChangeStatus) return;
    onChangeStatus(stateKey);
  };

  return (
    <div className="lifecycle-rail-wrapper" style={{ margin: "24px 0 40px 0" }}>
      <div className="lifecycle-rail-track">
        {states.map((state, idx) => {
          const isActive = idx === currentIndex;
          const isCompleted = idx < currentIndex;
          
          let stateClass = "";
          if (isActive) stateClass = "active";
          else if (isCompleted) stateClass = "completed";

          return (
            <div 
              key={state.key} 
              className={`lifecycle-rail-step ${stateClass}`}
              onClick={() => handleStepClick(state.key, idx)}
              title={readOnly ? `Status: ${state.label}` : `Set Status to ${state.label}`}
              style={{
                cursor: readOnly ? "default" : "pointer"
              }}
            >
              <div className="lifecycle-rail-label">
                {state.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
