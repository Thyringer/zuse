
import { CompileError, ErrorLocation, Phase } from "../CompileError.ts";
import { natural_number } from "../General.ts";
import { Tab } from "../Presets.ts";

import { Codepoint, Presort } from "./Codepoint.ts";
import { Line } from "./Line.ts";
import { linearize, LinearizedUnit } from "./Linearizer.ts";
import { isPunctuation } from "./Token.ts";
import { isDemarcating, isUnambiguous, LexicalCategory, Token, Tokens } from "./Token.ts";
import { Unit } from "./Unit.ts";


/*

EXPLANATIONS OF THE LEXER STRUCTURE

The lexer works line by line, which is possible since there are no multi-line lexemes in Kalkyl. Tokenization takes place in a single loop, made possible by remembering previous characters and their properties such as code point and lexical category. Only in very few places is the next character examined in advance for the sake of simplicity.

*/


type TokenizedUnit = Unit;  


function tokenize(unit: LinearizedUnit): TokenizedUnit {
	const lexer = new Lexer();

	lexer.logError = (issue, from, to = undefined) => {
		unit.errors.push(new CompileError(
			Phase.Parsing,
			issue,
			[new ErrorLocation(lexer.line_nr, from, to === undefined ? from + 1 : to)]
		))

		lexer.invalid = true;
	}

	unit.lines.forEach((line: Line, line_nr: number) => {
		line.tokens = translateLine(lexer, line_nr, line);
	});

	return unit;
}


//

enum Lexing {
	Demarcated,
		// Beginning of a line or state after a demarcating lexeme, after which any valid lexeme can directly follow.
	Whitespace,
	Punctuation,
		// Presence of all punctuation marks, including demarcating ones.
	Word,
		// General mode that examines all keywords and names.
	Number,
		// General mode that handles all number literals.
	DoubleQuoteString,
	SingleQuoteString,
		// In the string state, all chars are passed, except (unmasked) quotation marks marking the end.
	Documentation,
		// Only serves to tell the lexer that the line should not be tokenized further
	Undemarcated
		// State that follows directly after non-demarcating lexemes and thus requires whitespace or demarcating punctuation such as parentheses.
}


function lexing(category: LexicalCategory): Lexing {
	switch (category) {
		case LexicalCategory.Whitespace: {
			return Lexing.Whitespace;
		}
		case LexicalCategory.Punctuation: {
			return Lexing.Punctuation;
		}
		case LexicalCategory.Keyword: {
			return Lexing.Word;
		}
		case LexicalCategory.UncapitalizedName: {
			return Lexing.Word;
		}
		case LexicalCategory.Label: {
			return Lexing.Word;
		}
		case LexicalCategory.Predicate: {
			return Lexing.Word;
		}
		case LexicalCategory.CapitalizedName: {
			return Lexing.Word;
		}
		case LexicalCategory.Integer: {
			return Lexing.Number;
		}
		case LexicalCategory.BinaryInteger: {
			return Lexing.Number;
		}
		case LexicalCategory.HexadecimalInteger: {
			return Lexing.Number;
		}
		case LexicalCategory.Fraction: {
			return Lexing.Number;
		}
		case LexicalCategory.Repetend: {
			return Lexing.Number;
		}
		case LexicalCategory.String: {
			return Lexing.DoubleQuoteString;
		}
		case LexicalCategory.RawString: {
			return Lexing.SingleQuoteString;
		}
		case LexicalCategory.Binary: {
			return Lexing.SingleQuoteString;
		}
		case LexicalCategory.Hex: {
			return Lexing.SingleQuoteString;
		}
		case LexicalCategory.Documentation: {
			return Lexing.Documentation;
		}
	}
}


//

export class Lexer {

	line_nr!: number;
	line!: Line;
	logError!: (issue: number, column_from: number, column_to?: number | undefined) => void;

	start!: natural_number;
		// At which string index does the actual lexeme start?
	offset!: natural_number;
		// How many characters at the beginning of the lexeme are not needed for further processing?

	index!: number;
		// Refers to the current character of the code line processed.

