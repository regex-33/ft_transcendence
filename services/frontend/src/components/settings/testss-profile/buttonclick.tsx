// Replace your existing profile div with this clickable version:

const handleProfileClick = (username: string, e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Navigate to the user's profile
    window.history.pushState({}, "", `/profile/${username}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
  
  // In your JSX, wrap the profile section with a clickable element:
  <div 
    className="relative w-[100px] h-[100px] flex-shrink-0 mt-10 cursor-pointer hover:scale-105 transition-transform duration-200"
    onClick={(e: Event) => handleProfileClick(friend.username, e)}
  >
    {friend.status === 'friend' ? (
      <div
        className="relative w-24 h-24 flex items-center justify-center bg-no-repeat bg-contain"
        style={{
          backgroundImage: friend.online
            ? 'url("/images/home-assests/cir-online.svg")'
            : 'url("/images/home-assests/cir-offline.svg")'
        }}
      >
        <img
          src={friend.avatar}
          className="w-[70px] h-[70px] rounded-full object-cover relative"
          alt="Avatar"
        />
      </div>
    ) : (
      <img
        src={friend.avatar}
        className="w-full h-full rounded-full object-cover border-4 border-white/30"
        alt="Avatar"
      />
    )}
  </div>