
import { substitute } from "./General.ts";

import { ANSIColor, bold, color } from "./TUI.ts";

import { Line } from "./Lexer/Line.ts";


//

export enum Phase {
	Warning = 0,
	Building = 1,
	Parsing,
	Resolving,
	Analyzing,
	Running
}


export type PhaseData = { abbr: string, name: string }

export const PhaseData: { [key in Phase]: PhaseData } = {
	[Phase.Warning]: { abbr: "W", name: "Warning" },
	[Phase.Building]: { abbr: "B", name: "Build Error" },
	[Phase.Parsing]: { abbr: "S", name: "Syntax Error" },
	[Phase.Resolving]: { abbr: "N", name: "Name Resolution Error" },
	[Phase.Analyzing]: { abbr: "A", name: "Static Analysis Error" },
	[Phase.Running]: { abbr: "R", name: "Runtime Error" }
};


//

class CompileError {
	readonly number;
	readonly ids;

	/**
	 * Bundles all data required for a meaningful error message and checks whether the specified error code even exists.
	 * @param phase Single-digit number.
	 * @param issue Two-digit number.
	 * @param ids Identifiers to replace wildcards.
	 */
	constructor(
		public readonly phase: Phase,
		public readonly issue: number,
		...ids: Array<string>
	) {
		this.number = (phase * 100) + issue;

		if (!(this.number in CompileErrorMessages)) {
			throw new Error(`'${this.code}' is not a valid error code`)
		}

		this.ids = ids;
	}

	
	/** Text of the error to be displayed, in which any identifiers are already inserted. */
	get message(): string {
		return substitute("#", CompileErrorMessages[this.number], ...this.ids);
	}


	/** Error code as it should be displayed to programmers. */
	get code(): string {
		return `${PhaseData[this.phase].abbr}.${this.issue}`;
	}


	display(max_width: number = 80): string {
		const error = color.Error(`${PhaseData[this.phase].name} ${this.code}`);

		let lines: string[] = [
			`> ${error}`,
			`  ${this.message}`,
		]

		return lines.join("\n") + "\n";
	}

}


export class CodeError extends CompileError {

	/**
	 * Bundles all data required for a meaningful error message and checks whether the specified error code even exists.
	 * @param phase Single-digit number.
	 * @param issue Two-digit number.
	 * @param line Reference to the relevant line object.
	 * @param column_from Index to position in code string (→ starts counting with 0).
	 * @param column_to Index to position in code string (→ starts counting with 0).
	 * @param ids Identifiers to replace wildcards.
	 */
	constructor(
		phase: Phase,
		issue: number,
		public readonly component: string,
		public readonly line: Line,
		public readonly column_from: number,
		public readonly column_to: number,
		...ids: Array<string>
	) {
		super(phase, issue, ...ids);
	}


	get location(): string {
		return `${this.line.nr}:L${this.line.level}+${this.column_from}:${this.column_to}`
	}


	override display(max_width: number = 65): string {
		const error = color.Error(`${PhaseData[this.phase].name} ${this.code}`);
		const line = String(this.line.nr).padStart(4);
		const indent = color("→  ", ANSIColor.BrightBlack).repeat(this.line.level);
		const stress = color.Error("^").repeat(this.column_to - this.column_from);

		const code = this.line.code.replace(/\t/g, " ");
			// Without this replacement, tabs are displayed wider and thus distort the error hint.

		const stress_padding = " ".repeat(this.column_from);

		let lines: string[] = [
			`> ${error} in ${bold(this.component)}:${this.location}`,
			`       ┌╌`,
			`  ${line} ╎  ${indent}${code}`,
			`       └╌ ${" ".repeat(this.line.level * 3)}${stress_padding}${stress}`,
			`  ${this.message}`,
		]

		return lines.join("\n") + "\n";
	}
}


export class CompileErrors extends Array<CompileError | CodeError> {

	constructor(private readonly component: string, ...items: CodeError[]) {
		super(...items);
	}


	pushWarning(
		issue: number, line: Line, column_from: number, column_to: number
	) {
		this.push(new CodeError(
			Phase.Warning, issue, this.component, line, column_from, column_to));
		return this;
	}


	pushBuildError(issue: number, ...ids: string[]) {
		this.push(new CompileError(Phase.Building, issue, ...ids));
		return this;
	}


	pushSyntaxError(
		issue: number,
		line: Line,
		column_from: number,
		column_to: number | null = null,
		...ids: string[]
	) {
		this.push(new CodeError(
			Phase.Parsing,
			issue,
			this.component,
			line,
			column_from,
			column_to === null ? column_from + 1 : column_to,
			...ids
		));
		return this;
	}


	pushNameResolutionError(
		issue: number, line: Line, column_from: number, column_to: number
	) {
		this.push(new CodeError(
			Phase.Resolving, issue, this.component, line, column_from, column_to));
		return this;
	}


	pushStaticAnalysisError(
		issue: number, line: Line, column_from: number, column_to: number
	) {
		this.push(new CodeError(
			Phase.Analyzing, issue,this.component, line, column_from, column_to));
		return this;
	}


	pushRuntimeError(
		issue: number, line: Line, column_from: number, column_to: number
	) {
		this.push(new CodeError(
			Phase.Running, issue, this.component, line, column_from, column_to));
		return this;
	}
} 


//

const CompileErrorMessages: Record<number, string> = {
	// BUILD ERRORS / CLI
	101: "unknown subcommand",
	102: "unknown option",
	103: "wrong arguments",
	104: "wrong argument for option #",

	// BUILD ERRORS / PROJECT DIRECTORY
	121: "invalid plan name",
	122: "invalid source file name",
	123: "invalid folder name",
	124: "plan directory not found",
	125: "resource directory not found",
	
	// SYNTAX ERRORS / LIMITS
	201: "too many lines of code",
	202: "too long code line",
	203: "too many levels of indentation",
	204: "too long name",
	205: "too many namespaces",
	206: "too many parameters",
	207: "too nested data",
	208: "too long string literal for type #",
	209: "too long number literal for type #",
	210: "too long documentation",
	
	// SYNTAX ERRORS / LEXICAL ANALYSIS
	211: "indentation with tabulator",
	212: "illegal tabulator character",
	213: "illegal character",
	214: "illegal character within a word",
	215: "illegal character within a number literal",
	216: "illegal character within a binary literal",
	217: "illegal character within a hexadecimal literal",
	218: "unknown punctuation",
	219: "unknown string prefix",
	220: "missing demarcation from string literal"
	
	// SYNTAX ERRORS / PARSING

}