	#context!: Lexing;

	codepoint!: Codepoint;
	presort!: Presort;
	category!: LexicalCategory | null;
	invalid!: boolean

	last!: {
		codepoint: Codepoint | null;
		presort: Presort | null;
		token: Token | null;
		category: LexicalCategory | null
	};
	
	tokens!: Tokens;


	// VARIOUS AUXILIARY METHODS

	get next(): Codepoint {
		return new Codepoint(this.line.code[this.index + 1]);
	}


	get context(): Lexing {
		return this.#context;
	}


	switch(category: LexicalCategory) {
		this.#context = lexing(category);
		this.category = category;
	}


	switchToDemarcated() {
		this.#context = Lexing.Demarcated;
	}


	switchToUndemarcated() {
		this.#context = Lexing.Undemarcated;
	}


	isBinInteger(): boolean {
		return this.category === LexicalCategory.BinaryInteger
		    || this.last.category === LexicalCategory.BinaryInteger &&
		       this.category === LexicalCategory.Fraction
			|| this.last.category === LexicalCategory.BinaryInteger &&
			   this.category === LexicalCategory.Repetend
					// This case is actually syntactically incorrect, but must be captured for an appropriate error message. 
		    || this.tokens.at(-2)?.category === LexicalCategory.BinaryInteger &&
		       this.last.category === LexicalCategory.Fraction &&
		       this.category === LexicalCategory.Repetend;
	}


	isHexInteger(): boolean {
		return this.category === LexicalCategory.HexadecimalInteger
		    || this.last.category === LexicalCategory.HexadecimalInteger &&
		       this.category === LexicalCategory.Fraction
			|| this.last.category === LexicalCategory.HexadecimalInteger &&
			   this.category === LexicalCategory.Repetend
					// This case is actually syntactically incorrect, but must be captured for an appropriate error message. 
		    || this.tokens.at(-2)?.category === LexicalCategory.HexadecimalInteger &&
		       this.last.category === LexicalCategory.Fraction &&
		       this.category === LexicalCategory.Repetend;
	}


	/** Does the repeating decimal part end with a right round bracket? If not, print the corresponding error. */
	checkPossibleRepetend() {
		if (this.category === LexicalCategory.Repetend &&
		    this.last.codepoint!.value !== Codepoint.RightParenthesis
		) {
			this.logError(21, this.start, this.index);
		}
	}


	logDemarcationError(issue: 23 | 24 | 25 | 26 = 23) {
		this.logError(issue, this.index - 1, this.index + 1);
	}


	// PUSHING TOKENS

	reset(start: number) {
		this.category = null;
		this.invalid = false;
		this.start = start;
		this.offset = 0;
	}


	/** Pushes a new token up to the current character. */
	push() {
		const end = this.index + 1 > this.line.code.length ? this.index : this.index + 1;

		this.last.token = new Token(
			this.category,
			this.line.code.slice(this.start + this.offset, end),
			this.start,
			end,
			this.invalid
		)

		this.tokens.push(this.last.token);
		this.last.category = this.category;
		this.reset(end);
	}


	/** Pushes a token, stopping before the current index. */
	pushAfterwards() {
		this.last.token = new Token(
			this.category,
			this.category === LexicalCategory.Whitespace
				? null
				: this.line.code.slice(this.start + this.offset, this.index),
			this.start,
			this.index,
			this.invalid
		)

		this.tokens.push(this.last.token);
		this.last.category = this.category;
		this.reset(this.index);
	}


	/** Pushes a comment token for the rest of the line. Context switching is done automatically. */
	pushComment() {
		this.tokens.push(new Token(
			LexicalCategory.Documentation,
			this.line.code.slice(this.start + 2, this.line.code.length).trim(),
			this.start,
			this.line.code.length
		));

		this.#context = Lexing.Documentation;
	}

}


