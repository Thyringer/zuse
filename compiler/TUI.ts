
//

enum ANSIColor {
	Reset = 0,
	// TEXT COLORS (foreground)
	Black = 30,
	Red = 31,
	Green = 32,
	Yellow = 33,
	Blue = 34,
	Magenta = 35,
	Cyan = 36,
	White = 37,

	BrightBlack = 90,
	BrightRed = 91,
	BrightGreen = 92,
	BrightYellow = 93,
	BrightBlue = 94,
	BrightMagenta = 95,
	BrightCyan = 96,
	BrightWhite = 97,

	// BACKGROUND COLORS
	BgBlack = 40,
	BgRed = 41,
	BgGreen = 42,
	BgYellow = 43,
	BgBlue = 44,
	BgMagenta = 45,
	BgCyan = 46,
	BgWhite = 47,
}


/** Central definition of the color scheme for a uniform style in all CLI outputs. */
export enum Style {
	Reset = 0,
	Comment = ANSIColor.BrightBlack,
	Error = ANSIColor.BrightRed,
	ReservedSymbol = ANSIColor.BrightBlue,
	Namespace = ANSIColor.Cyan,
	String = ANSIColor.Green
} 


//

export function bold(_: any): string {
	return `\x1b[1m${_}\x1b[0m`;
}


export function color(
	text: string,
	color_before: Style = Style.Reset,
	color_after: Style = Style.Reset
): string {
	return `\x1b[${color_before}m${text}\x1b[${color_after}m`; // Reset with \x1b[0m
}


// SEMANTIC COLORINGS

color.comment = function(_: any): string {
	return `\x1b[${Style.Comment}m${_}\x1b[0m\x1b[0m`;
}


color.error = function(_: any): string {
	return `\x1b[${Style.Error}m${bold(_)}\x1b[0m\x1b[0m`;
}


color.reserved_symbol = function(_: any): string {
	return `\x1b[${Style.ReservedSymbol}m${_}\x1b[0m\x1b[0m`;
}


color.namespace = function(_: any): string {
	return `\x1b[${Style.Namespace}m${_}\x1b[0m\x1b[0m`;
}


/** Object is converted into a displayable string (with quotation marks + escapes) and colored. */
color.string = function(_: any, color: Style = Style.String): string {
	return `\x1b[${color}m${JSON.stringify(String(_))}\x1b[0m`;
}


//

export function wrapText(
	text: string,
	max_width: number,
	insert: string = "",
	color_before: Style = Style.Reset,
	color_after: Style = Style.Reset
): string {
	const words = text.split(" ");
	const result: string[] = [];
	let currentLine = "";
	const adjusted_width = max_width;
	let isFirstLine = true;

	for (const word of words) {
		const lineWidth = isFirstLine ? adjusted_width : max_width + insert.length;

		if ((currentLine + word).length > lineWidth) {
			result.push(currentLine.trimEnd());
			currentLine = color(insert, color_after, color_before) + word + " ";
			isFirstLine = false;
		} else {
			currentLine += word + " ";
		}
	}

	result.push(currentLine.trimEnd());

	return result.join("\n");
}


//

/*
export type RGB = [red: number, green: number, blue: number];

export function RGB(red: number, green: number, blue: number): RGB {
	return [red, green, blue];
}


export function colorRGB(r: number, g: number, b: number): string {
	return `\x1b[38;2;${r};${g};${b}m`
}
*/

// Colors in RGB format should be avoided because they cannot be changed by the local user settings.