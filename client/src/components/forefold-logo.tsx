const ForeFoldLogo = ({ className = "h-8 w-8" }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(50,50)">
        {/* Blue spinning wheel segments */}
        <path
          d="M 0,-35 L 20,-20 L 0,-5 Z"
          fill="#4338ca"
          transform="rotate(0)"
        />
        <path
          d="M 0,-35 L 20,-20 L 0,-5 Z"
          fill="#4338ca"
          transform="rotate(45)"
        />
        <path
          d="M 0,-35 L 20,-20 L 0,-5 Z"
          fill="#4338ca"
          transform="rotate(90)"
        />
        <path
          d="M 0,-35 L 20,-20 L 0,-5 Z"
          fill="#4338ca"
          transform="rotate(135)"
        />
        <path
          d="M 0,-35 L 20,-20 L 0,-5 Z"
          fill="#4338ca"
          transform="rotate(180)"
        />
        <path
          d="M 0,-35 L 20,-20 L 0,-5 Z"
          fill="#4338ca"
          transform="rotate(225)"
        />
        <path
          d="M 0,-35 L 20,-20 L 0,-5 Z"
          fill="#4338ca"
          transform="rotate(270)"
        />
        <path
          d="M 0,-35 L 20,-20 L 0,-5 Z"
          fill="#4338ca"
          transform="rotate(315)"
        />
      </g>
    </svg>
  );
};

export default ForeFoldLogo;