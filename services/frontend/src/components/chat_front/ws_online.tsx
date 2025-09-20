import { useRef } from '../../hooks/useRef';
import { ComponentFunction } from "../../types/global";
import { useEffect } from "../../hooks/useEffect";
import { h } from '../../vdom/createElement';

export const Wsonline: ComponentFunction = () => {
    const socket = useRef<WebSocket | null>(null);
    const heartbeatInterval = useRef<number | null>(null);

    useEffect(() => {
        socket.current = new WebSocket('ws://localhost:8001/api/users/online-tracker');
        
        socket.current.onopen = async () => {
        console.log("WebSocket for online chat connected");

        heartbeatInterval.current = setInterval(() => {
          }, 30000);
        };
        socket.current.onmessage = (event) => {
            return;
        };
    
        socket.current.onclose = () => console.log('Disconnected from server');
        socket.current.onerror = (error) => console.log('WebSocket error', error);
    
        return () => {
          if (heartbeatInterval.current) {
            clearInterval(heartbeatInterval.current);
          }
          socket.current?.close();
        };
      }, []);
    return(
        <div>
            <h2>hello</h2>
        </div>
      );
}
