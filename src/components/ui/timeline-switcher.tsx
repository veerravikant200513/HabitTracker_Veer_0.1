'use client';

interface TimelineSwitcherProps {
  view: 'daily' | 'weekly' | 'monthly';
  onViewChange: (view: 'daily' | 'weekly' | 'monthly') => void;
}

export const TimelineSwitcher = ({ view, onViewChange }: TimelineSwitcherProps) => {
  const options = [
    { id: 'daily', label: 'Day' },
    { id: 'weekly', label: 'Week' },
    { id: 'monthly', label: 'Month' },
  ] as const;

  return (
    <div className="flex items-center gap-6">
      {options.map((option) => (
        <div key={option.id} className="relative inline-flex items-center justify-center group">
          {/* Animated Gradient Glow - only show if active OR on hover */}
          <div
            className={`absolute inset-0 duration-1000 transition-all bg-gradient-to-r from-indigo-500 via-pink-500 to-yellow-400 rounded-md blur-lg filter 
              ${view === option.id ? 'opacity-70 duration-200' : 'opacity-0 group-hover:opacity-100 group-hover:duration-200'}`}
          ></div>
          
          <button
            onClick={() => onViewChange(option.id)}
            className={`group relative inline-flex items-center justify-center rounded-md px-6 py-2 text-sm font-bold transition-all duration-200 
              ${view === option.id 
                ? 'bg-gray-800 text-white shadow-lg -translate-y-0.5 shadow-indigo-500/20 scale-105' 
                : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white hover:shadow-lg hover:-translate-y-0.5'}`}
          >
            {option.label}
            
            {/* Arrow SVG - only visible on hover or if active */}
            <svg
              viewBox="0 0 10 10"
              height="10"
              width="10"
              fill="none"
              className={`mt-0.5 ml-2 -mr-1 stroke-2 transition-all ${view === option.id ? 'stroke-white' : 'stroke-gray-400 group-hover:stroke-white'}`}
            >
              <path
                d="M0 5h7"
                className={`transition ${view === option.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              ></path>
              <path
                d="M1 1l4 4-4 4"
                className={`transition ${view === option.id ? 'translate-x-[3px]' : 'group-hover:translate-x-[3px]'}`}
              ></path>
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};
