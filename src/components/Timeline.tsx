import React, { useState, memo } from 'react';
import type { GameDate, MajorEvent } from '../types';
import { GiScrollUnfurled } from 'react-icons/gi';
import { SHICHEN_LIST, SEASON_ICONS, WEATHER_INFO, TIMEOFDAY_DETAILS } from '../constants';

interface TimelineProps {
  gameDate: GameDate;
  majorEvents: MajorEvent[];
}

const Timeline: React.FC<TimelineProps> = ({ gameDate, majorEvents }) => {
  const [isEventsVisible, setIsEventsVisible] = useState(false);
  const timeOfDayDetails = TIMEOFDAY_DETAILS[gameDate.shichen];
  const weatherDetails = WEATHER_INFO[gameDate.weather];
  const currentShichen = SHICHEN_LIST.find(s => s.name === gameDate.shichen);

  return (
    <div 
      className="relative group max-w-lg mx-auto"
      onMouseEnter={() => setIsEventsVisible(true)}
      onMouseLeave={() => setIsEventsVisible(false)}
    >
      <div className="flex justify-center items-center flex-wrap gap-x-3 sm:gap-x-4 gap-y-2 p-2 bg-black/20 rounded-lg border border-gray-700/60 transition-all duration-300">
        
        <div className="flex items-center text-center gap-x-2 sm:gap-x-3 text-gray-300">
          <div className="flex flex-col items-center" title={`Mùa ${gameDate.season}`}>
              <span className="text-xl sm:text-2xl">{SEASON_ICONS[gameDate.season]}</span>
          </div>
           <div className="flex flex-col items-center" title={timeOfDayDetails.name}>
                <span className="text-xl sm:text-2xl">{timeOfDayDetails.icon}</span>
            </div>
          <div className="flex flex-col items-center" title={weatherDetails.name}>
              <span className="text-xl sm:text-2xl">{weatherDetails.icon}</span>
          </div>
        </div>

        <div className="w-px h-8 bg-gray-600/70"></div>
        
        <div className="text-center font-semibold text-gray-300">
            <p className="text-sm sm:text-base leading-tight">{`${gameDate.era} ${gameDate.year}, ${gameDate.season} ngày ${gameDate.day}`}</p>
            <p className="text-xs sm:text-sm text-amber-300 leading-tight">
                Giờ {gameDate.shichen} {currentShichen?.icon} ({timeOfDayDetails.name})
            </p>
        </div>
      </div>
      
      <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[500px] max-w-[90vw] p-4 bg-black/80 backdrop-blur-sm border border-amber-500/50 rounded-lg shadow-2xl shadow-black/50 transition-all duration-300 ease-in-out ${isEventsVisible ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
        <h3 className="text-center font-title text-xl text-amber-300 mb-3 font-bold flex items-center justify-center gap-2">
          <GiScrollUnfurled /> Thiên Mệnh Bất Biến
        </h3>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {majorEvents.map(event => {
                const hasPassed = gameDate.year >= event.year;
                return (
                    <div key={event.title} className={`p-2 rounded-md transition-opacity ${hasPassed ? 'opacity-50 bg-gray-800/20' : 'bg-gray-700/30'}`}>
                        <div className="flex justify-between items-baseline">
                            <p className={`font-bold ${hasPassed ? 'text-gray-500' : 'text-gray-200'}`}>
                                {event.title}
                            </p>
                            <p className={`text-xs font-semibold ${hasPassed ? 'text-gray-600' : 'text-amber-300'}`}>
                                Năm {event.year}
                            </p>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{event.summary}</p>
                    </div>
                )
            })}
        </div>
      </div>
    </div>
  );
};

export default memo(Timeline);