/** Breaks down a line of code into its lexemes without performing any lexical analysis, identifying whitespace, reserved symbols, strings and documentation. Words and number literals remain uncategorized (→ undefined). */
function translateLine(lexer: Lexer, line_nr: number, line: Line): Tokens {
	lexer.line_nr = line_nr;
	lexer.line = line;

	lexer.reset(0);

	lexer.start = 0;
	lexer.offset = 0;
	lexer.index = 0;

	lexer.switchToDemarcated();

	lexer.category = null;
		// If defined in advance, lexer will be preferred over the pushed variant.
	lexer.invalid = false;

	lexer.last = {
		codepoint: null,
		presort: null,
		token: null,
		category: null
	};

	lexer.tokens = [];

	for (lexer.index; lexer.index < line.code.length; lexer.index++) {

		if ((lexer.context as Lexing) === Lexing.Documentation) {
			return lexer.tokens;
				// Since a line comment was found in the previous iteration, stop tokenizing.
		}
		else {
			lexer.codepoint = new Codepoint(line.code[lexer.index]);
			lexer.presort = lexer.codepoint.presort();
	
			switch (lexer.context as Lexing) {
				case Lexing.Demarcated: {
					handleDemarcated(lexer);
					break;
				}
				case Lexing.Whitespace: {
					handleWhitespace(lexer);
					break;
				}
				case Lexing.Punctuation: {
					handlePunctuation(lexer);
					break;
				}
				case Lexing.Word: {
					handleWord(lexer);
					break
				}
				case Lexing.Number: {
					handleNumber(lexer);
					break
				}
				case Lexing.DoubleQuoteString: {
					if (lexer.codepoint.value === Codepoint.DoubleQuote &&
						lexer.last.codepoint!.value !== Codepoint.Backslash
					) {
						lexer.offset++;
						lexer.pushAfterwards();
							// Push without the current character (quote mark).
						lexer.start++;
						lexer.switchToUndemarcated();
					}
					break;
				}
				case Lexing.SingleQuoteString: {
					if (lexer.codepoint.value === Codepoint.SingleQuote) {
						if (lexer.category === LexicalCategory.RawString &&
							lexer.next.value === Codepoint.SingleQuote
						) {								
							lexer.index += 1;
						}
						else {
							lexer.offset++;
							lexer.pushAfterwards();
							lexer.start++;
							lexer.switchToUndemarcated();
						}
					};
					break;
				}
				case Lexing.Undemarcated: {
					handleUndemarcated(lexer);
					break;
				}
			}

			lexer.last.codepoint = lexer.codepoint;
			lexer.last.presort = lexer.presort;
		}
	}

	if (lexer.start < lexer.index) {
		lexer.push();
	}

	return lexer.tokens;
}


// HANDLERS

function handleDemarcated(lexer: Lexer): void {
	lexer.invalid = false;

	switch (lexer.presort) {
		case Presort.Tab: {
			lexer.logError(lexer.index === 0 ? 11 : 12, lexer.index);
			break;
		}
		case Presort.Space: {
			lexer.switch(LexicalCategory.Whitespace);
			break;
		}
		case Presort.Hash: {
			lexer.pushComment();
			break;
		}
		case Presort.Digit: {
			lexer.switch(LexicalCategory.Integer);
			break;
		}
		case Presort.CapitalLetter: {
			lexer.switch(LexicalCategory.CapitalizedName);
			break
		}
		case Presort.SmallLetter: {
			lexer.switch(LexicalCategory.UncapitalizedName);
			break
		}
		case Presort.DoubleQuote: {
			lexer.switch(LexicalCategory.String);
			break;
		}
		case Presort.SingleQuote: {
			lexer.switch(LexicalCategory.RawString);
			break;
		}
		case Presort.Sign:
		case Presort.Demarcator:
		case Presort.Punctuation: {
			if (isUnambiguous(lexer.codepoint.char)) {
				lexer.push();
				lexer.switchToDemarcated()
			}
			else {
				lexer.switch(LexicalCategory.Punctuation);
			}
			break;
		}
		case Presort.Other: {
			lexer.logError(13, lexer.index);
			break;
		}
	}
}


