
import { ANSIColor, color, wrapText } from "../TUI.ts"

import { Line } from "./Line.ts";


//

export class LinearizedCode extends Array<Line> {

	constructor(public readonly component_name: string[]) {
		super();
	}


	/** Displays a human-readable representation of all code lines. */
	displayLines(console_width: number = 80): string {
		const width1  = 4;
		const width2  = 1;
		const width3  = 10;
		const width4  = console_width - width1 - width2 - width3;

		const head = `${"Line".padStart(width1)} : ${"L".padStart(width2)} │ ${"hash".padEnd(width3)} : Code\n`;
		const hr = `${"─".repeat(width1)}───${"─".repeat(width2)}─┼─${"─".repeat(width3)}───${"─".repeat(width4)}\n`;

		const insert = `${" ".padStart(width1)}   ${" ".padStart(width2)} │ ${" ".padEnd(width3)}    `;

		return head + hr + this.map(line => {
			const line_nr = String(line.nr).padStart(width1, " ");
			const level   = String(line.level).padStart(width2, " ");
			const hash    = String(line.hash).padStart(width3, " ");
			const code    = wrapText(color.String(line.code), width4, insert, ANSIColor.Green);
			
			return `${line_nr} : ${level} │ ${hash} : ${code}`;
		}).join("\n");
	}
}
