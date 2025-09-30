import { useState } from '../../hooks/useState';
import { VNode } from '../../types/global';
import { h } from '../../vdom/createElement';

export const useToast = (): [Function, VNode] => {
	const [toast, setToast] = useState({
		show: false,
		content: "",
		type: 'info'
	});
	const showToast = (content: string, type = 'info', delay = 2000) => {
		setToast({
			show: true,
			content: content,
			type
		});
		setTimeout(() => {
			setToast({ show: false, content: "", type });
		}, delay);
	}

	let bgColor: string;
	switch (toast?.type) {
		case "info":
			bgColor = "bg-blue-400";
			break;
		case "error":
			bgColor = "bg-red-400";
			break;
		default:
			bgColor = "bg-blue-400";
			break;
	}
	return [showToast, toast ? (
		<div
			class={(toast.show ? "fixed" : "hidden") + " z-[99999] bottom-10 left-1/2 transform -translate-x-1/2 " + bgColor + " text-white px-6 py-3 rounded shadow-lg translate-y-4 pointer-events-none"}
		>
			{toast.content}
		</div>) : <div></div>];
}
