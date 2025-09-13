import React, { useState, memo } from 'react';
import type { GameDate } from '../types';
import { GiScrollUnfurled } from 'react-icons/gi';
import { SHICHEN_LIST, MAJOR_EVENTS, SEASON_ICONS, WEATHER_INFO, TIMEOFDAY_DETAILS } from '../constants';

interface TimelineProps {
  gameDate: GameDate;
}

const Timeline: React.FC<TimelineProps> = ({ gameDate }) => {
  const [isEventsVisible, setIsEventsVisible] = useState(false);
  const timeOfDayDetails = TIMEOFDAY_DETAILS[gameDate.shichen];
  const weatherDetails = WEATHER_INFO[gameDate.weather];

  return (
    <div className="space-y-2">
      <div 
        className="relative group max-w-lg mx-auto"
      >
        <div className="flex justify-center items-center flex-wrap gap-x-3 sm:gap-x-4 gap-y-2 p-2 bg-black/20 rounded-lg border border-gray-700/60 transition-all duration-300">
          
          <div className="flex items-start text-center gap-x-2 sm:gap-x-3 text-gray-300">
            <div className="flex flex-col items-center w-14 sm:w-16" title={`Mùa ${gameDate.season}`}>
                <span className="text-xl sm:text-2xl">{SEASON_ICONS[gameDate.season]}</span>
                <p className="text-[10px] sm:text-xs mt-0.5 leading-tight">{gameDate.season}</p>
            </div>
            <div className="flex flex-col items-center w-14 sm:w-16" title={timeOfDayDetails.name}>
                <span className="text-xl sm:text-2xl">{timeOfDayDetails.icon}</span>
                <p className="text-[10px] sm:text-xs mt-0.5 leading-tight">{timeOfDayDetails.name}</p>
            </div>
            <div className="flex flex-col items-center w-14 sm:w-16" title={weatherDetails.name}>
                <span className="text-xl sm:text-2xl">{weatherDetails.icon}</span>
                <p className="text-[10px] sm:text-xs mt-0.5 leading-tight">{weatherDetails.name}</p>
            </div>
          </div>

          <div className="w-px h-6 bg-gray-600"></div>

          <div 
             className="flex items-center gap-2 cursor-pointer" 
             title="Thiên Mệnh"
             onMouseEnter={() => setIsEventsVisible(true)}
             onMouseLeave={() => setIsEventsVisible(false)}
          >
              <GiScrollUnfurled className="text-amber-300" />
              <span className="font-semibold text-gray-300 text-sm sm:text-base hover:text-amber-200 transition-colors">Thiên Mệnh Đồ</span>
          </div>
          
          <div className="w-px h-6 bg-gray-600 hidden sm:block"></div>

          <div className="font-semibold text-gray-300 text-sm sm:text-base" title="Niên đại">
            {`${gameDate.era} ${gameDate.year}, ${gameDate.season} ngày ${gameDate.day}`}
          </div>
        </div>
        
        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[500px] max-w-[90vw] p-4 bg-black/80 backdrop-blur-sm border border-amber-500/50 rounded-lg shadow-2xl shadow-black/50 transition-all duration-300 ease-in-out ${isEventsVisible ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
          <h3 className="text-center font-title text-xl text-amber-300 mb-3 font-bold">Thiên Mệnh Bất Biến</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {MAJOR_EVENTS.map(event => {
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
                          {!hasPassed && (
                            <p className="text-xs text-red-400/80 mt-1"><strong className="text-red-400">Hệ quả:</strong> {event.consequences}</p>
                          )}
                      </div>
                  )
              })}
          </div>
        </div>
      </div>
      
      <div className="flex justify-center items-center gap-1 p-1 bg-black/20 rounded-full border border-gray-700/60 max-w-lg mx-auto">
        {SHICHEN_LIST.map(shichen => (
            <div
                key={shichen.name}
                title={`Giờ ${shichen.name}`}
                className={`w-8 h-8 flex items-center justify-center text-xl rounded-full transition-all duration-300 ${gameDate.shichen === shichen.name ? 'bg-amber-400/20 text-amber-300 scale-110' : 'text-gray-500'}`}
            >
                {shichen.icon}
            </div>
        ))}
      </div>
    </div>
  );
};

export default memo(Timeline);