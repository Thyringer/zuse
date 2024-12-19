 
import { CompileError, Phase, getPhaseAbbr, getPhaseName } from "../CompileError.ts"
import { color, Style, wrapText } from "../TUI.ts"

import { ID } from "./Declaration.ts";
import { Line } from "./Line.ts";


//

export class Unit {

	id: ID;
	errors: Array<CompileError>;
	lines: Map<number, Line>;
	

	constructor(id: Array<string>) {
		this.id = new ID(...id);
		this.errors = [];
		this.lines = new Map();
		
	}
	

	//

	private displayError(error: CompileError, console_width: number = 80): string {
		const title = color.error(`${getPhaseName(error.phase)} ${error.code}`);

		if (error.locations.length === 0) {
			let lines: string[] = [
				`> ${title} in ${this.id.display}`,
				`  ${error.message}`,
			]
			
			return lines.join("\n") + "\n";
		}
		else if (error.locations.length === 1) {
			const location = error.locations[0];
			const line = this.lines.get(location.line_nr)!;
			const location_display = `${this.id.display}:${location.line_nr}:L${line.level}+${location.column_from + 1}:${location.column_to + 1}`;

			const line_nr = String(location.line_nr).padStart(4);
			const indent = color("→  ", Style.Comment).repeat(line.level);
			const stress = color.error("^").repeat(location.column_to - location.column_from);
	
			const code = line.code.replace(/\t/g, " ");
				// Without this replacement, tabs are displayed wider and thus distort the error hint.
	
			const stress_padding = " ".repeat(location.column_from);
	
			let lines: string[] = [
				`> ${title} in ${color.namespace(this.id.display)}:${location_display}`,
				`       ┌╌`,
				`  ${line_nr} ╎  ${indent}${code}`,
				`       └╌ ${" ".repeat(line.level * 3)}${stress_padding}${stress}`,
				`  ${error.message}`,
			]

			return lines.join("\n") + "\n";
		}
		else {
			const first = error.locations[0];
			const first_line = this.lines.get(first.line_nr)!;
			const last = error.locations.at(-1)!;
			const last_line = this.lines.get(last.line_nr)!;

			const location_display = `${this.id.display}:${first.line_nr}:L${first_line.level}+${first.column_from}...${last.line_nr}:L${last_line.level}+${last.column_from}`;

			return location_display;
		}
	}


	displayErrors(): string {
		return this.errors.map(err => this.displayError(err)).join('\n\n');
	}


	displayLines(console_width: number = 80): string {
		const width1 = 4;
		const width2 = 1;
		const width3 = 10;
		const width4 = console_width - width1 - width2 - width3;

		const head = `${"Line".padStart(width1)} : ${"L".padStart(width2)} │ ${"hash".padEnd(width3)} : Code\n`;
		const hr = `${"─".repeat(width1)}───${"─".repeat(width2)}─┼─${"─".repeat(width3)}───${"─".repeat(width4)}\n`;

		const insert = `${" ".padStart(width1)}   ${" ".padStart(width2)} │ ${" ".padEnd(width3)}    `;

		return head + hr + Array.from(this.lines.entries()).map(([nr, line]) => {
			const line_nr = String(nr).padStart(width1, " ");
			const level = String(line.level).padStart(width2, " ");
			const hash = String(line.hash).padEnd(width3, " ");
			const code = wrapText(color.string(line.code), width4, insert, Style.String);
			
			return `${line_nr} : ${level} │ ${hash} : ${code}`;
		}).join("\n");
	}


	/** Displays a human-readable representation of all tokens. */
	displayTokens(console_width: number = 80): string {
		const width1 = 16;
		const width2 = 18;
		const width3 = console_width - width1 - width2;

		const head = `${"Indexes : L".padStart(width1, " ")} │ ${"Category".padEnd(width2, " ")} : Lexeme\n`
		const hr = `${"─".repeat(width1)}─┼─${"─".repeat(width2)}───${"─".repeat(width3)}\n`

		const insert = " ".repeat(width1) + " │ " + " ".repeat(width2 + 4);

		return head + hr + Array.from(this.lines.entries()).map(([nr, line]) => {
			if (line.tokens) {
				//console.log(`displayTokens::line.tokens = ${JSON.stringify(line.tokens)}`);
				
				return line.tokens.map(token => {
					//console.log(`displayTokens::token = ${JSON.stringify(token)}`);
					const line_nr  = String(nr).padStart(4, " ");
					const col_from = String(token.from).padStart(3, " ");
					const col_to   = String(token.to).padStart(3, " ");
					const level    = String(line.level).padStart(1, " ");
					const category = token.displayName().padEnd(width2, " ");

					const lexeme   = wrapText(
						token.displayLexeme(),
						width3,
						insert,
						token.invalid ? Style.Error : Style.String
					);

					return `${line_nr} ${col_from} ${col_to} : ${level} │ ${category} : ${lexeme}`;
				}).join("\n");
			} else {
				return "";
			}
		}).join("\n");
	}
}