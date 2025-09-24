import { ComponentFunction } from "../../../types/global";
import { h } from "../../../vdom/createElement";

export const NotFound: ComponentFunction = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#183850] to-[#20474e]">
      <div className="flex flex-row items-center bg-[#223c47] rounded-2xl shadow-2xl p-10 max-w-2xl w-full">
        {/* Text Section */}
        <div className="flex-1 pr-8">
          <h1 className="text-7xl font-extrabold text-[#29b6f6] mb-2 drop-shadow-lg">404</h1>
          <div className="text-2xl font-semibold mb-2 text-white">Page Not Found</div>
          <div className="text-base text-[#b0bec5] mb-6 text-left max-w-md">
            Sorry, the page you’re looking for doesn’t exist or has been moved.
          </div>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-8 py-2 bg-[#29b6f6] text-white rounded-lg shadow font-bold text-base transition hover:bg-[#0288d1] focus:outline-none focus:ring-2 focus:ring-[#0288d1] focus:ring-opacity-50"
          >
            BACK TO HOME
          </button>
        </div>
        <div className="flex-1 flex justify-center items-center">
          <img
            src="/images/fish.svg"
            alt="404 Page Not Found"
            className="w-44 h-44 object-contain drop-shadow-xl"
          />
        </div>
      </div>
    </div>
  );
};
