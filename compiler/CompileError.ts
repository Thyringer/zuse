
import { substitute } from "./General.ts";


//

export enum Phase {
	Warning = 0,
	Building = 1,
	Parsing = 2,
	Resolving = 3,
	Analyzing = 4,
	Running = 5
}


const PhaseData: { [key in Phase]: [abbr: string, name: string] } = Object.freeze({
	[Phase.Warning]: ["W", "Warning"],
	[Phase.Building]: ["B", "Build Error"],
	[Phase.Parsing]: ["S", "Syntax Error"],
	[Phase.Resolving]: ["N", "Name Resolution Error"],
	[Phase.Analyzing]: ["A", "Static Analysis Error"],
	[Phase.Running]: ["R", "Runtime Error"]
});

export function getPhaseAbbr(phase: Phase) {
	return PhaseData[phase][0]
}

export function getPhaseName(phase: Phase) {
	return PhaseData[phase][1]
}


//

export class ProjectError {

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
		return `${getPhaseAbbr(this.phase)}.${this.issue}`;
	}

}


//

export class ErrorLocation {
	constructor(
		public readonly line_nr: number,
		public readonly column_from: number,
		public readonly column_to: number
	) {}
}


export class CompileError extends ProjectError {

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
		public readonly locations: Array<ErrorLocation> = [],
		...ids: Array<string>
	) {
		super(phase, issue, ...ids);
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
	218: "invalid number literal",
	219: "invalid number literal: missing integer part before fraction part",
	220: "invalid number literal: missing decimal point before repetend",
	221: "invalid number literal: uncompleted repetend",
	222: "invalid string literal",
	223: "missing demarcation",
	224: "missing demarcation between literals",
	225: "missing demarcation from number literal",
	226: "missing demarcation from string literal",
	227: "unknown string prefix",
	228: "unknown punctuation",
	
	// SYNTAX ERRORS / PARSING

}