function handleUndemarcated(lexer: Lexer): void {
	lexer.invalid = false;

	switch (lexer.presort) {
		// deno-lint-ignore no-fallthrough
		case Presort.Tab: {
			lexer.logError(12, lexer.index);
		}
		case Presort.Space: {
			lexer.switch(LexicalCategory.Whitespace);
			break;
		}
		case Presort.Hash: {
			lexer.pushComment();
			break;
		}
		case Presort.Digit: {
			lexer.logDemarcationError(25);
			lexer.switch(LexicalCategory.Integer);
			break;
		}
		case Presort.CapitalLetter: {
			lexer.logDemarcationError(23);
			lexer.switch(LexicalCategory.CapitalizedName);
			break
		}
		case Presort.SmallLetter: {
			lexer.logDemarcationError(23);
			lexer.switch(LexicalCategory.UncapitalizedName);
			break
		}
		case Presort.DoubleQuote: {
			lexer.logDemarcationError(26);
			lexer.switch(LexicalCategory.String);
			break;
		}
		case Presort.SingleQuote: {
			lexer.logDemarcationError(26);
			lexer.switch(LexicalCategory.RawString);
			break;
		}
		case Presort.Sign:
		case Presort.Demarcator:
		case Presort.Punctuation: {
			if (isUnambiguous(lexer.codepoint.char)) {
				lexer.push();
				lexer.switchToDemarcated()
			}
			else {
				lexer.switch(LexicalCategory.Punctuation);
			}
			break;
		}
		case Presort.Other: {
			lexer.logError(13, lexer.index);
			break;
		}
	}
}


function handleWhitespace(lexer: Lexer): void {
	switch (lexer.presort) {
		case Presort.Tab: {
			lexer.logError(12, lexer.index);
			break;
		}
		case Presort.Space: {
			break;
		}
		case Presort.Hash: {
			lexer.pushAfterwards();
			lexer.pushComment();
			break;
		}
		case Presort.Digit: {
			lexer.pushAfterwards();
			lexer.switch(LexicalCategory.Integer);
			break;
		}
		case Presort.CapitalLetter: {
			lexer.pushAfterwards();
			lexer.switch(LexicalCategory.CapitalizedName);
			break
		}
		case Presort.SmallLetter: {
			lexer.pushAfterwards();
			lexer.switch(LexicalCategory.UncapitalizedName);
			break
		}
		case Presort.DoubleQuote: {
			lexer.pushAfterwards();
			lexer.switch(LexicalCategory.String);
			break;
		}
		case Presort.SingleQuote: {
			lexer.pushAfterwards();
			lexer.switch(LexicalCategory.RawString);
			break;
		}	
		case Presort.Sign:
		case Presort.Demarcator:
		case Presort.Punctuation: {
			lexer.pushAfterwards();
			if (isUnambiguous(lexer.codepoint.char)) {
				lexer.push();
				lexer.switchToDemarcated()
			}
			else {
				lexer.switch(LexicalCategory.Punctuation);
			}
			break;
		}
		default: {
			lexer.pushAfterwards();
			lexer.logError(13, lexer.index);
			lexer.switchToDemarcated();
			break;
		}
	}
}


