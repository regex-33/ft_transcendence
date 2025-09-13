import background from '../src-image/background.png';
export default function Background() {
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