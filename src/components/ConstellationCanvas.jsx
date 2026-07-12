import React, { useRef, useEffect } from "react";

export const ConstellationCanvas = ({ activeStep = 0, prefersReducedMotion = false }) => {
  const canvasRef = useRef(null);

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

    // Color tokens
    const colors = {
      canvasBg: "#FBFBFA",
      ink: "#18181B",
      text2: "#52525B",
      text3: "#8E8E93",
      hairline: "#E4E4E1",
      accent: "#2C5FE0",
      accentSoft: "rgba(44, 95, 224, 0.1)",
      alert: "#C0392B",
      alertSoft: "rgba(192, 57, 43, 0.1)"
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
        node.x = cx + (Math.random() - 0.5) * 400;
        node.y = cy + (Math.random() - 0.5) * 400;
      });

      links = [
        { source: "Priya", target: "AF-0001", type: "normal", length: 120, label: "" },
        { source: "Raj", target: "AF-0002", type: "normal", length: 120, label: "" },
        { source: "Vikram", target: "AF-0004", type: "normal", length: 140, label: "" },
        { source: "Elena", target: "AF-0008", type: "normal", length: 120, label: "" }
      ];
    };

    initConstellation();

    // Handoff state simulation variables
    let handoffTimer = 0;
    let handoffLabel = "";
    let handoffProgress = 0;
    let snapTension = 1.0;
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
        // Step 0: Ambient breathing constellation
        targetCamera.x = cx;
        targetCamera.y = cy;
        targetCamera.zoom = Math.min(canvas.width, canvas.height) / 800; // auto zoom based on screen size

        // Periodic handoff transition demo
        handoffTimer++;
        if (handoffTimer > 360) { // every 6 seconds
          handoffTimer = 0;
          
          // Randomly transfer AF-0001 between Priya and Raj
          const currentLink = links.find(l => l.target === "AF-0001");
          if (currentLink) {
            const nextOwner = currentLink.source === "Priya" ? "Raj" : "Priya";
            const prevOwner = currentLink.source;
            
            // Animation trigger: break previous link, float node, establish new
            currentLink.source = nextOwner;
            handoffLabel = `${prevOwner} → ${nextOwner}`;
            handoffProgress = 100;
          }
        }
        
        // Decay handoff label opacity
        if (handoffProgress > 0) {
          handoffProgress -= 0.5;
        }

        // Neutral layout forces
        applyForceSimulation(cx, cy, 1.2, 0.05, 120);

      } else if (activeStep === 1) {
        // Step 1: Handoff close-up (Priya -> AF-0001 -> Raj)
        // Zoom and focus on Priya, Raj and MacBook
        const priyaNode = nodes.find(n => n.id === "Priya");
        const rajNode = nodes.find(n => n.id === "Raj");
        const mbNode = nodes.find(n => n.id === "AF-0001");

        if (priyaNode && rajNode && mbNode) {
          const midX = (priyaNode.x + rajNode.x) / 2;
          const midY = (priyaNode.y + rajNode.y) / 2;
          targetCamera.x = midX;
          targetCamera.y = midY;
          targetCamera.zoom = 1.3;

          // Pull Priya and Raj into horizontal position
          priyaNode.vx += (cx - 150 - priyaNode.x) * 0.05;
          priyaNode.vy += (cy - priyaNode.y) * 0.05;
          rajNode.vx += (cx + 150 - rajNode.x) * 0.05;
          rajNode.vy += (cy - rajNode.y) * 0.05;

          // Animate MB drifting from Priya to Raj and back
          handoffTimer++;
          const cycle = (handoffTimer % 180) / 180; // 3 seconds cycle
          
          // Break link rendering to let us animate it manually
          links = links.filter(l => l.target !== "AF-0001");
          
          if (cycle < 0.45) {
            // MB tethered to Priya
            mbNode.vx += (priyaNode.x + 60 - mbNode.x) * 0.1;
            mbNode.vy += (priyaNode.y - mbNode.y) * 0.1;
            handoffLabel = "";
          } else if (cycle >= 0.45 && cycle < 0.55) {
            // MB crossing mid air
            const progress = (cycle - 0.45) / 0.1;
            const targetX = priyaNode.x + 60 + (rajNode.x - 60 - (priyaNode.x + 60)) * progress;
            mbNode.vx += (targetX - mbNode.x) * 0.2;
            mbNode.vy += (cy - mbNode.y) * 0.2;
            handoffLabel = "Priya → Raj";
          } else if (cycle >= 0.55 && cycle < 0.9) {
            // MB tethered to Raj
            mbNode.vx += (rajNode.x - 60 - mbNode.x) * 0.1;
            mbNode.vy += (rajNode.y - mbNode.y) * 0.1;
            handoffLabel = "";
          } else {
            // MB crossing back
            const progress = (cycle - 0.9) / 0.1;
            const targetX = rajNode.x - 60 + (priyaNode.x + 60 - (rajNode.x - 60)) * progress;
            mbNode.vx += (targetX - mbNode.x) * 0.2;
            mbNode.vy += (cy - mbNode.y) * 0.2;
            handoffLabel = "Raj → Priya";
          }
        }
        
        applyForceSimulation(cx, cy, 0.4, 0.01, 100);

      } else if (activeStep === 2) {
        // Step 2: Overdue tension (Elena and Red Komodo)
        const elena = nodes.find(n => n.id === "Elena");
        const redNode = nodes.find(n => n.id === "AF-0008");

        if (elena && redNode) {
          targetCamera.x = (elena.x + redNode.x) / 2;
          targetCamera.y = (elena.y + redNode.y) / 2;
          targetCamera.zoom = 1.6;

          // Pull them slightly apart but make the link turn red and pull taut
          elena.vx += (cx - 100 - elena.x) * 0.05;
          elena.vy += (cy - elena.y) * 0.05;
          redNode.vx += (cx + 100 - redNode.x) * 0.05;
          redNode.vy += (cy - redNode.y) * 0.05;

          // Find the link between Elena and Red Komodo
          const redLink = links.find(l => l.target === "AF-0008");
          if (redLink) {
            redLink.type = "overdue";
            redLink.length = 80; // Pulling tight!
          }

          // Add a vibration/jitter to the red node to represent physical tension
          redNode.x += (Math.random() - 0.5) * 1.5;
          redNode.y += (Math.random() - 0.5) * 1.5;
        }

        applyForceSimulation(cx, cy, 0.4, 0.02, 100);

      } else if (activeStep === 3) {
        // Step 3: Snap Lost (AF-0006 - Projector/iPad)
        // Focus on Epson projector drifting untethered
        const projector = nodes.find(n => n.id === "AF-0005");
        
        if (projector) {
          targetCamera.x = projector.x;
          targetCamera.y = projector.y;
          targetCamera.zoom = 1.8;

          // Snap link (remove it from links)
          links = links.filter(l => l.target !== "AF-0005" && l.source !== "AF-0005");

          // Let projector drift off with constant slow speed
          projector.vx = 0.8;
          projector.vy = -0.4;
          
          // Animate fading/flicker
          projector.opacity = 0.5 + Math.sin(Date.now() / 150) * 0.15;
        }

        applyForceSimulation(cx, cy, 0.8, 0.03, 120);

      } else if (activeStep === 4) {
        // Step 4: Refusal Repel (Raj & Vikram pull on Tesla Model 3)
        const raj = nodes.find(n => n.id === "Raj");
        const vikram = nodes.find(n => n.id === "Vikram");
        const tesla = nodes.find(n => n.id === "AF-0004");

        if (raj && vikram && tesla) {
          targetCamera.x = tesla.x;
          targetCamera.y = tesla.y;
          targetCamera.zoom = 1.4;

          // Animate them coming close and repelling
          handoffTimer++;
          const angle = (handoffTimer * 0.04);
          
          // Raj moves in, Tesla repels Vikram
          raj.vx += (tesla.x - 120 - raj.x) * 0.05;
          raj.vy += (tesla.y - raj.y) * 0.05;

          // Make Vikram reach for Tesla, then get pushed back violently
          const reachDistance = 110 + Math.sin(angle) * 40;
          const targetVikramX = tesla.x + reachDistance;
          vikram.vx += (targetVikramX - vikram.x) * 0.1;
          vikram.vy += (tesla.y - vikram.y) * 0.1;

          // When Vikram gets too close, render a "Refusal Alert" repelling force wave
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

      // Draw background
      ctx.fillStyle = colors.canvasBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Apply camera transform
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(camera.zoom, camera.zoom);
      ctx.translate(-camera.x, -camera.y);

      // 1. Draw Links (hairline threads)
      links.forEach(link => {
        const sourceNode = nodes.find(n => n.id === link.source);
        const targetNode = nodes.find(n => n.id === link.target);
        if (!sourceNode || !targetNode) return;

        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);

        if (link.type === "overdue") {
          ctx.strokeStyle = colors.alert;
          ctx.lineWidth = 1.5;
        } else {
          ctx.strokeStyle = colors.hairline;
          ctx.lineWidth = 1.0;
        }
        ctx.stroke();

        // If step 2 (overdue tension), draw red energy pulses along the line
        if (link.type === "overdue" && !prefersReducedMotion) {
          const pulsePos = (Date.now() % 1000) / 1000;
          const px = sourceNode.x + (targetNode.x - sourceNode.x) * pulsePos;
          const py = sourceNode.y + (targetNode.y - sourceNode.y) * pulsePos;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = colors.alert;
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
          // Determine who it is currently closer to
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
          // Person Node: Round Avatar + Label Below
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fillStyle = colors.canvasBg;
          ctx.fill();
          ctx.strokeStyle = colors.text3;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Initials text
          ctx.font = "bold 11px 'Inter Tight'";
          ctx.fillStyle = colors.text2;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(node.initials, node.x, node.y);

          // Name label below
          ctx.font = "500 11px 'Inter Tight'";
          ctx.fillStyle = colors.ink;
          ctx.fillText(node.label, node.x, node.y + node.radius + 14);

        } else if (node.type === "asset") {
          // Asset Node: Mono stamped Tag Plate
          const width = 64;
          const height = 24;
          const rx = node.x - width / 2;
          const ry = node.y - height / 2;

          // Draw plate
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
        
        ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
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
      // 1. Repulsion between all nodes
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.hypot(dx, dy) || 1;
          const minDist = n1.radius + n2.radius + 60;
          
          if (dist < minDist) {
            const force = (minDist - dist) * 0.04 * repelStrength;
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

      // 3. Center gravity to keep constellation together
      nodes.forEach(node => {
        const dx = cx - node.x;
        const dy = cy - node.y;
        node.vx += dx * 0.003;
        node.vy += dy * 0.003;

        // Apply friction and move
        node.x += node.vx;
        node.y += node.vy;
        node.vx *= 0.82;
        node.vy *= 0.82;
      });
    };

    // Trigger initial render
    if (prefersReducedMotion) {
      // Just run simulation a few times static and draw once
      for (let k = 0; k < 60; k++) {
        applyForceSimulation(canvas.width / 2, canvas.height / 2, 1, 0.05, 120);
      }
      tick(); // Draw one frame
    } else {
      tick();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [activeStep, prefersReducedMotion]);

  return <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />;
};
