import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface CalendarWidgetProps {
    selectedDate: string;
    onDateSelect: (date: string) => void;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ selectedDate, onDateSelect }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        if (selectedDate) {
            // setCurrentDate(new Date(selectedDate)); // Optional: sync view with selection
        }
    }, [selectedDate]);

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay(); // 0 = Sunday
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevYear = () => {
        setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));
    };

    const nextYear = () => {
        setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    // Adjust for Monday start (0=Mon, 6=Sun) - Standard JS is 0=Sun.
    const firstDayIndex = (firstDay + 6) % 7;

    const monthNames = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];

    const days = [];
    // Empty slots
    for (let i = 0; i < firstDayIndex; i++) {
        days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }
    // Days
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isSelected = selectedDate === dateStr;
        const isToday = new Date().toISOString().split('T')[0] === dateStr;

        // Calculate day of week (0=Sun, 6=Sat)
        const dayOfWeek = new Date(year, month, d).getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        days.push(
            <button
                key={d}
                onClick={() => onDateSelect(dateStr)}
                className={`h-10 w-10 rounded-full flex items-center justify-center text-sm transition-all bg-white dark:bg-gray-700 border border-transparent
                    ${isSelected
                        ? '!bg-blue-100 text-blue-600 font-bold'
                        : `hover:bg-gray-100 dark:hover:bg-gray-600 ${isWeekend ? 'text-red-500 font-semibold' : 'text-gray-700 dark:text-gray-300'}`
                    }
                    ${isToday && !isSelected ? 'text-blue-500 font-bold underline decoration-2 underline-offset-4' : ''}
                `}
            >
                {d}
            </button>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 h-fit">
            <h3 className="text-center font-bold text-gray-800 dark:text-white mb-6 uppercase text-sm tracking-wider">Seleccionar Fecha</h3>

            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-1">
                    <button onClick={prevYear} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 bg-transparent transition-colors" title="Año Anterior">
                        <ChevronsLeft size={18} />
                    </button>
                    <button onClick={prevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 bg-transparent transition-colors" title="Mes Anterior">
                        <ChevronLeft size={18} />
                    </button>
                </div>

                <span className="font-bold text-gray-800 dark:text-white capitalize text-sm">
                    {monthNames[month]} {year}
                </span>

                <div className="flex gap-1">
                    <button onClick={nextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 bg-transparent transition-colors" title="Mes Siguiente">
                        <ChevronRight size={18} />
                    </button>
                    <button onClick={nextYear} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 bg-transparent transition-colors" title="Año Siguiente">
                        <ChevronsRight size={18} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map((day, idx) => (
                    <div key={day} className={`text-[10px] font-bold py-2 ${idx >= 5 ? 'text-red-400' : 'text-gray-400'}`}>
                        {day}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1 place-items-center">
                {days}
            </div>
        </div>
    );
};

export default CalendarWidget;
