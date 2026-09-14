import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  buildMonthGrid,
  formatMonthTitle,
  getWeekdayLabels,
  isDateInRange,
  isSameDay,
  startOfDay,
} from '../../lib/billing';

function shiftMonth(year, month, delta) {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

function MonthGrid({ year, month, rangeStart, rangeEnd, onSelectDate }) {
  const cells = buildMonthGrid(year, month);
  const today = startOfDay(new Date());
  const weekdays = getWeekdayLabels();

  return (
    <div className="flex-1 min-w-0">
      <div className="grid grid-cols-7 mb-2">
        {weekdays.map((day) => (
          <div key={day} className="text-center text-xs text-muted-foreground py-1">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map(({ date, inMonth }) => {
          const selected = isSameDay(date, rangeStart) || isSameDay(date, rangeEnd);
          const inRange = rangeStart && rangeEnd && isDateInRange(date, rangeStart, rangeEnd);
          const isToday = isSameDay(date, today);

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onSelectDate(startOfDay(date))}
              className={cn(
                'h-9 w-full text-sm rounded-full transition-colors touch-manipulation',
                inMonth ? 'text-foreground' : 'text-muted-foreground/45',
                inRange && !selected && 'bg-primary/10',
                selected && 'ring-2 ring-primary text-primary font-semibold',
                !selected && isToday && inMonth && 'text-primary',
                'hover:bg-white/5'
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function PeriodCalendar({
  leftYear,
  leftMonth,
  rangeStart,
  rangeEnd,
  onSelectDate,
  onShift,
}) {
  const right = shiftMonth(leftYear, leftMonth, 1);

  return (
    <div className="mt-3 rounded-2xl border border-border bg-[#1a1c22] p-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          type="button"
          onClick={() => onShift(-1)}
          className="p-2 text-muted-foreground hover:text-foreground touch-manipulation"
          aria-label="Mês anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-6 text-center">
          <p className="text-sm font-semibold text-foreground">{formatMonthTitle(leftYear, leftMonth)}</p>
          <p className="text-sm font-semibold text-foreground">
            {formatMonthTitle(right.year, right.month)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onShift(1)}
          className="p-2 text-muted-foreground hover:text-foreground touch-manipulation"
          aria-label="Próximo mês"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        <MonthGrid
          year={leftYear}
          month={leftMonth}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onSelectDate={onSelectDate}
        />
        <MonthGrid
          year={right.year}
          month={right.month}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onSelectDate={onSelectDate}
        />
      </div>
    </div>
  );
}
