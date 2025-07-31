

export function getUser()
{
    // fetch('/api/user')


    return {        username: 'JohnDoe',
        email: 'johndoe@example.com'
    };
}

export const userState = {
    auth:
    {
        isAuthenticated: true,
        token: '',
        userId: ''
    },
    profile: {
        username: '',
        email: '',
        bio: '',
        avatarUrl: ''
    },
    friends: [],
    achievements: [],
    matchHistory: [],
    overview: {
        totalGames: 0,
        totalWins: 0,
        totalLosses: 0,
        winRate: 0,
        totalScore: 0
    }
};