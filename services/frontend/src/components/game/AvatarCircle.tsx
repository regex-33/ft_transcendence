import { h } from '../../vdom/createElement';

export const AvatarCircle = ({ avatarImage, key }: { avatarImage: string, key: string }) => (
	<div className="relative w-6 h-6 md:w-11 md:h-11" key={key}>
		<img src="/images/home-assests/cir-offline.svg" className="absolute rounded-full shadow-[inset_0_0_0.4em_0.1em_#434146] inset-0 w-full h-full z-0" />
		<img
			src={avatarImage}
			className="w-[90%] mx-auto rounded-full object-cover z-10"
			alt={`${key}`}
		/>
	</div>
);