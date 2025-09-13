import { h } from '../../vdom/createElement';
import { ComponentFunction } from "../../types/global";
import background from '/images/src-image/background.png';

export const Background: ComponentFunction = () => {
    return (
        <div className="fixed inset-0">
            <div className="absolute inset-0 bg-sky-custom"></div>
            <img
                src={background}
                alt="background"
                className="absolute inset-0 w-full h-full object-cover opacity-35"
            />
        </div>
    );
}

