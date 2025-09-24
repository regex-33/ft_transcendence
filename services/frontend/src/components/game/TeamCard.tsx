import { h } from '../../vdom/createElement';
import { AvatarCircle } from './AvatarCircle';

export type Player = {
	name: string,
	id: string,
	avatarImage: string,
};

export const TeamCard = ({ players }: { players: Player[] }) => {
	return (
		<div className="landscape:hidden md:landscape:inline-flex flex-row gap-x-2 md:flex-col h-full md:gap-y-3 px-2 py-2 md:py-4 bg-blue-200 bg-opacity-20 rounded-lg">
			{players.map(player => (
				<AvatarCircle avatarImage={player.avatarImage} key={player.id} />
			))}
		</div>
	);
}

