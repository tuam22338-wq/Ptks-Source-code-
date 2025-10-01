import React, { useState, memo, useMemo } from 'react';
import type { GameDate, MajorEvent, DynamicWorldEvent, ForeshadowedEvent, Season } from '../types';
import { GiScrollUnfurled, GiGalaxy, GiStairsGoal } from 'react-icons/gi';
import { SEASON_ICONS, WEATHER_INFO, TIMEOFDAY_DETAILS, SHICHEN_TO_TIME_MAP } from '../constants';
import { FaQuestionCircle, FaExclamationTriangle, FaMapPin } from 'react-icons/fa';

interface TimelineProps {
  gameDate: GameDate;
  currentLocationName: string;
  majorEvents: MajorEvent[];
  dynamicEvents?: DynamicWorldEvent[];
  foreshadowedEvents?: ForeshadowedEvent[];
}

const EventSection: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div>
        <h3 className="text-center font-title text-xl font-bold flex items-center justify-center gap-2 mb-3 text-[var(--primary-accent-color)]">
            <Icon /> {title}
        </h3>
        <div className="space-y-3">{children}</div>
    </div>
);

const Timeline: React.FC<TimelineProps> = ({ gameDate, currentLocationName, majorEvents, dynamicEvents, foreshadowedEvents }) => {
  const [isEventsVisible, setIsEventsVisible] = useState(false);
  
  const timeOfDayDetails = TIMEOFDAY_DETAILS[gameDate.shichen];
  const weatherDetails = WEATHER_INFO[gameDate.weather];
  
  const totalDays = useMemo(() => {
    return (gameDate.year * 4 * 30) + (['Xuân', 'Hạ', 'Thu', 'Đông'].indexOf(gameDate.season) * 30) + gameDate.day;
  }, [gameDate]);

  const { displayDate, westernTime } = useMemo(() => {
    const seasonIndex = ['Xuân', 'Hạ', 'Thu', 'Đông'].indexOf(gameDate.season);
    const month = seasonIndex > -1 ? seasonIndex + 1 : 1;

    const dd = String(gameDate.day).padStart(2, '0');
    const mm = String(month).padStart(2, '0');
    const yyyy = gameDate.year;

    return {
        displayDate: `${dd}/${mm}/${yyyy}`,
        westernTime: SHICHEN_TO_TIME_MAP[gameDate.shichen] || '00:00'
    };
  }, [gameDate]);

  const activeDynamicEvents = useMemo(() => {
    return (dynamicEvents || []).filter(event => (event.turnStart + event.duration) > totalDays);
  }, [dynamicEvents, totalDays]);

  const activeForeshadowedEvents = useMemo(() => {
    return (foreshadowedEvents || []).filter(event => event.potentialTriggerDay > totalDays);
  }, [foreshadowedEvents, totalDays]);
  
  const CHANCE_STYLES = {
    'Thấp': 'text-gray-400',
    'Vừa': 'text-yellow-400',
    'Cao': 'text-orange-400',
    'Chắc chắn': 'text-red-400',
  };

  return (
    <div 
      className="relative group max-w-lg mx-auto"
      onMouseEnter={() => setIsEventsVisible(true)}
      onMouseLeave={() => setIsEventsVisible(false)}
    >
      <div 
        className="flex justify-center items-center flex-wrap gap-x-3 sm:gap-x-4 gap-y-2 p-2 rounded-full transition-all duration-300"
        style={{boxShadow: 'var(--shadow-pressed)'}}
      >
        <div className="flex items-center text-center gap-x-2 sm:gap-x-3" style={{color: 'var(--text-color)'}}>
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
        <div className="w-px h-8 bg-[var(--shadow-dark)]"></div>
        <div className="text-center font-semibold" style={{color: 'var(--text-color)'}}>
            <p className="text-sm sm:text-base leading-tight">{`${displayDate} (${gameDate.season})`}</p>
            <p className="text-xs sm:text-sm text-[var(--primary-accent-color)] leading-tight">
                {westernTime} ({timeOfDayDetails.name})
            </p>
        </div>
        <div className="w-px h-8 bg-[var(--shadow-dark)] hidden sm:block"></div>
        <div className="text-center font-semibold hidden sm:flex items-center gap-2" title="Vị trí hiện tại" style={{color: 'var(--text-color)'}}>
            <FaMapPin className="text-[var(--secondary-accent-color)]" />
            <p className="text-sm sm:text-base leading-tight truncate max-w-[150px]">{currentLocationName}</p>
        </div>
      </div>
      
      <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[550px] max-w-[90vw] p-4 rounded-xl shadow-2xl transition-all duration-300 ease-in-out ${isEventsVisible ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}
          style={{backgroundColor: 'var(--bg-color)', boxShadow: 'var(--shadow-raised)'}}
      >
        <div className="grid grid-cols-1 gap-6 max-h-[70vh] overflow-y-auto pr-2">
            <EventSection title="Thiên Mệnh Bất Biến" icon={GiScrollUnfurled}>
                {majorEvents.map(event => {
                    const hasPassed = gameDate.year >= event.year;
                    return (
                        <div key={event.title} className={`p-2 rounded-md transition-opacity ${hasPassed ? 'opacity-50' : ''}`} style={{boxShadow: 'var(--shadow-pressed)'}}>
                            <div className="flex justify-between items-baseline">
                                <p className={`font-bold ${hasPassed ? 'text-[var(--text-muted-color)]' : 'text-[var(--text-color)]'}`}>{event.title}</p>
                                <p className={`text-xs font-semibold ${hasPassed ? 'text-[var(--text-muted-color)]' : 'text-[var(--primary-accent-color)]'}`}>Năm {event.year}</p>
                            </div>
                            <p className="text-xs text-[var(--text-muted-color)] mt-1">{event.summary}</p>
                        </div>
                    );
                })}
            </EventSection>

            {activeDynamicEvents.length > 0 && (
                <EventSection title="Thiên Hạ Biến Động" icon={GiGalaxy}>
                    {activeDynamicEvents.map(event => {
                        const remainingDays = (event.turnStart + event.duration) - totalDays;
                        return (
                            <div key={event.id} className="p-2 rounded-md border-l-4 border-red-500/60 animate-fade-in" style={{animationDuration: '500ms', boxShadow: 'var(--shadow-pressed)'}}>
                                <div className="flex justify-between items-baseline">
                                    <p className="font-bold text-[var(--text-color)] flex items-center gap-2"><FaExclamationTriangle className="text-red-400"/>{event.title}</p>
                                    <p className="text-xs font-semibold text-red-300">{remainingDays > 0 ? `Còn ${remainingDays} ngày` : 'Sắp kết thúc'}</p>
                                </div>
                                <p className="text-xs text-[var(--text-muted-color)] mt-1">{event.description}</p>
                            </div>
                        );
                    })}
                </EventSection>
            )}

            {activeForeshadowedEvents.length > 0 && (
                 <EventSection title="Nhân Quả Tương Lai" icon={GiStairsGoal}>
                    {activeForeshadowedEvents.map(event => {
                        const daysUntil = event.potentialTriggerDay - totalDays;
                        const chanceStyle = CHANCE_STYLES[event.chance] || CHANCE_STYLES['Vừa'];
                        return (
                             <div key={event.id} className={`p-2 rounded-md border-l-4 border-purple-500/60 animate-fade-in`} style={{animationDuration: '500ms', boxShadow: 'var(--shadow-pressed)'}}>
                                <div className="flex justify-between items-baseline">
                                    <p className="font-bold text-[var(--text-color)] flex items-center gap-2"><FaQuestionCircle className="text-purple-400"/>{event.title}</p>
                                    <p className={`text-xs font-semibold ${chanceStyle}`}>Nguy cơ: {event.chance}</p>
                                </div>
                                <p className="text-xs text-[var(--text-muted-color)] mt-1 italic">"{event.description}"</p>
                                <p className="text-right text-xs text-purple-300/80 mt-1">Dự kiến trong ~{daysUntil} ngày</p>
                            </div>
                        );
                    })}
                </EventSection>
            )}
        </div>
      </div>
    </div>
  );
};

export default memo(Timeline);