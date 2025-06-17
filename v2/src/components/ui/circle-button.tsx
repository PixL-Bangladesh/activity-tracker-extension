import type * as React from "react";
import { cn } from "~/lib/utils";
import { Button } from "./button";

interface CircleButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	diameter: number;
	onClick?: () => void;
	children?: React.ReactNode;
	title?: string;
}

export function CircleButton({
	diameter,
	onClick,
	children,
	title,
	className,
	disabled,
	...props
}: CircleButtonProps) {
	return (
		<Button
			type="button"
			variant="ghost"
			onClick={onClick}
			title={title}
			className={cn(
				"rounded-full text-center bg-gray-100 box-content",
				className,
			)}
			style={{
				width: `${diameter}rem`,
				height: `${diameter}rem`,
				padding: `${diameter / 2}rem`,
			}}
			{...props}
			disabled={disabled}
		>
			{children}
		</Button>
	);
}
