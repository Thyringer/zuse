
import { LexicalCategory, Demarcators, Token, Tokens } from "./Token.ts";


//

enum Prelexing {
	Nothing,
	Anything,
	Whitespace,
	Demarcating,
	SingleQuoteString,
	DoubleQuoteString
}


/** Breaks down a line of code into its lexemes without performing any lexical analysis, identifying whitespace, reserved symbols, strings and documentation. Words and number literals remain uncategorized (→ undefined). */
export function tokenizeLine(code_line: string): Tokens {
	const length = code_line.length;
	let start = 0;
	let index = 0;
	let category: LexicalCategory | undefined;
	const tokens: Tokens = [];
	

	function push(
		type: LexicalCategory | undefined = undefined,
		lexeme: null | undefined = undefined
	) {
		const end = index + 1 > length ? index : index + 1;
		tokens.push(new Token(
			type,
			lexeme === undefined ? code_line.slice(start, end) : lexeme,
			start,
			end
		));
		start = end;
	};


	function pushAfterwards(
		type: LexicalCategory | undefined = undefined,
		lexeme: null | undefined = undefined
	) {
		tokens.push(new Token(
			type,
			lexeme === undefined ? code_line.slice(start, index) : lexeme,
			start,
			index
		));
		start = index;
	};


	function pushComment() {
		tokens.push(new Token(
			LexicalCategory.Documentation,
			code_line.slice(start, length),
			start,
			length
		));
	};


	let context = Prelexing.Nothing;
	let char: string;
	let prev_char: string | undefined;

	for (index; index < length; index++) {
		char = code_line[index];
		prev_char = code_line[index - 1];

		switch (context) {
			case Prelexing.Nothing:
				if (char === ' ') {
					context = Prelexing.Whitespace;
				} else if (char === '\'') {
					context = Prelexing.SingleQuoteString;
				} else if (char === '"') {
					context = Prelexing.DoubleQuoteString;
				} else if (char === '#') {
					pushComment();
					return tokens;
				} else if (char in Demarcators) {
					if (Demarcators[char]) {
						push();
					} else {
						context = Prelexing.Demarcating;
					}
				} else {
					context = Prelexing.Anything;
				}
				break;

			case Prelexing.Anything:
				if (char === ' ') {
					pushAfterwards();
					context = Prelexing.Whitespace;
				} else if (char === '\'') {
					pushAfterwards();
					context = Prelexing.SingleQuoteString;
				} else if (char === '"') {
					pushAfterwards();
					context = Prelexing.DoubleQuoteString;
				} else if (char === '#') {
					pushAfterwards();
					pushComment();
					return tokens;
				} else if (char in Demarcators) {
					pushAfterwards();
					if (Demarcators[char]) {
						push();
						context = Prelexing.Nothing;
					} else {
						context = Prelexing.Demarcating;
					}
				}
				break;

			case Prelexing.Whitespace:
				if (char === '\'') {
					pushAfterwards(LexicalCategory.Whitespace, null);
					context = Prelexing.SingleQuoteString;
				} else if (char === '"') {
					pushAfterwards(LexicalCategory.Whitespace, null);
					context = Prelexing.DoubleQuoteString;
				} else if (char === '#') {
					pushAfterwards(LexicalCategory.Whitespace, null);
					pushComment();
					return tokens;
				} else if (char in Demarcators) {
					pushAfterwards(LexicalCategory.Whitespace, null);
					if (Demarcators[char]) {
						push();
						context = Prelexing.Nothing;
					} else {
						context = Prelexing.Demarcating;
					}
				} else if (char !== ' ') {
					pushAfterwards(LexicalCategory.Whitespace, null);
					context = Prelexing.Anything;
				}
				break;

			case Prelexing.Demarcating:
				if (char === ' ') {
					pushAfterwards();
					context = Prelexing.Whitespace;
				} else if (char === '\'') {
					context = Prelexing.SingleQuoteString;
				} else if (char === '"') {
					context = Prelexing.DoubleQuoteString;
				} else if (char === '#') {
					pushComment();
					return tokens;
				} else if (code_line.substring(start, index + 1) in Demarcators) {
					push();
					context = Prelexing.Nothing;
				} else {
					pushAfterwards();
					context = Prelexing.Anything;
				}
				break;

			case Prelexing.SingleQuoteString:
				if (char === '\'') {
					push(LexicalCategory.RawString);
					context = Prelexing.Nothing;
				}
				break;

			case Prelexing.DoubleQuoteString:
				if (prev_char !== '\\' && char === '"') {
					push(LexicalCategory.String);
					context = Prelexing.Nothing;
				}
				break;
		}
	}

	if (start < index) {
		push();
	}

	return tokens;
}



