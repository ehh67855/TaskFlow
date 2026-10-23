import React, { useState } from 'react';
import { Star } from 'lucide-react';

// 1-5 star picker. 0 means "not set" (what the backend stores for a rating that was never
// chosen) - clicking the currently selected star clears it back to 0.
export default function RatingInput({ value, onChange, label, max = 5 }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label={label}>
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} of ${max}`}
          className="p-0.5 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(value === n ? 0 : n)}
        >
          <Star
            size={18}
            className={n <= shown ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}
          />
        </button>
      ))}
    </div>
  );
}
