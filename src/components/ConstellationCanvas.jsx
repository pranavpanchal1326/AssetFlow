import React, { useRef, useEffect } from "react";

export const ConstellationCanvas = ({ activeStep = 0, prefersReducedMotion = false }) => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: null, y: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;

    // Canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Track mouse position relative to canvas coordinate space
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      // Translate screen coordinates to canvas pixels
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: null, y: null };
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    // Color tokens
    const colors = {
      canvasBg: "transparent", // Transparent lets it float behind glassmorphism
      ink: "#18181B",
      text2: "#52525B",
      text3: "#8E8E93",
      hairline: "#E4E4E1",
      accent: "#2C5FE0",
      accentSoft: "rgba(44, 95, 224, 0.08)",
      alert: "#C0392B",
      alertSoft: "rgba(192, 57, 43, 0.08)"
    };

    // Node & Link structures
    let nodes = [];
    let links = [];

    // Initialize base constellation
    const initConstellation = () => {
      nodes = [
        // People
        { id: "Priya", label: "Priya Sharma", initials: "PS", type: "person", x: 0, y: 0, vx: 0, vy: 0, radius: 24, targetX: 0, targetY: 0 },
        { id: "Raj", label: "Raj Patel", initials: "RP", type: "person", x: 0, y: 0, vx: 0, vy: 0, radius: 24, targetX: 0, targetY: 0 },
        { id: "Vikram", label: "Vikram Singh", initials: "VS", type: "person", x: 0, y: 0, vx: 0, vy: 0, radius: 24, targetX: 0, targetY: 0 },
        { id: "Elena", label: "Elena Rostova", initials: "ER", type: "person", x: 0, y: 0, vx: 0, vy: 0, radius: 24, targetX: 0, targetY: 0 },
        { id: "Sarah", label: "Sarah Jenkins", initials: "SJ", type: "person", x: 0, y: 0, vx: 0, vy: 0, radius: 24, targetX: 0, targetY: 0 },
        // Assets
        { id: "AF-0001", label: "AF-0001", type: "asset", name: "MacBook Pro", x: 0, y: 0, vx: 0, vy: 0, radius: 36, targetX: 0, targetY: 0 },
        { id: "AF-0002", label: "AF-0002", type: "asset", name: "ThinkPad P16", x: 0, y: 0, vx: 0, vy: 0, radius: 36, targetX: 0, targetY: 0 },
        { id: "AF-0003", label: "AF-0003", type: "asset", name: "Sony Cine Camera", x: 0, y: 0, vx: 0, vy: 0, radius: 36, targetX: 0, targetY: 0 },
        { id: "AF-0004", label: "AF-0004", type: "asset", name: "Tesla Model 3", x: 0, y: 0, vx: 0, vy: 0, radius: 36, targetX: 0, targetY: 0 },
        { id: "AF-0005", label: "AF-0005", type: "asset", name: "Epson Projector", x: 0, y: 0, vx: 0, vy: 0, radius: 36, targetX: 0, targetY: 0 },
        { id: "AF-0008", label: "AF-0008", type: "asset", name: "Red Komodo", x: 0, y: 0, vx: 0, vy: 0, radius: 36, targetX: 0, targetY: 0 }
      ];

      // Distribute nodes randomly near center initially
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      nodes.forEach(node => {
        node.x = cx + (Math.random() - 0.5) * 800; // Wider initial spread
        node.y = cy + (Math.random() - 0.5) * 800;
      });

      links = [
        { source: "Priya", target: "AF-0001", type: "normal", length: 220, label: "" },
        { source: "Raj", target: "AF-0002", type: "normal", length: 220, label: "" },
        { source: "Vikram", target: "AF-0004", type: "normal", length: 240, label: "" },
        { source: "Elena", target: "AF-0008", type: "normal", length: 220, label: "" }
      ];
    };

    initConstellation();

    // Handoff state simulation variables
    let handoffTimer = 0;
    let handoffLabel = "";
    let handoffProgress = 0;
    let repelForce = 0;

    // View camera variables (supports scroll zooming and focusing)
    let camera = { x: canvas.width / 2, y: canvas.height / 2, zoom: 1.0 };
    let targetCamera = { x: canvas.width / 2, y: canvas.height / 2, zoom: 1.0 };

    // The Main Physics & Drawing loop
    const tick = () => {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Handle Step Specific Actions / Camera target / Nodes targeting
      if (activeStep === 0) {
        targetCamera.x = cx;
        targetCamera.y = cy;
        targetCamera.zoom = Math.min(canvas.width, canvas.height) / 780;

        // Periodic handoff transition demo
        handoffTimer++;
        if (handoffTimer > 360) {
          handoffTimer = 0;
          const currentLink = links.find(l => l.target === "AF-0001");
          if (currentLink) {
            const nextOwner = currentLink.source === "Priya" ? "Raj" : "Priya";
            const prevOwner = currentLink.source;
            currentLink.source = nextOwner;
            handoffLabel = `${prevOwner} → ${nextOwner}`;
            handoffProgress = 100;
          }
        }
        
        if (handoffProgress > 0) {
          handoffProgress -= 0.5;
        }

        applyForceSimulation(cx, cy, 1.2, 0.05, 120);

      } else if (activeStep === 1) {
        const priyaNode = nodes.find(n => n.id === "Priya");
        const rajNode = nodes.find(n => n.id === "Raj");
        const mbNode = nodes.find(n => n.id === "AF-0001");

        if (priyaNode && rajNode && mbNode) {
          const midX = (priyaNode.x + rajNode.x) / 2;
          const midY = (priyaNode.y + rajNode.y) / 2;
          targetCamera.x = midX;
          targetCamera.y = midY;
          targetCamera.zoom = 1.35;

          priyaNode.vx += (cx - 160 - priyaNode.x) * 0.05;
          priyaNode.vy += (cy - priyaNode.y) * 0.05;
          rajNode.vx += (cx + 160 - rajNode.x) * 0.05;
          rajNode.vy += (cy - rajNode.y) * 0.05;

          handoffTimer++;
          const cycle = (handoffTimer % 180) / 180;
          links = links.filter(l => l.target !== "AF-0001");
          
          if (cycle < 0.45) {
            mbNode.vx += (priyaNode.x + 60 - mbNode.x) * 0.1;
            mbNode.vy += (priyaNode.y - mbNode.y) * 0.1;
            handoffLabel = "";
          } else if (cycle >= 0.45 && cycle < 0.55) {
            const progress = (cycle - 0.45) / 0.1;
            const targetX = priyaNode.x + 60 + (rajNode.x - 60 - (priyaNode.x + 60)) * progress;
            mbNode.vx += (targetX - mbNode.x) * 0.2;
            mbNode.vy += (cy - mbNode.y) * 0.2;
            handoffLabel = "Priya → Raj";
          } else if (cycle >= 0.55 && cycle < 0.9) {
            mbNode.vx += (rajNode.x - 60 - mbNode.x) * 0.1;
            mbNode.vy += (rajNode.y - mbNode.y) * 0.1;
            handoffLabel = "";
          } else {
            const progress = (cycle - 0.9) / 0.1;
            const targetX = rajNode.x - 60 + (priyaNode.x + 60 - (rajNode.x - 60)) * progress;
            mbNode.vx += (targetX - mbNode.x) * 0.2;
            mbNode.vy += (cy - mbNode.y) * 0.2;
            handoffLabel = "Raj → Priya";
          }
        }
        
        applyForceSimulation(cx, cy, 0.4, 0.01, 100);

      } else if (activeStep === 2) {
        const elena = nodes.find(n => n.id === "Elena");
        const redNode = nodes.find(n => n.id === "AF-0008");

        if (elena && redNode) {
          targetCamera.x = (elena.x + redNode.x) / 2;
          targetCamera.y = (elena.y + redNode.y) / 2;
          targetCamera.zoom = 1.6;

          elena.vx += (cx - 110 - elena.x) * 0.05;
          elena.vy += (cy - elena.y) * 0.05;
          redNode.vx += (cx + 110 - redNode.x) * 0.05;
          redNode.vy += (cy - redNode.y) * 0.05;

          const redLink = links.find(l => l.target === "AF-0008");
          if (redLink) {
            redLink.type = "overdue";
            redLink.length = 80;
          }

          redNode.x += (Math.random() - 0.5) * 1.5;
          redNode.y += (Math.random() - 0.5) * 1.5;
        }

        applyForceSimulation(cx, cy, 0.4, 0.02, 100);

      } else if (activeStep === 3) {
        const projector = nodes.find(n => n.id === "AF-0005");
        
        if (projector) {
          targetCamera.x = projector.x;
          targetCamera.y = projector.y;
          targetCamera.zoom = 1.8;

          links = links.filter(l => l.target !== "AF-0005" && l.source !== "AF-0005");
          projector.vx = 0.8;
          projector.vy = -0.4;
          projector.opacity = 0.5 + Math.sin(Date.now() / 150) * 0.15;
        }

        applyForceSimulation(cx, cy, 0.8, 0.03, 120);

      } else if (activeStep === 4) {
        const raj = nodes.find(n => n.id === "Raj");
        const vikram = nodes.find(n => n.id === "Vikram");
        const tesla = nodes.find(n => n.id === "AF-0004");

        if (raj && vikram && tesla) {
          targetCamera.x = tesla.x;
          targetCamera.y = tesla.y;
          targetCamera.zoom = 1.4;

          handoffTimer++;
          const angle = (handoffTimer * 0.04);
          
          raj.vx += (tesla.x - 120 - raj.x) * 0.05;
          raj.vy += (tesla.y - raj.y) * 0.05;

          const reachDistance = 110 + Math.sin(angle) * 40;
          const targetVikramX = tesla.x + reachDistance;
          vikram.vx += (targetVikramX - vikram.x) * 0.1;
          vikram.vy += (tesla.y - vikram.y) * 0.1;

          const dx = vikram.x - tesla.x;
          const dy = vikram.y - tesla.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            repelForce = (130 - dist) / 20;
            vikram.x += (dx / dist) * repelForce * 5;
            tesla.x -= (dx / dist) * repelForce * 2;
            handoffLabel = "Refusal: Priya has this";
          } else {
            repelForce *= 0.9;
            if (repelForce < 0.05) handoffLabel = "";
          }
        }

        applyForceSimulation(cx, cy, 0.6, 0.04, 130);
      }

      // Smoothly interpolate Camera
      if (prefersReducedMotion) {
        camera.x = targetCamera.x;
        camera.y = targetCamera.y;
        camera.zoom = targetCamera.zoom;
      } else {
        camera.x += (targetCamera.x - camera.x) * 0.08;
        camera.y += (targetCamera.y - camera.y) * 0.08;
        camera.zoom += (targetCamera.zoom - camera.zoom) * 0.08;
      }

      // Draw background - clear rect to allow page color to show through
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply camera transform
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(camera.zoom, camera.zoom);
      ctx.translate(-camera.x, -camera.y);

      // 1. Draw Links (Fiber-optic glow gradients)
      links.forEach(link => {
        const sourceNode = nodes.find(n => n.id === link.source);
        const targetNode = nodes.find(n => n.id === link.target);
        if (!sourceNode || !targetNode) return;

        // Create glowing gradient
        const grad = ctx.createLinearGradient(sourceNode.x, sourceNode.y, targetNode.x, targetNode.y);
        
        if (link.type === "overdue") {
          grad.addColorStop(0, "rgba(192, 57, 43, 0.8)");
          grad.addColorStop(0.5, "rgba(192, 57, 43, 1.0)");
          grad.addColorStop(1, "rgba(192, 57, 43, 0.8)");
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.5;
        } else {
          grad.addColorStop(0, "rgba(228, 228, 225, 0.5)");
          grad.addColorStop(0.5, "rgba(44, 95, 224, 0.4)"); // Faint blue center glow
          grad.addColorStop(1, "rgba(228, 228, 225, 0.5)");
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.0;
        }

        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.stroke();

        // Glowing micro-pulse along active threads
        if (!prefersReducedMotion) {
          const pulsePos = ((Date.now() + (sourceNode.radius * 10)) % 1500) / 1500;
          const px = sourceNode.x + (targetNode.x - sourceNode.x) * pulsePos;
          const py = sourceNode.y + (targetNode.y - sourceNode.y) * pulsePos;
          ctx.beginPath();
          ctx.arc(px, py, link.type === "overdue" ? 3.5 : 2, 0, Math.PI * 2);
          ctx.fillStyle = link.type === "overdue" ? colors.alert : colors.accent;
          ctx.fill();
        }
      });

      // Special Handoff step 1 link rendering
      if (activeStep === 1) {
        const priyaNode = nodes.find(n => n.id === "Priya");
        const rajNode = nodes.find(n => n.id === "Raj");
        const mbNode = nodes.find(n => n.id === "AF-0001");
        
        if (priyaNode && rajNode && mbNode) {
          ctx.beginPath();
          ctx.strokeStyle = colors.hairline;
          ctx.lineWidth = 1.0;
          const dPriya = Math.hypot(mbNode.x - priyaNode.x, mbNode.y - priyaNode.y);
          const dRaj = Math.hypot(mbNode.x - rajNode.x, mbNode.y - rajNode.y);
          
          if (dPriya < dRaj) {
            ctx.moveTo(priyaNode.x, priyaNode.y);
            ctx.lineTo(mbNode.x, mbNode.y);
          } else {
            ctx.moveTo(rajNode.x, rajNode.y);
            ctx.lineTo(mbNode.x, mbNode.y);
          }
          ctx.stroke();
        }
      }

      // Draw Refusal repulsion ring if step 4
      if (activeStep === 4 && repelForce > 0) {
        const tesla = nodes.find(n => n.id === "AF-0004");
        if (tesla) {
          ctx.beginPath();
          ctx.arc(tesla.x, tesla.y, 80 + repelForce * 15, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(192, 57, 43, ${Math.max(0, 0.4 - repelForce * 0.1)})`;
          ctx.lineWidth = 2.0;
          ctx.stroke();
        }
      }

      // 2. Draw Nodes
      nodes.forEach(node => {
        const opacity = node.opacity !== undefined ? node.opacity : 1.0;
        ctx.globalAlpha = opacity;

        if (node.type === "person") {
          // Person Node: Round Avatar with drop shadow feel
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fillStyle = "#FFFFFF";
          ctx.fill();
          
          ctx.strokeStyle = colors.hairline;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Initials text
          ctx.font = "bold 11px 'Inter Tight'";
          ctx.fillStyle = colors.text2;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(node.initials, node.x, node.y);

          // Name label with collision drop shadow text backing
          ctx.font = "500 11px 'Inter Tight'";
          ctx.fillStyle = colors.ink;
          
          // Clear text backing
          ctx.shadowColor = "#FBFBFA";
          ctx.shadowBlur = 4;
          ctx.fillText(node.label, node.x, node.y + node.radius + 14);
          ctx.shadowBlur = 0;

        } else if (node.type === "asset") {
          // Asset Node: Mono stamped Tag Plate
          const width = 64;
          const height = 24;
          const rx = node.x - width / 2;
          const ry = node.y - height / 2;

          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(rx, ry, width, height);
          
          ctx.strokeStyle = node.id === "AF-0008" && activeStep === 2 ? colors.alert : colors.hairline;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(rx, ry, width, height);

          // Draw tag text
          ctx.font = "500 11px 'IBM Plex Mono'";
          ctx.fillStyle = node.id === "AF-0008" && activeStep === 2 ? colors.alert : colors.accent;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(node.label, node.x, node.y);

          // Short name label below
          ctx.font = "400 10px 'Inter Tight'";
          ctx.fillStyle = colors.text3;
          ctx.fillText(node.name || "", node.x, node.y + height/2 + 10);
        }

        ctx.globalAlpha = 1.0;
      });

      // Restore camera transform
      ctx.restore();

      // 3. Draw Screen-Space Labels (e.g. Handoff text floating)
      if (handoffLabel) {
        ctx.font = "500 13px 'Inter Tight'";
        ctx.fillStyle = activeStep === 4 ? colors.alert : colors.accent;
        ctx.textAlign = "center";
        
        ctx.shadowColor = "rgba(255, 255, 255, 0.85)";
        ctx.shadowBlur = 4;
        ctx.fillText(handoffLabel, canvas.width / 2, canvas.height / 2 - 80);
        ctx.shadowBlur = 0;
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    // Helper force simulation math
    const applyForceSimulation = (cx, cy, repelStrength = 1.0, attractionStrength = 0.05, targetLinkLen = 120) => {
      // 1. Repulsion between all nodes (Increased distance and strength to prevent center crowding)
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.hypot(dx, dy) || 1;
          const minDist = 220;
          
          if (dist < minDist) {
            const force = (minDist - dist) * 0.08 * repelStrength;
            n1.vx -= (dx / dist) * force;
            n1.vy -= (dy / dist) * force;
            n2.vx += (dx / dist) * force;
            n2.vy += (dy / dist) * force;
          }
        }
      }

      // 2. Attraction along links
      links.forEach(link => {
        const sourceNode = nodes.find(n => n.id === link.source);
        const targetNode = nodes.find(n => n.id === link.target);
        if (!sourceNode || !targetNode) return;

        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const dist = Math.hypot(dx, dy) || 1;
        const currentTargetLen = link.length || targetLinkLen;
        
        const force = (dist - currentTargetLen) * attractionStrength;
        sourceNode.vx += (dx / dist) * force;
        sourceNode.vy += (dy / dist) * force;
        targetNode.vx -= (dx / dist) * force;
        targetNode.vy -= (dy / dist) * force;
      });

      // 3. Interactive Mouse Repulsion Force (Premium touch)
      if (mouseRef.current.x !== null && mouseRef.current.y !== null && !prefersReducedMotion) {
        // We must translate mouse coordinate space back to scaled camera coordinate space
        // For simplicity: compute vector relative to screen space node position
        nodes.forEach(node => {
          // Calculate screen position: translate relative to center + apply camera scale/offset
          const screenX = (node.x - camera.x) * camera.zoom + canvas.width / 2;
          const screenY = (node.y - camera.y) * camera.zoom + canvas.height / 2;

          const dx = screenX - mouseRef.current.x;
          const dy = screenY - mouseRef.current.y;
          const dist = Math.hypot(dx, dy) || 1;

          if (dist < 140) {
            const force = (140 - dist) * 0.12;
            // Push node in camera coordinate space
            node.vx += (dx / dist) * force * (1 / camera.zoom);
            node.vy += (dy / dist) * force * (1 / camera.zoom);
          }
        });
      }

      // 4. Center gravity to keep constellation together (Softer pull to let nodes expand outward)
      nodes.forEach(node => {
        const dx = cx - node.x;
        const dy = cy - node.y;
        node.vx += dx * 0.0006;
        node.vy += dy * 0.0006;

        node.x += node.vx;
        node.y += node.vy;
        node.vx *= 0.85;
        node.vy *= 0.85;
      });
    };

    if (prefersReducedMotion) {
      for (let k = 0; k < 60; k++) {
        applyForceSimulation(canvas.width / 2, canvas.height / 2, 1, 0.05, 120);
      }
      tick();
    } else {
      tick();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [activeStep, prefersReducedMotion]);

  return <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />;
};