function handlePunctuation(lexer: Lexer): void {
	switch (lexer.presort) {
		case Presort.Tab: {
			lexer.pushAfterwards();
			lexer.logError(12, lexer.index);
			lexer.switch(LexicalCategory.Whitespace);
			break;
		}
		case Presort.Space: {
			lexer.pushAfterwards();
			lexer.switch(LexicalCategory.Whitespace);
			break;
		}
		case Presort.Hash: {
			lexer.pushAfterwards();
			lexer.pushComment();
			break;
		}
		case Presort.Digit: {
			lexer.pushAfterwards();
			if (lexer.last.presort !== Presort.Demarcator) {
				lexer.logDemarcationError(25);
			}
			lexer.switch(LexicalCategory.Integer);
			break;
		}
		case Presort.CapitalLetter: {
			const lexeme = lexer.line.code[lexer.start];
			if (lexeme[0] !== "+" && lexeme[0] !== "-") {
				lexer.pushAfterwards();
				if (lexer.last.presort !== Presort.Demarcator) lexer.logDemarcationError(23);
			}
			lexer.switch(LexicalCategory.CapitalizedName);
			break
		}
		case Presort.SmallLetter: {
			const lexeme = lexer.line.code[lexer.start];
			if (lexeme[0] === "-") {
				lexer.switch(LexicalCategory.Label);
			}
			else if (lexeme[0] === "+") {
				lexer.switch(LexicalCategory.UncapitalizedName);
			}
			else {
				lexer.pushAfterwards();
				if (lexer.last.presort !== Presort.Demarcator) lexer.logDemarcationError(23);
				lexer.switch(LexicalCategory.UncapitalizedName);
			}
			break
		}
		case Presort.DoubleQuote: {
			lexer.pushAfterwards();
			if (lexer.last.presort !== Presort.Demarcator) {
				lexer.logDemarcationError(26);
			}
			lexer.switch(LexicalCategory.String);
			break;
		}
		case Presort.SingleQuote: {
			lexer.pushAfterwards();
			if (lexer.last.presort !== Presort.Demarcator) {
				lexer.logDemarcationError(26);
			}
			lexer.switch(LexicalCategory.RawString);
			break;
		}	
		case Presort.Sign:
		case Presort.Demarcator:
		case Presort.Punctuation: {
			const lexeme = lexer.line.code.slice(lexer.start, lexer.index + 1);
			if (isPunctuation(lexeme)) {
				if (isDemarcating(lexeme)) {
					lexer.switchToDemarcated();
				} else {
					lexer.switchToUndemarcated();
				}
			}	
			else {
				lexer.logError(28, lexer.start, lexer.index + 1);
				lexer.switchToDemarcated();
			}
			lexer.push();
			break;
		}
		default: {
			lexer.pushAfterwards();
			lexer.logError(13, lexer.index);
			lexer.switchToDemarcated();
			break;
		}
	}
}


function handleWord(lexer: Lexer): void {
	switch (lexer.presort) {
		case Presort.Tab: {
			lexer.pushAfterwards();
			lexer.logError(12, lexer.index);
			lexer.switchToDemarcated();
			break;
		}
		case Presort.Space: {
			lexer.pushAfterwards();
			lexer.switch(LexicalCategory.Whitespace);
			break;
		}
		case Presort.Hash: {
			lexer.pushAfterwards();
			lexer.pushComment();
			break;
		}
		case Presort.Sign:
		case Presort.Digit:
		case Presort.CapitalLetter:
		case Presort.SmallLetter: {
			break;
		}
		case Presort.DoubleQuote: {
			lexer.pushAfterwards();
			lexer.logDemarcationError(26);
			break;
		}
		case Presort.SingleQuote: {		
			// Check if previous lexeme could possibly be a string prefix:
			if ((lexer.index - lexer.start) === 1) {
				if (lexer.last.codepoint!.isBinPrefix()) {
					lexer.switch(LexicalCategory.Binary);
				}
				else if (lexer.last.codepoint!.isHexPrefix()) {
					lexer.switch(LexicalCategory.Hex);
				}
				else {
					lexer.logError(27, lexer.index - 1, lexer.index);
					lexer.switch(LexicalCategory.RawString);
				}
				lexer.offset++;
					// Remove prefix in advance as it is not needed for further processing.
			}
			else {
				lexer.logDemarcationError(26);
				lexer.switch(LexicalCategory.RawString);
			}
			break;
		}
		case Presort.Demarcator: {
			if (lexer.codepoint.value === Codepoint.QuestionMark) {
				lexer.category = LexicalCategory.Predicate;
				lexer.push();
				lexer.switchToUndemarcated();
			}
			else if (isUnambiguous(lexer.codepoint.char)) {
				lexer.pushAfterwards();
				lexer.push();
				lexer.switchToDemarcated();
			}
			else {
				lexer.pushAfterwards();
				lexer.switch(LexicalCategory.Punctuation);
			}
			break;
		}
		case Presort.Punctuation:
		case Presort.Other: {
			lexer.logError(14, lexer.index);
			break;
		}
	}
}


