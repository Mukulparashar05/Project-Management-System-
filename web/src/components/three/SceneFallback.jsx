/**
 * Static 2D rendition of the 3D scene (projects → tasks → progress).
 * Shown while the 3D bundle loads, when WebGL is unavailable, or if the scene fails.
 */
const projects = [
  { x: 120, y: 150, w: 92, h: 150, progress: 0.35, tasks: [[40, 120], [52, 205], [70, 278]] },
  { x: 255, y: 95, w: 110, h: 200, progress: 0.7, tasks: [[395, 120], [410, 200], [390, 280]] },
  { x: 410, y: 175, w: 88, h: 130, progress: 1, tasks: [[520, 160], [535, 240]] },
];

function ProgressArc({ cx, cy, radius, progress }) {
  const circumference = 2 * Math.PI * radius;
  return (
    <g transform={`rotate(-90 ${cx} ${cy})`}>
      <circle cx={cx} cy={cy} r={radius} stroke="rgb(255 255 255 / 0.08)" strokeWidth="3" fill="none" />
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke="url(#fallback-progress)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${circumference * progress} ${circumference}`}
      />
    </g>
  );
}

export function SceneFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <svg viewBox="0 0 600 420" className="h-full max-h-[34rem] w-full max-w-3xl" aria-hidden="true">
        <defs>
          <linearGradient id="fallback-block" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2a3042" />
            <stop offset="1" stopColor="#11141c" />
          </linearGradient>
          <linearGradient id="fallback-progress" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#a5b4fc" />
            <stop offset="1" stopColor="#67e8f9" />
          </linearGradient>
          <radialGradient id="fallback-glow">
            <stop offset="0" stopColor="#6366f1" stopOpacity="0.35" />
            <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="300" cy="230" rx="260" ry="170" fill="url(#fallback-glow)" />
        {projects.map((project) => {
          const centerX = project.x + project.w / 2;
          const centerY = project.y + project.h / 2;
          return (
            <g key={project.x}>
              {project.tasks.map(([taskX, taskY]) => (
                <g key={`${taskX}-${taskY}`}>
                  <line
                    x1={centerX}
                    y1={centerY}
                    x2={taskX + 12}
                    y2={taskY + 12}
                    stroke="rgb(165 180 252 / 0.25)"
                    strokeWidth="1"
                  />
                  <rect
                    x={taskX}
                    y={taskY}
                    width="24"
                    height="24"
                    rx="6"
                    fill={project.progress === 1 ? 'rgb(103 232 249 / 0.35)' : 'rgb(255 255 255 / 0.07)'}
                    stroke="rgb(255 255 255 / 0.18)"
                  />
                </g>
              ))}
              <rect
                x={project.x}
                y={project.y}
                width={project.w}
                height={project.h}
                rx="18"
                fill="url(#fallback-block)"
                stroke="rgb(255 255 255 / 0.14)"
              />
              <ProgressArc cx={centerX} cy={project.y - 26} radius={14} progress={project.progress} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
