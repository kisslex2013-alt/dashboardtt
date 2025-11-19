/**
 * Компонент логотипа приложения с анимацией Data Pulse
 */
export function AppLogo() {
  return (
    <div className="flex-shrink-0 logo-wrapper logo-animation-1">
      <svg
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        className="w-8 h-8 sm:w-12 sm:h-12 object-contain logo-data-pulse"
        aria-label="Time Tracker Logo"
      >
        <defs>
          <linearGradient id="grad4-v1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#10B981', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#F59E0B', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        {/* Концентрические круги - пульсируют */}
        <circle
          className="circle-1"
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          opacity="0.2"
        >
          <animate attributeName="r" values="90;100;90" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.4;0.2" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle
          className="circle-2"
          cx="100"
          cy="100"
          r="75"
          fill="none"
          stroke="#10B981"
          strokeWidth="2"
          opacity="0.3"
        >
          <animate attributeName="r" values="75;85;75" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.5;0.3" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <circle
          className="circle-3"
          cx="100"
          cy="100"
          r="60"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="2"
          opacity="0.4"
        >
          <animate attributeName="r" values="60;70;60" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.6;0.4" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <circle
          className="circle-4"
          cx="100"
          cy="100"
          r="45"
          fill="url(#grad4-v1)"
          opacity="0.2"
        >
          <animate attributeName="r" values="45;55;45" dur="2.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.4;0.2" dur="2.6s" repeatCount="indefinite" />
        </circle>
        {/* Пульс (волна данных) - анимация как в реальном ECG */}
        <path
          className="pulse-path"
          d="M 30 100 L 50 100 L 60 70 L 70 130 L 80 100 L 100 100 L 110 85 L 120 115 L 130 100 L 150 100 L 170 100"
          fill="none"
          stroke="url(#grad4-v1)"
          strokeWidth="4"
          strokeLinecap="round"
        >
          <animate
            attributeName="d"
            values="M 30 100 L 50 100 L 60 70 L 70 130 L 80 100 L 100 100 L 110 85 L 120 115 L 130 100 L 150 100 L 170 100;M 30 100 L 50 100 L 60 65 L 70 135 L 80 100 L 100 100 L 110 80 L 120 120 L 130 100 L 150 100 L 170 100;M 30 100 L 50 100 L 60 60 L 70 140 L 80 100 L 100 100 L 110 75 L 120 125 L 130 100 L 150 100 L 170 100;M 30 100 L 50 100 L 60 65 L 70 135 L 80 100 L 100 100 L 110 80 L 120 120 L 130 100 L 150 100 L 170 100;M 30 100 L 50 100 L 60 70 L 70 130 L 80 100 L 100 100 L 110 85 L 120 115 L 130 100 L 150 100 L 170 100"
            dur="1.2s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1"
          />
        </path>
        {/* Точки на пульсе - вращаются по циферблату с разной скоростью */}
        <g className="pulse-dot-group-1" transform="translate(100, 100)">
          <circle className="pulse-dot" cx="0" cy="-35" r="4" fill="#3B82F6" />
        </g>
        <g className="pulse-dot-group-2" transform="translate(100, 100)">
          <circle className="pulse-dot" cx="0" cy="-30" r="4" fill="#10B981" />
        </g>
        <g className="pulse-dot-group-3" transform="translate(100, 100)">
          <circle className="pulse-dot" cx="0" cy="-25" r="4" fill="#F59E0B" />
        </g>
        <g className="pulse-dot-group-4" transform="translate(100, 100)">
          <circle className="pulse-dot" cx="0" cy="-20" r="4" fill="#10B981" />
        </g>
        {/* Стрелки часов - часовая и минутная */}
        <circle
          className="center-circle"
          cx="100"
          cy="100"
          r="15"
          fill="none"
          stroke="#3B82F6"
          strokeWidth="3"
        />
        <g transform="translate(100, 100)">
          {/* Часовая стрелка - толще, короче, медленнее */}
          <g className="hour-hand">
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-25"
              stroke="#3B82F6"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </g>
          {/* Минутная стрелка - тоньше, длиннее, быстрее */}
          <g className="minute-hand">
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-40"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        </g>
        <circle className="center-dot" cx="100" cy="100" r="3" fill="#F59E0B" />
      </svg>
    </div>
  )
}

