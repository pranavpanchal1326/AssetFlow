import React from "react";

export const StampedTag = ({ tag, variant = "plain", style = {} }) => {
  if (variant === "hero") {
    return (
      <div className="stamped-plate stamped-plate-accent" style={style}>
        <span style={{ fontSize: "10px", opacity: 0.6 }}>TAG //</span>
        <span>{tag}</span>
      </div>
    );
  }
  
  if (variant === "stamp") {
    return (
      <div className="stamped-plate" style={style}>
        <span>{tag}</span>
      </div>
    );
  }

  // Plain table row variant (one-line mono, no wrapped box)
  return (
    <span className="table-tag mono" style={style}>
      {tag}
    </span>
  );
};
