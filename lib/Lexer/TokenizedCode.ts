
import { CodeError, Phase, PhaseData } from "../CompileError.ts"
import { ANSIColor, color, wrapText } from "../TUI.ts"

import { LinearizedCode } from "./LinearizedCode.ts";


//

export class TokenizedCode extends LinearizedCode {

	constructor(code: LinearizedCode) {
		super(code.component_name);
		this.push(...Array.from(code));
	}


	/** Displays a human-readable representation of all tokens. */
	displayTokens(console_width: number = 80): string {
		const width1  = 16;
		const width2  = 18;
		const width3  = console_width - width1 - width2;

		const head = `${"Indexes : L".padStart(width1, " ")} │ ${"Category".padEnd(width2, " ")} : Lexeme\n`
		const hr = `${"─".repeat(width1)}─┼─${"─".repeat(width2)}───${"─".repeat(width3)}\n`

		const insert = " ".repeat(width1) + " │ " + " ".repeat(width2 + 4);

		return head + hr + this.map(line => {
			if (line.tokens) {
				//console.log(`displayTokens::line.tokens = ${JSON.stringify(line.tokens)}`);
				
				// Join the token substrings for the line, separated by spaces
				return line.tokens.map(token => {
					//console.log(`displayTokens::token = ${JSON.stringify(token)}`);
					
					const line_nr  = String(line.nr).padStart(4, " ");
					const col_from = String(token.from).padStart(3, " ");
					const col_to   = String(token.to).padStart(3, " ");
					const level    = String(line.level).padStart(1, " ");
					const category = token.display_name.padEnd(width2, " ");

					const lexeme   = ` : ${wrapText(token.display_lexeme, width3, insert, ANSIColor.Green)}`;

					return `${line_nr} ${col_from} ${col_to} : ${level} │ ${category}${lexeme}`;
				}).join("\n");
			} else {
				return "";
			}
		}).join("\n");
	}
}