function handleNumber(lexer: Lexer): void {
	switch (lexer.presort) {
		case Presort.Tab: {
			lexer.checkPossibleRepetend();
			lexer.pushAfterwards();
			lexer.logError(12, lexer.index);
			lexer.switchToDemarcated();
			break;
		}
		case Presort.Space: {
			lexer.checkPossibleRepetend();
			lexer.pushAfterwards();
			lexer.switch(LexicalCategory.Whitespace);
			break;
		}
		case Presort.Hash: {
			lexer.checkPossibleRepetend();
			lexer.pushAfterwards();
			lexer.pushComment();
			break;
		}
		case Presort.Digit: {
			if (lexer.isBinInteger() && !lexer.codepoint.isBinDigit()) {
				lexer.logError(16, lexer.index);
			}
			break;
		}
		case Presort.CapitalLetter:
		case Presort.SmallLetter: {
			if (lexer.category === LexicalCategory.Integer && (lexer.index - lexer.start) === 1 &&
				lexer.last.codepoint!.value === Codepoint.Zero
			) {
				if (lexer.codepoint.isBinPrefix()) {
					lexer.category = LexicalCategory.BinaryInteger;
					lexer.offset += 2;
				}
				else if (lexer.codepoint.isHexPrefix()) {						
					lexer.category = LexicalCategory.HexadecimalInteger;
					lexer.offset += 2;
				}
				else {
					lexer.logError(15, lexer.index);
				}
			}
			else if (lexer.isHexInteger() && !lexer.codepoint.isHexDigit()) {
				lexer.logError(17, lexer.index);
			}
			else if (!lexer.isHexInteger()) {
				lexer.logError(15, lexer.index);
			}
			break;
		}
		case Presort.DoubleQuote: {
			lexer.pushAfterwards();
			lexer.switch(LexicalCategory.String);
			break;
		}
		case Presort.SingleQuote: {
			lexer.pushAfterwards();
			lexer.switch(LexicalCategory.RawString);
			break;
		}	
		case Presort.Demarcator: {
			lexer.pushAfterwards();
			switch (lexer.codepoint.value) {
				case Codepoint.Period: {
					lexer.category = LexicalCategory.Fraction;
					lexer.offset = 1
					if (!lexer.last.token!.isInteger()) {
						lexer.logError(18, lexer.last.token!.from, lexer.index + 1);
					}
					break;
				}
				case Codepoint.LeftParenthesis: {
					lexer.category = LexicalCategory.Repetend;
					lexer.offset = 1
					if (!lexer.last.token!.isDecimalPlace()) {
						lexer.logError(20, lexer.last.token!.from, lexer.index + 1);
					}
					break;
				}			
				case Codepoint.RightParenthesis: {
					lexer.push();
					lexer.switchToDemarcated();
					break;
				}				
				default: {
					if (isUnambiguous(lexer.codepoint.char)) {
						lexer.push();
						lexer.switchToDemarcated();
					}
					else {
						lexer.switch(LexicalCategory.Punctuation);
					}
				}
			}
			break;
		}
		case Presort.Punctuation: {
			lexer.logDemarcationError(25);
			lexer.pushAfterwards();
			lexer.switchToUndemarcated();
			break;
		}
		default: {
			lexer.logError(lexer.isBinInteger() ? 16 : lexer.isHexInteger() ? 17 : 15, lexer.index);
			lexer.pushAfterwards();
			lexer.switchToDemarcated();
			break;
		}
	}
}


//

Deno.test("Lexer", async () => {
	const file_path = "./tests/Collatz.k";
	const component_id = ["Test", "Collatz"];
	const source_code = await Deno.readTextFile(file_path);

	let start;
	let end;

	console.log("Measuring performance...");
	start = performance.now();

	const unit = tokenize(linearize(source_code, component_id, Tab));

	console.log(`\n${unit.displayTokens(82)}`);
	console.log(`\n${unit.displayErrors()}`);

	end = performance.now();
	console.log(`\n${end - start}ms`);
});