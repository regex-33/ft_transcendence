import { h } from '../../vdom/createElement';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';
import { useState } from '../../hooks/useState';
import { useRef } from '../../hooks/useRef';



export const NotificationButton: ComponentFunction = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ShawChat, SetShawChat] = useState(false);

  const handleButtonClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
   
  };

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={handleButtonClick}
        className="flex items-center gap-2 md:px-3 py-1 overflow-hidden whitespace-nowrap transition-transform duration-200 hover:scale-95"
      >
        <img src="/images/home-assests/notif-icon.svg" alt="notif" className="w-6 h-6 md:w-10 md:h-10" />
      </button>
    </div>
  );
};